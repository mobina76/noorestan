using Microsoft.EntityFrameworkCore;
using Noorestan.Api.Features.Catalog;
using Noorestan.Api.Features.Catalog.Search;
using Noorestan.Api.Infrastructure.Images;
using Noorestan.Api.Infrastructure.Persistence;
using Noorestan.MazinoorImport.Extraction;
using Noorestan.MazinoorImport.Retrieval;

namespace Noorestan.Api.Features.CatalogImports;

/// <summary>
/// Orchestrates an owner-triggered official Mazinoor import: fetches each supplied product URL
/// through the isolated Mazinoor module, and — outside dry-run — writes ordinary draft products
/// through the same catalog rules the admin UI uses. Never invoked from a public/catalog request
/// path, and only one run may be active at a time.
/// </summary>
public sealed class MazinoorImportRunner(AppDbContext db, MazinoorExtractor extractor, MazinoorHttpSource httpSource, IObjectStorage storage, IImageProcessor imageProcessor)
{
    public async Task<ImportRun> RunAsync(Guid ownerId, Guid categoryId, IReadOnlyList<string> sourceUrls, ImportMode mode, CancellationToken cancellationToken)
    {
        if (await db.ImportRuns.AnyAsync(r => r.Status == ImportRunStatus.Queued || r.Status == ImportRunStatus.Running, cancellationToken))
            throw new InvalidOperationException("یک عملیات دریافت محصول از مازی‌نور در حال اجراست.");

        var category = await db.Categories.Include(c => c.Specifications).SingleOrDefaultAsync(c => c.Id == categoryId, cancellationToken)
            ?? throw new InvalidOperationException("دسته‌بندی انتخاب‌شده معتبر نیست.");

        var run = new ImportRun
        {
            SourceBaseUrl = "https://www.mazinoor.com",
            ExtractorVersion = "1.0",
            Mode = mode,
            Status = ImportRunStatus.Running,
            StartedAt = DateTimeOffset.UtcNow,
            RequestedBy = ownerId,
        };
        db.ImportRuns.Add(run);
        await db.SaveChangesAsync(cancellationToken);

        var newCount = 0;
        var unchangedCount = 0;
        var invalidCount = 0;
        var failedCount = 0;

        foreach (var sourceUrl in sourceUrls)
        {
            var item = new ImportItem { ImportRunId = run.Id, CanonicalSourceUrl = sourceUrl, FetchedAt = DateTimeOffset.UtcNow };
            try
            {
                var uri = new Uri(sourceUrl);
                var extracted = await extractor.ExtractProductAsync(uri, category.Slug, cancellationToken);
                item.MazinoorProductCode = extracted.MazinoorProductCode;
                item.SourceContentHash = extracted.Trace.SourceContentHash;

                // The canonical source URL is preferred for idempotency: a Mazinoor family page can list
                // its SKU variants in a different order between scrapes, so the "representative" product
                // code chosen for a given URL is not guaranteed stable, while the URL itself is.
                var existing = await db.Products.FirstOrDefaultAsync(p => p.SourceUrl == sourceUrl, cancellationToken)
                    ?? (extracted.MazinoorProductCode is not null
                        ? await db.Products.FirstOrDefaultAsync(p => p.MazinoorProductCode == extracted.MazinoorProductCode, cancellationToken)
                        : null);

                if (existing is not null)
                {
                    item.Outcome = ImportItemOutcome.Unchanged;
                    item.ProductId = existing.Id;
                    item.MessagesJson = """["محصولی با این کد یا آدرس قبلاً وارد شده و برای حفظ ویرایش‌های محلی دوباره نوشته نشد."]""";
                    unchangedCount++;
                }
                else if (mode == ImportMode.DryRun)
                {
                    item.Outcome = ImportItemOutcome.New;
                    newCount++;
                }
                else
                {
                    var product = await CreateDraftAsync(category, extracted, sourceUrl, cancellationToken);
                    item.Outcome = ImportItemOutcome.New;
                    item.ProductId = product.Id;
                    newCount++;
                }

                if (extracted.Warnings.Count > 0) item.MessagesJson = System.Text.Json.JsonSerializer.Serialize(extracted.Warnings);
            }
            catch (InvalidDataException ex)
            {
                item.Outcome = ImportItemOutcome.Invalid;
                item.MessagesJson = System.Text.Json.JsonSerializer.Serialize(new[] { ex.Message });
                invalidCount++;
            }
            catch (Exception ex) when (ex is InvalidOperationException or HttpRequestException or TaskCanceledException)
            {
                item.Outcome = ImportItemOutcome.Failed;
                item.MessagesJson = System.Text.Json.JsonSerializer.Serialize(new[] { ex.Message });
                failedCount++;
            }
            db.ImportItems.Add(item);
            await db.SaveChangesAsync(cancellationToken);
        }

        run.Status = failedCount > 0 ? ImportRunStatus.CompletedWithWarnings : ImportRunStatus.Completed;
        run.CompletedAt = DateTimeOffset.UtcNow;
        run.SummaryJson = System.Text.Json.JsonSerializer.Serialize(new { @new = newCount, unchanged = unchangedCount, invalid = invalidCount, failed = failedCount });
        await db.SaveChangesAsync(cancellationToken);
        return run;
    }

