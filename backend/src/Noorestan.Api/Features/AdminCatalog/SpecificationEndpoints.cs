using Microsoft.EntityFrameworkCore;
using Noorestan.Api.Features.Catalog;
using Noorestan.Api.Infrastructure.Persistence;

namespace Noorestan.Api.Features.AdminCatalog;

public sealed record SpecificationDefinitionWrite(string Key, string LabelFa, SpecificationValueType ValueType, string? UnitFa, bool IsRequired, bool IsFilterable, int DisplayOrder, IReadOnlyList<string> Choices);

public static class SpecificationEndpoints
{
    public static IEndpointRouteBuilder MapSpecificationEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/admin/categories/{categoryId:guid}/specifications").RequireAuthorization("Admin");
        group.MapGet("", List);
        group.MapPost("", Create);
        group.MapPut("/{id:guid}", Update);
        group.MapDelete("/{id:guid}", Delete);
        group.MapPost("/{id:guid}/choices/{choiceKey}/deactivate", DeactivateChoice);
        return endpoints;
    }

    private static async Task<IResult> List(Guid categoryId, AppDbContext db, CancellationToken token) =>
        Results.Ok(await db.SpecificationDefinitions.AsNoTracking().Where(x => x.CategoryId == categoryId).OrderBy(x => x.DisplayOrder)
            .Select(x => new { x.Id, x.Key, x.LabelFa, x.ValueType, x.UnitFa, x.IsRequired, x.IsFilterable, x.DisplayOrder, x.Version,
                Choices = x.Choices.OrderBy(c => c.DisplayOrder).Select(c => new { c.Id, c.Key, c.LabelFa, c.DisplayOrder, c.IsActive }) })
            .ToListAsync(token));

    private static async Task<IResult> Create(Guid categoryId, SpecificationDefinitionWrite request, AppDbContext db, CancellationToken token)
    {
        if (!await db.Categories.AnyAsync(x => x.Id == categoryId, token)) return Results.NotFound();
        var error = Validate(request);
        if (error is not null) return error;
        if (await db.SpecificationDefinitions.AnyAsync(x => x.CategoryId == categoryId && x.Key == request.Key, token))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["key"] = ["این کلید در این دسته‌بندی قبلاً استفاده شده است."] });

        var entity = new SpecificationDefinition
        {
            CategoryId = categoryId,
            Key = request.Key.Trim(),
            LabelFa = request.LabelFa.Trim(),
            ValueType = request.ValueType,
            UnitFa = request.UnitFa?.Trim(),
            IsRequired = request.IsRequired,
            IsFilterable = request.IsFilterable,
            DisplayOrder = request.DisplayOrder,
            Choices = request.ValueType == SpecificationValueType.Choice
                ? request.Choices.Select((label, index) => new SpecificationChoice { Key = Slugify(label), LabelFa = label.Trim(), DisplayOrder = index }).ToList()
                : [],
        };
        db.SpecificationDefinitions.Add(entity);
        await db.SaveChangesAsync(token);
        return Results.Created($"/api/v1/admin/categories/{categoryId}/specifications/{entity.Id}", entity);
    }

    private static async Task<IResult> Update(Guid categoryId, Guid id, SpecificationDefinitionWrite request, HttpRequest http, AppDbContext db, CancellationToken token)
    {
        var entity = await db.SpecificationDefinitions.Include(x => x.Choices).SingleOrDefaultAsync(x => x.Id == id && x.CategoryId == categoryId, token);
        if (entity is null) return Results.NotFound();
        if (!Matches(http, entity.Version)) return Results.Conflict(new { title = "این مشخصه توسط مدیر دیگری تغییر کرده است.", entity.Version });
        var error = Validate(request);
        if (error is not null) return error;

        if (entity.ValueType != request.ValueType && await db.ProductSpecificationValues.AnyAsync(x => x.DefinitionId == id, token))
            return Results.Conflict(new { title = "تغییر نوع این مشخصه ممکن نیست زیرا مقادیری برای محصولات ثبت شده است." });

        entity.LabelFa = request.LabelFa.Trim();
        entity.ValueType = request.ValueType;
        entity.UnitFa = request.UnitFa?.Trim();
        entity.IsRequired = request.IsRequired;
        entity.IsFilterable = request.IsFilterable;
        entity.DisplayOrder = request.DisplayOrder;

        if (request.ValueType == SpecificationValueType.Choice)
        {
            var existingByLabel = entity.Choices.ToDictionary(c => c.LabelFa, c => c);
            foreach (var label in request.Choices)
            {
                if (!existingByLabel.ContainsKey(label.Trim()))
                    entity.Choices.Add(new SpecificationChoice { Key = Slugify(label), LabelFa = label.Trim(), DisplayOrder = entity.Choices.Count });
            }
        }

        await db.SaveChangesAsync(token);
        return Results.Ok(entity);
    }

    private static async Task<IResult> Delete(Guid categoryId, Guid id, HttpRequest http, AppDbContext db, CancellationToken token)
    {
        var entity = await db.SpecificationDefinitions.SingleOrDefaultAsync(x => x.Id == id && x.CategoryId == categoryId, token);
        if (entity is null) return Results.NotFound();
        if (!Matches(http, entity.Version)) return Results.Conflict();
        if (await db.ProductSpecificationValues.AnyAsync(x => x.DefinitionId == id, token))
            return Results.Conflict(new { title = "این مشخصه دارای مقدار ثبت‌شده برای محصولات است و قابل حذف نیست." });
        db.SpecificationDefinitions.Remove(entity);
        await db.SaveChangesAsync(token);
        return Results.NoContent();
    }

    private static async Task<IResult> DeactivateChoice(Guid categoryId, Guid id, string choiceKey, AppDbContext db, CancellationToken token)
    {
        var choice = await db.SpecificationChoices.Include(c => c.Definition)
            .SingleOrDefaultAsync(c => c.DefinitionId == id && c.Key == choiceKey && c.Definition.CategoryId == categoryId, token);
        if (choice is null) return Results.NotFound();
        choice.IsActive = false;
        await db.SaveChangesAsync(token);
        return Results.NoContent();
    }

    private static IResult? Validate(SpecificationDefinitionWrite request)
    {
        if (string.IsNullOrWhiteSpace(request.Key) || string.IsNullOrWhiteSpace(request.LabelFa))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["specification"] = ["کلید و برچسب مشخصه الزامی است."] });
        if (request.ValueType == SpecificationValueType.Choice && request.Choices.Count == 0)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["choices"] = ["برای نوع انتخابی، حداقل یک گزینه الزامی است."] });
        if (request.IsFilterable && request.ValueType == SpecificationValueType.Text)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["isFilterable"] = ["فیلد متنی نمی‌تواند فیلترپذیر باشد."] });
        return null;
    }

    private static string Slugify(string value) => new string(value.Trim().ToLowerInvariant().Select(c => char.IsLetterOrDigit(c) ? c : '-').ToArray());

    private static bool Matches(HttpRequest request, uint version) => uint.TryParse(request.Headers.IfMatch.ToString().Trim('"'), out var supplied) && supplied == version;
}
