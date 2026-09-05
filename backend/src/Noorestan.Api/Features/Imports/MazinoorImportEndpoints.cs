using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Noorestan.Api.Infrastructure.Persistence;

namespace Noorestan.Api.Features.CatalogImports;

public sealed record StartImportRequest(Guid CategoryId, IReadOnlyList<string> SourceUrls, ImportMode Mode);

public static class MazinoorImportEndpoints
{
    public static IEndpointRouteBuilder MapMazinoorImportEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/owner/imports").RequireAuthorization("Owner");
        group.MapGet("", ListRuns);
        group.MapGet("/{id:guid}", GetRun);
        group.MapGet("/{id:guid}/items", GetItems);
        group.MapPost("", StartImport);
        return endpoints;
    }

    private static async Task<IResult> ListRuns(AppDbContext db, CancellationToken token) =>
        Results.Ok(await db.ImportRuns.AsNoTracking().OrderByDescending(r => r.CreatedAt).Take(20)
            .Select(r => new { r.Id, r.Mode, r.Status, r.StartedAt, r.CompletedAt, r.SummaryJson }).ToListAsync(token));

    private static async Task<IResult> GetRun(Guid id, AppDbContext db, CancellationToken token)
    {
        var run = await db.ImportRuns.AsNoTracking().SingleOrDefaultAsync(r => r.Id == id, token);
        return run is null ? Results.NotFound() : Results.Ok(new { run.Id, run.Mode, run.Status, run.StartedAt, run.CompletedAt, run.SummaryJson, run.ErrorSummary });
    }

    private static async Task<IResult> GetItems(Guid id, AppDbContext db, CancellationToken token) =>
        Results.Ok(await db.ImportItems.AsNoTracking().Where(i => i.ImportRunId == id).OrderBy(i => i.FetchedAt)
            .Select(i => new { i.Id, i.CanonicalSourceUrl, i.MazinoorProductCode, i.Outcome, i.ProductId, i.MessagesJson }).ToListAsync(token));

    private static async Task<IResult> StartImport(StartImportRequest request, HttpContext context, MazinoorImportRunner runner, CancellationToken token)
    {
        if (request.SourceUrls.Count == 0)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["sourceUrls"] = ["حداقل یک آدرس محصول لازم است."] });
        if (request.SourceUrls.Count > 30)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["sourceUrls"] = ["حداکثر ۳۰ آدرس در هر اجرا پشتیبانی می‌شود."] });

        var ownerId = Guid.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try
        {
            var run = await runner.RunAsync(ownerId, request.CategoryId, request.SourceUrls, request.Mode, token);
            return Results.Created($"/api/v1/owner/imports/{run.Id}", new { run.Id, run.Status, run.SummaryJson });
        }
        catch (InvalidOperationException ex)
        {
            return Results.Conflict(new { title = ex.Message });
        }
    }
}
