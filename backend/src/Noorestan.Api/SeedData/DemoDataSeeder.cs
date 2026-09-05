using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Noorestan.Api.Features.Catalog;
using Noorestan.Api.Features.Catalog.Search;
using Noorestan.Api.Features.Content;
using Noorestan.Api.Infrastructure.Images;
using Noorestan.Api.Infrastructure.Persistence;

namespace Noorestan.Api.SeedData;

public sealed record SeedSpecifications(
    [property: JsonPropertyName("wattFa")] string? WattFa,
    [property: JsonPropertyName("lumenFa")] string? LumenFa,
    [property: JsonPropertyName("efficacyFa")] string? EfficacyFa,
    [property: JsonPropertyName("beamAngleFa")] string? BeamAngleFa,
    [property: JsonPropertyName("dimensionFa")] string? DimensionFa,
    [property: JsonPropertyName("cctFa")] string? CctFa,
    [property: JsonPropertyName("catalogNoFa")] string? CatalogNoFa);

public sealed record SeedProduct(
    string SourceUrl, string Slug, string NameFa, string? MazinoorProductCode, string? CatalogNo,
    string CategorySlug, string CategoryNameFa, string DescriptionFa, string ShortDescriptionFa,
    IReadOnlyList<string> Features, SeedSpecifications Specifications, IReadOnlyList<string> Images);

/// <summary>
/// Seeds a small, real, representative Mazinoor catalog (products, specs, and photographs sourced
/// directly from mazinoor.com) so a local demo has genuine data instead of invented placeholders.
/// Idempotent: does nothing once any product already exists.
/// </summary>
public static class DemoDataSeeder
{
    private static readonly (string Key, string LabelFa, string? UnitFa)[] SpecFields =
    [
        ("watt", "توان", "وات"),
        ("lumen", "شار نوری", "لومن"),
        ("efficacy", "بازده نوری", "لومن بر وات"),
        ("beam-angle", "زاویه تابش", null),
        ("dimension", "ابعاد", "میلی‌متر"),
        ("cct", "دمای رنگ", null),
        ("catalog-no", "کد فنی مرجع", null),
    ];

    private static readonly JsonSerializerOptions SeedJsonOptions = new() { PropertyNameCaseInsensitive = true };

    public static async Task<bool> RunAsync(IServiceProvider services, CancellationToken cancellationToken)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var storage = scope.ServiceProvider.GetRequiredService<IObjectStorage>();
        var processor = scope.ServiceProvider.GetRequiredService<IImageProcessor>();

        if (await db.Products.AnyAsync(cancellationToken))
        {
            return false;
        }

        var seedRoot = Path.Combine(AppContext.BaseDirectory, "SeedData", "mazinoor");
        var jsonPath = Path.Combine(seedRoot, "products.json");
        var imagesDir = Path.Combine(seedRoot, "images");
        if (!File.Exists(jsonPath))
        {
            throw new InvalidOperationException($"Seed data file not found at {jsonPath}.");
        }

        var products = JsonSerializer.Deserialize<List<SeedProduct>>(
            await File.ReadAllTextAsync(jsonPath, cancellationToken),
            SeedJsonOptions) ?? [];

        var categories = new Dictionary<string, Category>();
        var categoryOrder = 0;
        foreach (var group in products.GroupBy(p => (p.CategorySlug, p.CategoryNameFa)))
        {
            var category = new Category
            {
                Slug = group.Key.CategorySlug,
                NameFa = group.Key.CategoryNameFa,
                NormalizedNameFa = PersianSearchNormalizer.Normalize(group.Key.CategoryNameFa),
                DisplayOrder = categoryOrder++,
                IsVisible = true,
            };
            var specOrder = 0;
            foreach (var (key, label, unit) in SpecFields)
            {
                category.Specifications.Add(new SpecificationDefinition
                {
                    Key = key,
                    LabelFa = label,
                    ValueType = SpecificationValueType.Text,
                    UnitFa = unit,
                    IsRequired = false,
                    IsFilterable = false,
                    DisplayOrder = specOrder++,
                });
            }
            db.Categories.Add(category);
            categories[group.Key.CategorySlug] = category;
        }
        await db.SaveChangesAsync(cancellationToken);

