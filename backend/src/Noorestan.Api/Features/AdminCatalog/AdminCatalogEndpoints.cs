using Microsoft.EntityFrameworkCore;
using Noorestan.Api.Features.Catalog;
using Noorestan.Api.Features.Catalog.Search;
using Noorestan.Api.Infrastructure.Images;
using Noorestan.Api.Infrastructure.Persistence;

namespace Noorestan.Api.Features.AdminCatalog;

public sealed record CategoryWrite(string Slug, string NameFa, string? DescriptionFa, int DisplayOrder, bool IsVisible);
public sealed record ProductWrite(Guid CategoryId, string Slug, string NameFa, string ShortDescriptionFa, string DescriptionFa, string? TechnicalNotesFa, int DisplayOrder, IReadOnlyList<string> Features);
public sealed record StatusWrite(ProductStatus TargetStatus);
public sealed record SpecificationValueWrite(Guid DefinitionId, string? TextValue, decimal? NumericValue, bool? BooleanValue, Guid? ChoiceId);
public sealed record SpecificationValuesWrite(IReadOnlyList<SpecificationValueWrite> Values);

public static class AdminCatalogEndpoints
{
    public static IEndpointRouteBuilder MapAdminCatalogEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/admin").RequireAuthorization("Admin");
        group.MapGet("/categories", ListCategories);
        group.MapPost("/categories", CreateCategory);
        group.MapPut("/categories/{id:guid}", UpdateCategory);
        group.MapDelete("/categories/{id:guid}", DeleteCategory);
        group.MapGet("/products", ListProducts);
        group.MapGet("/products/{id:guid}", GetProduct);
        group.MapPost("/products", CreateProduct);
        group.MapPut("/products/{id:guid}", UpdateProduct);
        group.MapPost("/products/{id:guid}/status", ChangeStatus);
        group.MapPut("/products/{id:guid}/specifications", UpdateSpecificationValues);
        group.MapDelete("/products/{id:guid}", DeleteProduct);
        return endpoints;
    }

    private static async Task<IResult> ListCategories(AppDbContext db, CancellationToken token) => Results.Ok(await db.Categories.AsNoTracking().OrderBy(x => x.DisplayOrder).Select(x => new { x.Id, x.Slug, x.NameFa, x.DescriptionFa, x.DisplayOrder, x.IsVisible, x.Version, ProductCount = x.Products.Count }).ToListAsync(token));
    private static async Task<IResult> CreateCategory(CategoryWrite request, AppDbContext db, CancellationToken token)
    {
        if (string.IsNullOrWhiteSpace(request.NameFa) || string.IsNullOrWhiteSpace(request.Slug)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["category"] = ["نام و نشانی دسته‌بندی الزامی است."] });
        var entity = new Category { Slug = request.Slug.Trim(), NameFa = request.NameFa.Trim(), NormalizedNameFa = PersianSearchNormalizer.Normalize(request.NameFa), DescriptionFa = request.DescriptionFa?.Trim(), DisplayOrder = request.DisplayOrder, IsVisible = request.IsVisible };
        db.Categories.Add(entity); await db.SaveChangesAsync(token); return Results.Created($"/api/v1/admin/categories/{entity.Id}", entity);
    }
    private static async Task<IResult> UpdateCategory(Guid id, CategoryWrite request, HttpRequest http, AppDbContext db, CancellationToken token)
    {
        var entity = await db.Categories.FindAsync([id], token); if (entity is null) return Results.NotFound();
        if (!Matches(http, entity.Version)) return Results.Conflict(new { title = "این دسته‌بندی توسط مدیر دیگری تغییر کرده است.", entity.Version });
        entity.Slug = request.Slug.Trim(); entity.NameFa = request.NameFa.Trim(); entity.NormalizedNameFa = PersianSearchNormalizer.Normalize(request.NameFa); entity.DescriptionFa = request.DescriptionFa?.Trim(); entity.DisplayOrder = request.DisplayOrder; entity.IsVisible = request.IsVisible;
        await db.SaveChangesAsync(token); return Results.Ok(entity);
    }
    private static async Task<IResult> DeleteCategory(Guid id, HttpRequest http, AppDbContext db, CancellationToken token)
    {
        var entity = await db.Categories.Include(x => x.Products).SingleOrDefaultAsync(x => x.Id == id, token); if (entity is null) return Results.NotFound();
        if (!Matches(http, entity.Version)) return Results.Conflict();
        if (entity.Products.Any(x => x.Status != ProductStatus.Archived)) return Results.Conflict(new { title = "ابتدا محصولات این دسته را منتقل یا بایگانی کنید." });
        db.Categories.Remove(entity); await db.SaveChangesAsync(token); return Results.NoContent();
    }
    private static async Task<IResult> ListProducts(ProductStatus? status, Guid? categoryId, string? q, int? page, int? pageSize, AppDbContext db, IObjectStorage storage, CancellationToken token)
    {
        var currentPage = Math.Max(1, page ?? 1); var take = Math.Clamp(pageSize ?? 24, 1, 100);
        var query = db.Products.AsNoTracking().Include(x => x.Category).AsQueryable();
        if (status is not null) query = query.Where(x => x.Status == status);
        if (categoryId is not null) query = query.Where(x => x.CategoryId == categoryId);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var normalized = PersianSearchNormalizer.Normalize(q);
            query = query.Where(x => x.NormalizedNameFa.Contains(normalized) || (x.MazinoorProductCode != null && x.MazinoorProductCode.Contains(q)));
        }
        var total = await query.CountAsync(token);
        var items = await query.OrderByDescending(x => x.UpdatedAt).Skip((currentPage - 1) * take).Take(take)
            .Select(x => new { x.Id, x.NameFa, x.Slug, x.MazinoorProductCode, x.Status, x.CategoryId, CategoryNameFa = x.Category.NameFa, x.Version, x.UpdatedAt,
                PrimaryImageUrl = x.Images.Where(i => i.IsPrimary).Select(i => i.OriginalObjectKey).FirstOrDefault() })
            .ToListAsync(token);
        return Results.Ok(new { Items = items.Select(x => new { x.Id, x.NameFa, x.Slug, x.MazinoorProductCode, x.Status, x.CategoryId, x.CategoryNameFa, x.Version, x.UpdatedAt, PrimaryImageUrl = x.PrimaryImageUrl is null ? null : storage.GetPublicUrl(x.PrimaryImageUrl) }), Page = currentPage, PageSize = take, Total = total });
    }
    private static async Task<IResult> GetProduct(Guid id, AppDbContext db, IObjectStorage storage, CancellationToken token)
    {
        var entity = await db.Products.AsNoTracking().AsSplitQuery().Include(x => x.Category)
            .Include(x => x.Features).Include(x => x.SpecificationValues).ThenInclude(x => x.Definition).ThenInclude(x => x.Choices)
            .Include(x => x.SpecificationValues).ThenInclude(x => x.Choice)
            .Include(x => x.Images).ThenInclude(x => x.Variants)
            .SingleOrDefaultAsync(x => x.Id == id, token);
        if (entity is null) return Results.NotFound();
        return Results.Ok(new
        {
            entity.Id, entity.Slug, entity.NameFa, entity.MazinoorProductCode, entity.SourceUrl, entity.CategoryId,
            CategoryNameFa = entity.Category.NameFa, entity.ShortDescriptionFa, entity.DescriptionFa, entity.TechnicalNotesFa,
            entity.Status, entity.DisplayOrder, entity.Version,
            Features = entity.Features.OrderBy(f => f.DisplayOrder).Select(f => f.TextFa),
            Specifications = entity.SpecificationValues.Select(v => new
            {
                v.DefinitionId, v.Definition.Key, v.Definition.LabelFa, v.Definition.ValueType, v.Definition.UnitFa, v.Definition.IsRequired,
                v.TextValue, v.NumericValue, v.BooleanValue, v.ChoiceId,
                Choices = v.Definition.Choices.Where(c => c.IsActive).OrderBy(c => c.DisplayOrder).Select(c => new { c.Id, c.LabelFa }),
            }),
            Images = entity.Images.OrderBy(i => i.DisplayOrder).Select(i => ProductImageEndpoints.ToDto(i, storage)),
        });
    }
    private static async Task<IResult> CreateProduct(ProductWrite request, AppDbContext db, CancellationToken token)
    {
        var error = await ValidateProduct(request, db, token); if (error is not null) return error;
        var entity = new Product { CategoryId = request.CategoryId, Slug = request.Slug.Trim(), NameFa = request.NameFa.Trim(), NormalizedNameFa = PersianSearchNormalizer.Normalize(request.NameFa), ShortDescriptionFa = request.ShortDescriptionFa.Trim(), DescriptionFa = request.DescriptionFa.Trim(), TechnicalNotesFa = request.TechnicalNotesFa?.Trim(), DisplayOrder = request.DisplayOrder, Features = request.Features.Select((text, index) => new ProductFeature { TextFa = text.Trim(), DisplayOrder = index }).ToList() };
        db.Products.Add(entity); await db.SaveChangesAsync(token); return Results.Created($"/api/v1/admin/products/{entity.Id}", entity);
    }
    private static async Task<IResult> UpdateProduct(Guid id, ProductWrite request, HttpRequest http, AppDbContext db, CancellationToken token)
    {
        var error = await ValidateProduct(request, db, token); if (error is not null) return error;
        var entity = await db.Products.Include(x => x.Features).Include(x => x.SpecificationValues).SingleOrDefaultAsync(x => x.Id == id, token); if (entity is null) return Results.NotFound(); if (!Matches(http, entity.Version)) return Results.Conflict(new { title = "نسخه جدیدتری از محصول ذخیره شده است.", entity.Version });
        var categoryChanged = entity.CategoryId != request.CategoryId;
        entity.CategoryId = request.CategoryId; entity.Slug = request.Slug.Trim(); entity.NameFa = request.NameFa.Trim(); entity.NormalizedNameFa = PersianSearchNormalizer.Normalize(request.NameFa); entity.ShortDescriptionFa = request.ShortDescriptionFa.Trim(); entity.DescriptionFa = request.DescriptionFa.Trim(); entity.TechnicalNotesFa = request.TechnicalNotesFa?.Trim(); entity.DisplayOrder = request.DisplayOrder;
        db.ProductFeatures.RemoveRange(entity.Features); entity.Features = request.Features.Select((text, index) => new ProductFeature { TextFa = text.Trim(), DisplayOrder = index }).ToList();
        if (categoryChanged && entity.SpecificationValues.Count > 0)
        {
            var validDefinitionIds = await db.SpecificationDefinitions.Where(x => x.CategoryId == request.CategoryId).Select(x => x.Id).ToListAsync(token);
            db.ProductSpecificationValues.RemoveRange(entity.SpecificationValues.Where(v => !validDefinitionIds.Contains(v.DefinitionId)));
        }
        await db.SaveChangesAsync(token); return Results.Ok(entity);
    }

    private static async Task<IResult> UpdateSpecificationValues(Guid id, SpecificationValuesWrite request, HttpRequest http, AppDbContext db, CancellationToken token)
    {
        var entity = await db.Products.Include(x => x.SpecificationValues).SingleOrDefaultAsync(x => x.Id == id, token);
        if (entity is null) return Results.NotFound();
        if (!Matches(http, entity.Version)) return Results.Conflict(new { title = "نسخه جدیدتری از محصول ذخیره شده است.", entity.Version });

        var definitions = await db.SpecificationDefinitions.Include(x => x.Choices).Where(x => x.CategoryId == entity.CategoryId).ToDictionaryAsync(x => x.Id, token);
        var errors = new Dictionary<string, string[]>();
        foreach (var value in request.Values)
        {
            if (!definitions.TryGetValue(value.DefinitionId, out var definition))
            {
                errors[value.DefinitionId.ToString()] = ["این مشخصه به دسته‌بندی محصول تعلق ندارد."];
                continue;
            }
            var provided = definition.ValueType switch
            {
                SpecificationValueType.Text => value.TextValue is not null,
                SpecificationValueType.Number => value.NumericValue is not null,
                SpecificationValueType.Boolean => value.BooleanValue is not null,
                SpecificationValueType.Choice => value.ChoiceId is not null && definition.Choices.Any(c => c.Id == value.ChoiceId),
                _ => false,
            };
            if (definition.IsRequired && !provided) errors[definition.Key] = [$"مقدار «{definition.LabelFa}» الزامی است."];
        }
        if (errors.Count > 0) return Results.ValidationProblem(errors);

        db.ProductSpecificationValues.RemoveRange(entity.SpecificationValues);
        await db.SaveChangesAsync(token);
        foreach (var value in request.Values)
        {
            if (!definitions.TryGetValue(value.DefinitionId, out var definition)) continue;
            db.ProductSpecificationValues.Add(new ProductSpecificationValue
            {
                ProductId = id,
                DefinitionId = value.DefinitionId,
                TextValue = definition.ValueType == SpecificationValueType.Text ? value.TextValue?.Trim() : null,
                NormalizedTextValue = definition.ValueType == SpecificationValueType.Text && value.TextValue is not null ? PersianSearchNormalizer.Normalize(value.TextValue) : null,
                NumericValue = definition.ValueType == SpecificationValueType.Number ? value.NumericValue : null,
                BooleanValue = definition.ValueType == SpecificationValueType.Boolean ? value.BooleanValue : null,
                ChoiceId = definition.ValueType == SpecificationValueType.Choice ? value.ChoiceId : null,
            });
        }
        await db.SaveChangesAsync(token);
        return Results.NoContent();
    }
    private static async Task<IResult> ChangeStatus(Guid id, StatusWrite request, HttpRequest http, AppDbContext db, CancellationToken token)
    {
        var entity = await db.Products.Include(x => x.Images).Include(x => x.SpecificationValues).ThenInclude(x => x.Definition).SingleOrDefaultAsync(x => x.Id == id, token); if (entity is null) return Results.NotFound(); if (!Matches(http, entity.Version)) return Results.Conflict();
        if (entity.Status == ProductStatus.Archived && request.TargetStatus != ProductStatus.Draft) return Results.BadRequest(new { title = "محصول بایگانی‌شده فقط به پیش‌نویس بازگردانده می‌شود." });
        if (request.TargetStatus == ProductStatus.Published && (!entity.Images.Any(x => x.IsPrimary && x.Status == ImageProcessingStatus.Ready) || entity.SpecificationValues.Any(x => x.Definition.IsRequired && x.TextValue == null && x.NumericValue == null && x.BooleanValue == null && x.ChoiceId == null))) return Results.ValidationProblem(new Dictionary<string, string[]> { ["publish"] = ["تصویر اصلی آماده و مشخصات الزامی برای انتشار لازم است."] });
        entity.Status = request.TargetStatus; entity.PublishedAt = request.TargetStatus == ProductStatus.Published ? DateTimeOffset.UtcNow : entity.PublishedAt; entity.ArchivedAt = request.TargetStatus == ProductStatus.Archived ? DateTimeOffset.UtcNow : null; await db.SaveChangesAsync(token); return Results.Ok(entity);
    }
    private static async Task<IResult> DeleteProduct(Guid id, HttpRequest http, AppDbContext db, IObjectStorage storage, CancellationToken token)
    {
        var entity = await db.Products.Include(x => x.Images).ThenInclude(x => x.Variants).SingleOrDefaultAsync(x => x.Id == id, token);
        if (entity is null) return Results.NotFound();
        if (!Matches(http, entity.Version)) return Results.Conflict();
        if (entity.Status != ProductStatus.Archived || http.Headers["confirmation"] != "permanently-delete") return Results.BadRequest(new { title = "حذف دائمی فقط پس از بایگانی و تأیید صریح ممکن است." });
        var objectKeys = entity.Images.SelectMany(i => new[] { i.OriginalObjectKey }.Concat(i.Variants.Select(v => v.ObjectKey))).ToList();
        db.Products.Remove(entity);
        await db.SaveChangesAsync(token);
        foreach (var key in objectKeys) await storage.DeleteAsync(key, token);
        return Results.NoContent();
    }
    private static async Task<IResult?> ValidateProduct(ProductWrite request, AppDbContext db, CancellationToken token)
    {
        if (string.IsNullOrWhiteSpace(request.NameFa) || string.IsNullOrWhiteSpace(request.Slug) || string.IsNullOrWhiteSpace(request.DescriptionFa)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["product"] = ["نام، نشانی و توضیحات محصول الزامی است."] });
        return await db.Categories.AnyAsync(x => x.Id == request.CategoryId, token) ? null : Results.ValidationProblem(new Dictionary<string, string[]> { ["categoryId"] = ["دسته‌بندی معتبر نیست."] });
    }
    private static bool Matches(HttpRequest request, uint version) => uint.TryParse(request.Headers.IfMatch.ToString().Trim('"'), out var supplied) && supplied == version;
}
