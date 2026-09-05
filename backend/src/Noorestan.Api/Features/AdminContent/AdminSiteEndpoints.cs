using Microsoft.EntityFrameworkCore;
using Noorestan.Api.Features.Content;
using Noorestan.Api.Infrastructure.Persistence;

namespace Noorestan.Api.Features.AdminContent;

public sealed record PhoneNumberWrite(string Number, bool IsAlsoFax);
public sealed record BusinessProfileWrite(string BusinessNameFa, string RepresentativeStatementFa, string? AddressFa, IReadOnlyList<PhoneNumberWrite> Phones, string WhatsApp, string Email, string? OperatingHoursFa);
public sealed record ManagedContentWrite(string TitleFa, string BodyFa, string? CallToActionLabelFa, string? CallToActionTarget, bool IsVisible);

public static class AdminSiteEndpoints
{
    private static readonly HashSet<string> AllowedSlots = new(StringComparer.Ordinal)
    {
        "home.hero", "home.why-noorestan", "home.company-intro", "home.contact-band", "company.intro", "contact.notice",
    };

    public static IEndpointRouteBuilder MapAdminSiteEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/admin/site").RequireAuthorization("Admin");
        group.MapGet("/profile", GetProfile);
        group.MapPut("/profile", UpdateProfile);
        group.MapGet("/content", ListContent);
        group.MapPut("/content/{slotKey}", UpdateContent);
        return endpoints;
    }

    private static async Task<IResult> GetProfile(AppDbContext db, CancellationToken token)
    {
        var profile = await db.BusinessProfiles.AsNoTracking().FirstOrDefaultAsync(token);
        return Results.Ok(profile ?? new BusinessProfile());
    }

    private static async Task<IResult> UpdateProfile(BusinessProfileWrite request, HttpRequest http, AppDbContext db, CancellationToken token)
    {
        if (string.IsNullOrWhiteSpace(request.BusinessNameFa) || string.IsNullOrWhiteSpace(request.RepresentativeStatementFa))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["businessNameFa"] = ["نام کسب‌وکار و شرح نمایندگی الزامی است."] });

        var entity = await db.BusinessProfiles.FirstOrDefaultAsync(token);
        if (entity is null)
        {
            entity = new BusinessProfile();
            db.BusinessProfiles.Add(entity);
        }
        else if (!Matches(http, entity.Version))
        {
            return Results.Conflict(new { title = "این اطلاعات توسط مدیر دیگری تغییر کرده است.", entity.Version });
        }

        entity.BusinessNameFa = request.BusinessNameFa.Trim();
        entity.RepresentativeStatementFa = request.RepresentativeStatementFa.Trim();
        entity.AddressFa = request.AddressFa?.Trim();
        entity.Phones = request.Phones
            .Select(p => new PhoneNumber { Number = p.Number.Trim(), IsAlsoFax = p.IsAlsoFax })
            .Where(p => p.Number.Length > 0)
            .ToList();
        entity.WhatsApp = request.WhatsApp.Trim();
        entity.Email = request.Email.Trim();
        entity.OperatingHoursFa = request.OperatingHoursFa?.Trim();
        await db.SaveChangesAsync(token);
        return Results.Ok(entity);
    }

    private static async Task<IResult> ListContent(AppDbContext db, CancellationToken token) =>
        Results.Ok(await db.ManagedContents.AsNoTracking().OrderBy(x => x.SlotKey).ToListAsync(token));

    private static async Task<IResult> UpdateContent(string slotKey, ManagedContentWrite request, HttpRequest http, AppDbContext db, CancellationToken token)
    {
        if (!AllowedSlots.Contains(slotKey))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["slotKey"] = ["این بخش محتوایی مجاز نیست."] });
        if (string.IsNullOrWhiteSpace(request.TitleFa) || string.IsNullOrWhiteSpace(request.BodyFa))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["titleFa"] = ["عنوان و متن الزامی است."] });
        if (request.CallToActionTarget is { Length: > 0 } target && !(target.StartsWith('/') || target.StartsWith("tel:", StringComparison.Ordinal) || target.StartsWith("https://wa.me/", StringComparison.Ordinal) || target.StartsWith("mailto:", StringComparison.Ordinal)))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["callToActionTarget"] = ["مقصد دکمه باید یک مسیر داخلی، تماس، واتساپ یا ایمیل معتبر باشد."] });

        var entity = await db.ManagedContents.FirstOrDefaultAsync(x => x.SlotKey == slotKey, token);
        if (entity is null)
        {
            entity = new ManagedContent { SlotKey = slotKey };
            db.ManagedContents.Add(entity);
        }
        else if (!Matches(http, entity.Version))
        {
            return Results.Conflict(new { title = "این محتوا توسط مدیر دیگری تغییر کرده است.", entity.Version });
        }

        entity.TitleFa = request.TitleFa.Trim();
        entity.BodyFa = request.BodyFa.Trim();
        entity.CallToActionLabelFa = request.CallToActionLabelFa?.Trim();
        entity.CallToActionTarget = request.CallToActionTarget?.Trim();
        entity.IsVisible = request.IsVisible;
        await db.SaveChangesAsync(token);
        return Results.Ok(entity);
    }

    private static bool Matches(HttpRequest request, uint version) => uint.TryParse(request.Headers.IfMatch.ToString().Trim('"'), out var supplied) && supplied == version;
}
