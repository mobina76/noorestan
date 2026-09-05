using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Noorestan.Api.Features.PublicCatalog;
using Noorestan.Api.Features.PublicSite;
using Noorestan.Api.Features.Identity;
using Noorestan.Api.Features.AdminCatalog;
using Noorestan.Api.Features.AdminContent;
using Noorestan.Api.Infrastructure.Auditing;
using Noorestan.Api.Infrastructure.Identity;
using Noorestan.Api.Infrastructure.Images;
using Noorestan.Api.Infrastructure.Persistence;
using Noorestan.Api.SeedData;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Noorestan")
    ?? "Host=localhost;Port=5432;Database=noorestan;Username=noorestan;Password=change-me";

builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
builder.Services.AddHttpContextAccessor();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddHealthChecks();
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddIdentityCore<AdministratorAccount>(options =>
{
    options.Password.RequiredLength = 12;
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Lockout.MaxFailedAccessAttempts = 5;
})
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddSignInManager()
    .AddDefaultTokenProviders();
builder.Services.AddScoped<IUserClaimsPrincipalFactory<AdministratorAccount>, AdminClaimsPrincipalFactory>();
builder.Services.AddAuthentication(IdentityConstants.ApplicationScheme).AddIdentityCookies(options =>
{
    options.ApplicationCookie?.Configure(cookie =>
    {
        cookie.Cookie.Name = "__Host-noorestan-session";
        cookie.Cookie.HttpOnly = true;
        cookie.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        cookie.Cookie.SameSite = SameSiteMode.Lax;
        cookie.Cookie.Path = "/";
    });
});
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", policy => policy.RequireAuthenticatedUser().RequireClaim("active", "true"));
    options.AddPolicy("Owner", policy => policy.RequireClaim("owner", "true").RequireClaim("active", "true"));
});
builder.Services.AddAntiforgery(options =>
{
    options.Cookie.Name = "__Host-noorestan-csrf";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.HeaderName = "X-CSRF-TOKEN";
});
builder.Services.AddRateLimiter(options => options.AddPolicy("login", context =>
    RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ =>
        new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 })));
builder.Services.AddScoped<IAuditWriter, AuditWriter>();
builder.Services.AddSingleton<IObjectStorage, DevelopmentObjectStorage>();
builder.Services.AddSingleton<IImageProcessor, ImageProcessor>();

var app = builder.Build();
app.UseExceptionHandler();
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-ancestors 'none'";
    await next();
});
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

var objectStorageRoot = Path.Combine(AppContext.BaseDirectory, "object-storage");
Directory.CreateDirectory(objectStorageRoot);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(objectStorageRoot),
    RequestPath = "/media",
});

app.Use(async (context, next) =>
{
    var path = context.Request.Path;
    var isProtectedMutation = !HttpMethods.IsGet(context.Request.Method) && !HttpMethods.IsHead(context.Request.Method) && !HttpMethods.IsOptions(context.Request.Method)
        && (path.StartsWithSegments("/api/v1/admin") || path.StartsWithSegments("/api/v1/owner"));
    if (isProtectedMutation)
    {
        var antiforgery = context.RequestServices.GetRequiredService<IAntiforgery>();
        try
        {
            await antiforgery.ValidateRequestAsync(context);
        }
        catch (AntiforgeryValidationException)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(new { title = "نشست شما نامعتبر است. صفحه را دوباره بارگذاری کنید.", status = 400 });
            return;
        }
    }
    await next();
});

if (app.Environment.IsDevelopment()) app.MapOpenApi();
app.MapHealthChecks("/health/live", new() { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new() { Predicate = check => check.Tags.Contains("ready") });

app.MapPublicCatalogEndpoints();
app.MapPublicSiteEndpoints();
app.MapOwnerAccountEndpoints();
app.MapAdminCatalogEndpoints();
app.MapProductImageEndpoints();
app.MapSpecificationEndpoints();
app.MapAdminSiteEndpoints();

var auth = app.MapGroup("/api/v1/auth");
auth.MapPost("/login", async (LoginRequest request, SignInManager<AdministratorAccount> signIn, UserManager<AdministratorAccount> users) =>
{
    var user = await users.FindByEmailAsync(request.Email);
    if (user is null || !user.IsActive) return Results.Unauthorized();
    var result = await signIn.PasswordSignInAsync(user, request.Password, false, true);
    return result.Succeeded ? Results.NoContent() : Results.Unauthorized();
}).RequireRateLimiting("login");
auth.MapPost("/logout", async (HttpContext context, IAntiforgery antiforgery, SignInManager<AdministratorAccount> signIn) =>
{
    await antiforgery.ValidateRequestAsync(context);
    await signIn.SignOutAsync();
    return Results.NoContent();
}).RequireAuthorization("Admin");
auth.MapGet("/session", (HttpContext context, IAntiforgery antiforgery) =>
{
    var tokens = antiforgery.GetAndStoreTokens(context);
    return Results.Ok(new
    {
        administratorId = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value,
        displayName = context.User.Identity?.Name,
        isOwner = context.User.HasClaim("owner", "true"),
        csrfToken = tokens.RequestToken,
    });
}).RequireAuthorization("Admin");

if (args.Contains("bootstrap-owner", StringComparer.OrdinalIgnoreCase))
{
    await OwnerBootstrap.TryRunAsync(app.Services, app.Configuration, CancellationToken.None);
    return;
}

if (args.Contains("seed-demo-data", StringComparer.OrdinalIgnoreCase))
{
    var seeded = await DemoDataSeeder.RunAsync(app.Services, CancellationToken.None);
    Console.WriteLine(seeded ? "Demo catalog seeded." : "Demo catalog already seeded; nothing to do.");
    return;
}

app.Run();

public partial class Program;