        var productOrder = 0;
        foreach (var seed in products)
        {
            var category = categories[seed.CategorySlug];
            var definitionsByKey = category.Specifications.ToDictionary(s => s.Key);

            var product = new Product
            {
                CategoryId = category.Id,
                Slug = seed.Slug,
                MazinoorProductCode = seed.MazinoorProductCode,
                SourceUrl = seed.SourceUrl,
                NameFa = seed.NameFa,
                NormalizedNameFa = PersianSearchNormalizer.Normalize(seed.NameFa),
                ShortDescriptionFa = seed.ShortDescriptionFa,
                DescriptionFa = seed.DescriptionFa,
                DisplayOrder = productOrder++,
                Status = ProductStatus.Draft,
                Features = seed.Features.Select((text, index) => new ProductFeature { TextFa = text, DisplayOrder = index }).ToList(),
            };

            AddSpecValue(product, definitionsByKey, "watt", seed.Specifications.WattFa);
            AddSpecValue(product, definitionsByKey, "lumen", seed.Specifications.LumenFa);
            AddSpecValue(product, definitionsByKey, "efficacy", seed.Specifications.EfficacyFa);
            AddSpecValue(product, definitionsByKey, "beam-angle", seed.Specifications.BeamAngleFa);
            AddSpecValue(product, definitionsByKey, "dimension", seed.Specifications.DimensionFa);
            AddSpecValue(product, definitionsByKey, "cct", seed.Specifications.CctFa);
            AddSpecValue(product, definitionsByKey, "catalog-no", seed.Specifications.CatalogNoFa);

            db.Products.Add(product);
            await db.SaveChangesAsync(cancellationToken);

            var imageOrder = 0;
            foreach (var imageUrl in seed.Images)
            {
                var fileName = Path.GetFileName(new Uri(imageUrl).LocalPath);
                var filePath = Path.Combine(imagesDir, fileName);
                if (!File.Exists(filePath)) continue;

                byte[] bytes;
                await using (var fileStream = File.OpenRead(filePath))
                {
                    bytes = await processor.ReadAllBytesAsync(fileStream, 20_000_000, cancellationToken);
                }
                var validated = processor.Validate(bytes);
                var imageId = Guid.NewGuid();
                var originalKey = $"products/{product.Id}/{imageId}/original.jpg";
                using (var originalStream = new MemoryStream(bytes))
                {
                    await storage.PutAsync(originalKey, originalStream, validated.MediaType, cancellationToken);
                }

                var variantEntities = new List<ImageVariant>();
                foreach (var variant in processor.CreateVariants(bytes, [480, 768, 1200]))
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
                    AltTextFa = seed.NameFa,
                    DisplayOrder = imageOrder,
                    IsPrimary = imageOrder == 0,
                    Variants = variantEntities,
                });
                imageOrder++;
            }
            await db.SaveChangesAsync(cancellationToken);

            product.Status = ProductStatus.Published;
            product.PublishedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }

        if (!await db.BusinessProfiles.AnyAsync(cancellationToken))
        {
            db.BusinessProfiles.Add(new BusinessProfile
            {
                BusinessNameFa = "فروشگاه کالای برق نورستان",
                RepresentativeStatementFa = "نماینده رسمی محصولات مازی‌نور — آقایان شرفی",
                AddressFa = "تهران، خیابان لاله‌زار نو، نبش چهارراه منوچهری، پلاک ۴۷۵، کد پستی ۱۱۴۵۹۵۳۷۱۸",
                Phones =
                [
                    new PhoneNumber { Number = "021-33119296", IsAlsoFax = false },
                    new PhoneNumber { Number = "021-33942443", IsAlsoFax = true },
                    new PhoneNumber { Number = "021-33952021", IsAlsoFax = false },
                    new PhoneNumber { Number = "021-33922177", IsAlsoFax = true },
                ],
                WhatsApp = string.Empty,
                Email = string.Empty,
            });
            await db.SaveChangesAsync(cancellationToken);
        }

        return true;
    }

    private static void AddSpecValue(Product product, Dictionary<string, SpecificationDefinition> definitions, string key, string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || !definitions.TryGetValue(key, out var definition)) return;
        product.SpecificationValues.Add(new ProductSpecificationValue
        {
            DefinitionId = definition.Id,
            TextValue = value,
            NormalizedTextValue = PersianSearchNormalizer.Normalize(value),
        });
    }
}
