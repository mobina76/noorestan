using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Noorestan.Api.Infrastructure.Identity;
using Noorestan.Api.Infrastructure.Persistence;

namespace Noorestan.Api.Features.Identity;

public sealed record CreateAdministratorRequest(string DisplayName, string Email, string TemporaryPassword);
public sealed record TransferOwnerRequest(Guid NewOwnerId);

public static class OwnerAccountEndpoints
{
    public static IEndpointRouteBuilder MapOwnerAccountEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/owner").RequireAuthorization("Owner");
        group.MapGet("/accounts", async (UserManager<AdministratorAccount> users, CancellationToken token) =>
            Results.Ok(await users.Users.OrderBy(x => x.DisplayName).Select(x => new { x.Id, x.DisplayName, x.Email, x.IsActive, x.IsOwner, x.Version }).ToListAsync(token)));
        group.MapPost("/accounts", Create);
        group.MapPost("/accounts/{id:guid}/deactivate", Deactivate);
        group.MapPost("/transfer", Transfer);
        return endpoints;
    }

    private static async Task<IResult> Create(CreateAdministratorRequest request, UserManager<AdministratorAccount> users)
    {
        var user = new AdministratorAccount { Id = Guid.NewGuid(), UserName = request.Email, Email = request.Email, DisplayName = request.DisplayName.Trim(), IsActive = true, EmailConfirmed = true };
        var result = await users.CreateAsync(user, request.TemporaryPassword);
        return result.Succeeded ? Results.Created($"/api/v1/owner/accounts/{user.Id}", new { user.Id, user.DisplayName, user.Email })
            : Results.ValidationProblem(result.Errors.GroupBy(x => "account").ToDictionary(x => x.Key, x => x.Select(e => e.Description).ToArray()));
    }

    private static async Task<IResult> Deactivate(Guid id, HttpContext context, UserManager<AdministratorAccount> users)
    {
        var currentId = Guid.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var target = await users.FindByIdAsync(id.ToString());
        if (target is null) return Results.NotFound();
        if (target.IsOwner || target.Id == currentId) return Results.Conflict(new { title = "مالک یا حساب جاری را نمی‌توان غیرفعال کرد." });
        target.IsActive = false; target.DeactivatedAt = DateTimeOffset.UtcNow; target.SecurityStamp = Guid.NewGuid().ToString();
        var result = await users.UpdateAsync(target);
        return result.Succeeded ? Results.NoContent() : Results.Conflict();
    }

    private static async Task<IResult> Transfer(TransferOwnerRequest request, HttpContext context, AppDbContext db, UserManager<AdministratorAccount> users)
    {
        var currentId = Guid.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var current = await users.FindByIdAsync(currentId.ToString());
        var next = await users.FindByIdAsync(request.NewOwnerId.ToString());
        if (current is null || next is null || !next.IsActive) return Results.BadRequest();
        await using var transaction = await db.Database.BeginTransactionAsync();
        current.IsOwner = false; next.IsOwner = true;
        await users.UpdateAsync(current); await users.UpdateAsync(next); await transaction.CommitAsync();
        return Results.NoContent();
    }
}
