using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Noorestan.Api.Infrastructure.Identity;

public static class OwnerBootstrap
{
    public static async Task<bool> TryRunAsync(IServiceProvider services, IConfiguration configuration, CancellationToken cancellationToken)
    {
        var email = configuration["OwnerBootstrap:Email"];
        var password = configuration["OwnerBootstrap:Password"];
        var displayName = configuration["OwnerBootstrap:DisplayName"] ?? "مالک نورستان";
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password)) return false;
        using var scope = services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<AdministratorAccount>>();
        if (await users.Users.AnyAsync(x => x.IsOwner, cancellationToken)) throw new InvalidOperationException("An owner already exists; bootstrap is one-use only.");
        var user = new AdministratorAccount { Id = Guid.NewGuid(), UserName = email, Email = email, DisplayName = displayName, IsOwner = true, IsActive = true, EmailConfirmed = true };
        var result = await users.CreateAsync(user, password);
        if (!result.Succeeded) throw new InvalidOperationException(string.Join("; ", result.Errors.Select(x => x.Description)));
        return true;
    }
}
