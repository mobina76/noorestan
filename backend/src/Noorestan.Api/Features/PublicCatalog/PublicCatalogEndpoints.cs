using Microsoft.EntityFrameworkCore;
using System.Globalization;
using Noorestan.Api.Features.Catalog;
using Noorestan.Api.Features.Catalog.Search;
using Noorestan.Api.Infrastructure.Images;
using Noorestan.Api.Infrastructure.Persistence;

namespace Noorestan.Api.Features.PublicCatalog;

public static class PublicCatalogEndpoints
{
    public static IEndpointRouteBuilder MapPublicCatalogEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/public");
        group.MapGet("/categories", GetCategories);
        group.MapGet("/categories/{slug}/filters", GetFilters);
        group.MapGet("/products", ListProducts);
        group.MapGet("/products/{slug}", GetProduct);
        return endpoints;
    }

    private static async Task<IResult> GetCategories(AppDbContext db, CancellationToken cancellationToken)
    {
        var items = await db.Categories.AsNoTracking()
            .Where(x => x.IsVisible && x.Products.Any(p => p.Status == ProductStatus.Published))
            .OrderBy(x => x.DisplayOrder).ThenBy(x => x.NameFa)
            .Select(x => new { x.Id, x.Slug, x.NameFa, x.DescriptionFa, ProductCount = x.Products.Count(p => p.Status == ProductStatus.Published) })
            .ToListAsync(cancellationToken);
        return Results.Ok(items);
    }

    private static async Task<IResult> GetFilters(string slug, AppDbContext db, CancellationToken cancellationToken)
    {
        var filters = await db.SpecificationDefinitions.AsNoTracking()
            .Where(x => x.Category.Slug == slug && x.Category.IsVisible && x.IsFilterable)
            .OrderBy(x => x.DisplayOrder)
            .Select(x => new { x.Key, x.LabelFa, Type = x.ValueType.ToString().ToLower(CultureInfo.InvariantCulture), x.UnitFa, Options = x.Choices.Where(c => c.IsActive).OrderBy(c => c.DisplayOrder).Select(c => c.LabelFa) })
            .ToListAsync(cancellationToken);
        return filters.Count == 0 && !await db.Categories.AnyAsync(x => x.Slug == slug, cancellationToken)
            ? Results.NotFound() : Results.Ok(filters);
    }

    private static async Task<IResult> ListProducts(string? q, string? category, int page, int pageSize, AppDbContext db, IObjectStorage storage, CancellationToken cancellationToken)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize is 0 ? 24 : pageSize, 1, 100);
        var normalized = PersianSearchNormalizer.Normalize(q);
        var query = db.Products.AsNoTracking().Where(x => x.Status == ProductStatus.Published);
        if (!string.IsNullOrWhiteSpace(category)) query = query.Where(x => x.Category.Slug == category);
        if (normalized.Length > 0)
        {
            query = query.Where(x => x.NormalizedNameFa.Contains(normalized) || x.Category.NormalizedNameFa.Contains(normalized)
                || x.Features.Any(f => f.TextFa.Contains(normalized)) || x.SpecificationValues.Any(v => v.NormalizedTextValue != null && v.NormalizedTextValue.Contains(normalized)));
        }
        var total = await query.CountAsync(cancellationToken);
        var raw = await query.OrderBy(x => x.DisplayOrder).ThenBy(x => x.NameFa).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new { x.Id, x.Slug, x.NameFa, x.MazinoorProductCode, Category = x.Category.NameFa, x.ShortDescriptionFa,
                Image = x.Images.Where(i => i.IsPrimary && i.Status == ImageProcessingStatus.Ready).Select(i => new { i.OriginalObjectKey, i.AltTextFa }).FirstOrDefault() })
            .ToListAsync(cancellationToken);
        var items = raw.Select(x => new { x.Id, x.Slug, x.NameFa, x.MazinoorProductCode, x.Category, x.ShortDescriptionFa,
            PrimaryImage = x.Image is null ? null : new { Url = storage.GetPublicUrl(x.Image.OriginalObjectKey), x.Image.AltTextFa } });
        return Results.Ok(new { Items = items, Page = page, PageSize = pageSize, Total = total });
    }

    private static async Task<IResult> GetProduct(string slug, AppDbContext db, IObjectStorage storage, CancellationToken cancellationToken)
    {
        var product = await db.Products.AsNoTracking().AsSplitQuery()
            .Include(x => x.Category).Include(x => x.Features).Include(x => x.SpecificationValues).ThenInclude(x => x.Definition)
            .Include(x => x.SpecificationValues).ThenInclude(x => x.Choice).Include(x => x.Images).ThenInclude(x => x.Variants)
            .SingleOrDefaultAsync(x => x.Slug == slug && x.Status == ProductStatus.Published, cancellationToken);
        if (product is null) return Results.NotFound();
        var specifications = product.SpecificationValues.OrderBy(x => x.Definition.DisplayOrder).Select(x => new
        {
            x.Definition.Key, x.Definition.LabelFa,
            DisplayValueFa = x.TextValue ?? x.NumericValue?.ToString("0.####", CultureInfo.InvariantCulture) ?? x.BooleanValue?.ToString() ?? x.Choice?.LabelFa ?? string.Empty,
            x.Definition.UnitFa,
        });
        var images = product.Images.Where(x => x.Status == ImageProcessingStatus.Ready).OrderBy(x => x.DisplayOrder).Select(x => new
        {
            x.Id, x.AltTextFa, x.IsPrimary,
            Variants = x.Variants.OrderBy(v => v.Width).Select(v => new { Url = storage.GetPublicUrl(v.ObjectKey), v.Width, v.Height, MediaType = $"image/{v.Format}" }),
        });
        return Results.Ok(new { product.Id, product.Slug, product.NameFa, product.MazinoorProductCode,
            Category = new { product.Category.Slug, product.Category.NameFa }, product.ShortDescriptionFa, product.DescriptionFa,
            product.TechnicalNotesFa, Features = product.Features.OrderBy(x => x.DisplayOrder).Select(x => x.TextFa), Specifications = specifications, Images = images });
    }
}
