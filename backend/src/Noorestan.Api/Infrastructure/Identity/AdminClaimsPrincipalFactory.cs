using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace Noorestan.Api.Infrastructure.Identity;

public sealed class AdminClaimsPrincipalFactory(
    UserManager<AdministratorAccount> users,
    RoleManager<IdentityRole<Guid>> roles,
    IOptions<IdentityOptions> options)
    : UserClaimsPrincipalFactory<AdministratorAccount, IdentityRole<Guid>>(users, roles, options)
{
    protected override async Task<ClaimsIdentity> GenerateClaimsAsync(AdministratorAccount user)
    {
        var identity = await base.GenerateClaimsAsync(user);
        identity.AddClaim(new Claim("active", user.IsActive ? "true" : "false"));
        identity.AddClaim(new Claim("owner", user.IsOwner ? "true" : "false"));
        identity.AddClaim(new Claim("display_name", user.DisplayName));
        return identity;
    }
}