    private async Task<Product> CreateDraftAsync(Category category, Noorestan.MazinoorImport.Contracts.ExtractedProduct extracted, string sourceUrl, CancellationToken cancellationToken)
    {
        var slug = Slugify(extracted.NameFa, extracted.MazinoorProductCode);
        var product = new Product
        {
            CategoryId = category.Id,
            Slug = slug,
            MazinoorProductCode = extracted.MazinoorProductCode,
            SourceUrl = sourceUrl,
            SourceContentHash = extracted.Trace.SourceContentHash,
            LastImportedAt = DateTimeOffset.UtcNow,
            NameFa = extracted.NameFa,
            NormalizedNameFa = PersianSearchNormalizer.Normalize(extracted.NameFa),
            ShortDescriptionFa = extracted.ShortDescriptionFa ?? extracted.DescriptionFa[..Math.Min(160, extracted.DescriptionFa.Length)],
            DescriptionFa = extracted.DescriptionFa,
            Status = ProductStatus.Draft,
            Features = extracted.FeaturesFa.Select((text, index) => new ProductFeature { TextFa = text, DisplayOrder = index }).ToList(),
        };

        var definitionsByKey = category.Specifications.ToDictionary(s => s.Key);
        foreach (var spec in extracted.Specifications)
        {
            if (definitionsByKey.TryGetValue(spec.Key, out var definition) && definition.ValueType == SpecificationValueType.Text)
            {
                product.SpecificationValues.Add(new ProductSpecificationValue
                {
                    DefinitionId = definition.Id,
                    TextValue = spec.Value,
                    NormalizedTextValue = PersianSearchNormalizer.Normalize(spec.Value),
                });
            }
        }

        db.Products.Add(product);
        await db.SaveChangesAsync(cancellationToken);

        var order = 0;
        foreach (var image in extracted.Images)
        {
            try
            {
                var (bytes, mediaType) = await httpSource.GetBinaryAsync(image.SourceUrl, cancellationToken);
                var validated = imageProcessor.Validate(bytes);
                var imageId = Guid.NewGuid();
                var ext = validated.MediaType == "image/png" ? "png" : validated.MediaType == "image/webp" ? "webp" : "jpg";
                var originalKey = $"products/{product.Id}/{imageId}/original.{ext}";
                using (var stream = new MemoryStream(bytes)) await storage.PutAsync(originalKey, stream, validated.MediaType, cancellationToken);

                var variantEntities = new List<ImageVariant>();
                foreach (var variant in imageProcessor.CreateVariants(bytes, [480, 768, 1200]))
                {
                    var key = $"products/{product.Id}/{imageId}/w{variant.Width}.{variant.Format}";
                    using var variantStream = new MemoryStream(variant.Content);
                    await storage.PutAsync(key, variantStream, $"image/{variant.Format}", cancellationToken);
                    variantEntities.Add(new ImageVariant { Format = variant.Format, Width = variant.Width, Height = variant.Height, ByteSize = variant.ByteSize, ObjectKey = key });
                }

                db.ProductImages.Add(new ProductImage
                {
                    ProductId = product.Id,
                    OriginalObjectKey = originalKey,
                    Status = ImageProcessingStatus.Ready,
                    MediaType = validated.MediaType,
                    ByteSize = validated.ByteSize,
                    Width = validated.Width,
                    Height = validated.Height,
                    Checksum = validated.Sha256,
                    AltTextFa = image.AltTextFa,
                    DisplayOrder = order,
                    IsPrimary = order == 0,
                    Variants = variantEntities,
                });
                order++;
            }
            catch (InvalidDataException)
            {
                // Skip images that fail validation; the product still saves with the ones that succeeded.
            }
        }
        await db.SaveChangesAsync(cancellationToken);
        return product;
    }

    private static string Slugify(string nameFa, string? code)
    {
        var basis = code ?? nameFa;
        var slug = new string(basis.ToLowerInvariant().Select(c => char.IsLetterOrDigit(c) ? c : '-').ToArray()).Trim('-');
        return string.IsNullOrWhiteSpace(slug) ? Guid.NewGuid().ToString("n") : slug;
    }
}
