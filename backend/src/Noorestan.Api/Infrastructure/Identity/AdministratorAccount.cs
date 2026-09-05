using Microsoft.AspNetCore.Identity;

namespace Noorestan.Api.Infrastructure.Identity;

public sealed class AdministratorAccount : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool IsOwner { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DeactivatedAt { get; set; }
    public DateTimeOffset? LastLoginAt { get; set; }
    public uint Version { get; set; }
}
