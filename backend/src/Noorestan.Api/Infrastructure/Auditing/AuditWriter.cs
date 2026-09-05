using System.Security.Claims;
using System.Text.Json;
using Noorestan.Api.Infrastructure.Persistence;

namespace Noorestan.Api.Infrastructure.Auditing;

public interface IAuditWriter
{
    Task WriteAsync(string eventType, string entityType, Guid? entityId, string outcome, object? details, CancellationToken cancellationToken);
}

public sealed class AuditWriter(AppDbContext db, IHttpContextAccessor accessor) : IAuditWriter
{
    public async Task WriteAsync(string eventType, string entityType, Guid? entityId, string outcome, object? details, CancellationToken cancellationToken)
    {
        var context = accessor.HttpContext;
        var idText = context?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        db.AuditEvents.Add(new AuditEvent
        {
            AdministratorId = Guid.TryParse(idText, out var id) ? id : null,
            EventType = eventType,
            EntityType = entityType,
            EntityId = entityId,
            Outcome = outcome,
            CorrelationId = context?.TraceIdentifier ?? string.Empty,
            DetailsJson = details is null ? "{}" : JsonSerializer.Serialize(details),
        });
        await db.SaveChangesAsync(cancellationToken);
    }
}
