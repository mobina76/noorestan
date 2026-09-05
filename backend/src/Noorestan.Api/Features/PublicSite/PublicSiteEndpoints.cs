using Microsoft.EntityFrameworkCore;
using Noorestan.Api.Infrastructure.Persistence;

namespace Noorestan.Api.Features.PublicSite;

public static class PublicSiteEndpoints
{
    public static IEndpointRouteBuilder MapPublicSiteEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/v1/public/site", async (AppDbContext db, CancellationToken cancellationToken) =>
        {
            var profile = await db.BusinessProfiles.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
            var content = await db.ManagedContents.AsNoTracking().Where(x => x.IsVisible).OrderBy(x => x.SlotKey)
                .Select(x => new { x.SlotKey, x.TitleFa, x.BodyFa, x.CallToActionLabelFa, x.CallToActionTarget }).ToListAsync(cancellationToken);
            return Results.Ok(new { BusinessNameFa = profile?.BusinessNameFa ?? "نورستان",
                RepresentativeStatementFa = profile?.RepresentativeStatementFa ?? "نماینده فروش محصولات روشنایی مازی‌نور",
                Phone = profile?.Phone ?? string.Empty, WhatsApp = profile?.WhatsApp ?? string.Empty,
                Email = profile?.Email ?? string.Empty, AddressFa = profile?.AddressFa, Content = content });
        });
        return endpoints;
    }
}
