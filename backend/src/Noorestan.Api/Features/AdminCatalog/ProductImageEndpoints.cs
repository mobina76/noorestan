using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Noorestan.Api.Features.Catalog;
using Noorestan.Api.Infrastructure.Auditing;
using Noorestan.Api.Infrastructure.Images;
using Noorestan.Api.Infrastructure.Persistence;

namespace Noorestan.Api.Features.AdminCatalog;

public sealed record ImageOrderWrite(IReadOnlyList<Guid> OrderedImageIds);

public static class ProductImageEndpoints
{
    public static IEndpointRouteBuilder MapProductImageEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/admin/products/{productId:guid}/images").RequireAuthorization("Admin");
        group.MapPost("", Upload);
        group.MapPut("/order", Reorder);
        group.MapPost("/{imageId:guid}/primary", SetPrimary);
        group.MapPut("/{imageId:guid}", UpdateAltText);
        group.MapDelete("/{imageId:guid}", Remove);
        return endpoints;
    }

    private static async Task<IResult> Upload(Guid productId, IFormFile? file, [FromForm] string? altTextFa,
        AppDbContext db, IImageProcessor processor, IObjectStorage storage, IConfiguration config, IAuditWriter audit, CancellationToken token)
    {
        var product = await db.Products.Include(p => p.Images).SingleOrDefaultAsync(p => p.Id == productId, token);
        if (product is null) return Results.NotFound();
        if (file is null || file.Length == 0)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["file"] = ["فایل تصویر الزامی است."] });

        var maxBytes = config.GetValue<long?>("Images:MaximumUploadBytes") ?? 15_728_640;
        ValidatedImage validated;
        byte[] bytes;
        await using (var stream = file.OpenReadStream())
        {
            bytes = await processor.ReadAllBytesAsync(stream, maxBytes, token);
        }
        try
        {
            validated = processor.Validate(bytes);
        }
        catch (InvalidDataException ex)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["file"] = [ex.Message] });
        }

        var imageId = Guid.NewGuid();
        var ext = validated.MediaType switch { "image/png" => "png", "image/webp" => "webp", _ => "jpg" };
        var originalKey = $"products/{productId}/{imageId}/original.{ext}";
        using (var originalStream = new MemoryStream(bytes))
        {
            await storage.PutAsync(originalKey, originalStream, validated.MediaType, token);
        }

        var widths = config.GetSection("Images:VariantWidths").Get<int[]>() ?? [480, 768, 1200];
        var variants = processor.CreateVariants(bytes, widths);
        var variantEntities = new List<ImageVariant>();
        foreach (var variant in variants)
        {
            var key = $"products/{productId}/{imageId}/w{variant.Width}.{variant.Format}";
            using var variantStream = new MemoryStream(variant.Content);
            await storage.PutAsync(key, variantStream, $"image/{variant.Format}", token);
            variantEntities.Add(new ImageVariant { Format = variant.Format, Width = variant.Width, Height = variant.Height, ByteSize = variant.ByteSize, ObjectKey = key });
        }

        var image = new ProductImage
        {
            ProductId = productId,
            OriginalObjectKey = originalKey,
            Status = ImageProcessingStatus.Ready,
            MediaType = validated.MediaType,
            ByteSize = validated.ByteSize,
            Width = validated.Width,
            Height = validated.Height,
            Checksum = validated.Sha256,
            AltTextFa = altTextFa?.Trim() ?? string.Empty,
            DisplayOrder = product.Images.Count,
            IsPrimary = product.Images.Count == 0,
            Variants = variantEntities,
        };
        db.ProductImages.Add(image);
        await db.SaveChangesAsync(token);
        await audit.WriteAsync("product.image.upload", "ProductImage", image.Id, "success", new { productId }, token);
        return Results.Created($"/api/v1/admin/products/{productId}/images/{image.Id}", ToDto(image, storage));
    }

    private static async Task<IResult> Reorder(Guid productId, ImageOrderWrite request, AppDbContext db, CancellationToken token)
    {
        var images = await db.ProductImages.Where(i => i.ProductId == productId).ToListAsync(token);
        if (images.Count != request.OrderedImageIds.Count || !images.Select(i => i.Id).ToHashSet().SetEquals(request.OrderedImageIds))
            return Results.BadRequest(new { title = "فهرست تصاویر ارسال‌شده با تصاویر محصول مطابقت ندارد." });

        foreach (var image in images) image.DisplayOrder += 1000;
        await db.SaveChangesAsync(token);
        for (var index = 0; index < request.OrderedImageIds.Count; index++)
        {
            images.Single(x => x.Id == request.OrderedImageIds[index]).DisplayOrder = index;
        }
        await db.SaveChangesAsync(token);
        return Results.NoContent();
    }

    private static async Task<IResult> SetPrimary(Guid productId, Guid imageId, AppDbContext db, CancellationToken token)
    {
        var images = await db.ProductImages.Where(i => i.ProductId == productId).ToListAsync(token);
        var target = images.SingleOrDefault(i => i.Id == imageId);
        if (target is null) return Results.NotFound();
        if (target.Status != ImageProcessingStatus.Ready)
            return Results.BadRequest(new { title = "فقط تصویر آماده می‌تواند تصویر اصلی باشد." });

        foreach (var image in images) image.IsPrimary = false;
        await db.SaveChangesAsync(token);
        target.IsPrimary = true;
        await db.SaveChangesAsync(token);
        return Results.NoContent();
    }

    private static async Task<IResult> UpdateAltText(Guid productId, Guid imageId, AltTextWrite request, AppDbContext db, CancellationToken token)
    {
        var image = await db.ProductImages.SingleOrDefaultAsync(i => i.Id == imageId && i.ProductId == productId, token);
        if (image is null) return Results.NotFound();
        image.AltTextFa = request.AltTextFa.Trim();
        await db.SaveChangesAsync(token);
        return Results.NoContent();
    }

    private static async Task<IResult> Remove(Guid productId, Guid imageId, AppDbContext db, IObjectStorage storage, CancellationToken token)
    {
        var image = await db.ProductImages.Include(i => i.Variants).SingleOrDefaultAsync(i => i.Id == imageId && i.ProductId == productId, token);
        if (image is null) return Results.NotFound();
        var wasPrimary = image.IsPrimary;
        var keys = new[] { image.OriginalObjectKey }.Concat(image.Variants.Select(v => v.ObjectKey)).ToArray();
        db.ProductImages.Remove(image);
        await db.SaveChangesAsync(token);
        foreach (var key in keys) await storage.DeleteAsync(key, token);

        if (wasPrimary)
        {
            var next = await db.ProductImages.Where(i => i.ProductId == productId && i.Status == ImageProcessingStatus.Ready)
                .OrderBy(i => i.DisplayOrder).FirstOrDefaultAsync(token);
            if (next is not null)
            {
                next.IsPrimary = true;
                await db.SaveChangesAsync(token);
            }
        }
        return Results.NoContent();
    }

    internal static object ToDto(ProductImage image, IObjectStorage storage) => new
    {
        image.Id,
        image.AltTextFa,
        image.IsPrimary,
        image.DisplayOrder,
        image.Status,
        image.Width,
        image.Height,
        Url = storage.GetPublicUrl(image.OriginalObjectKey),
        Variants = image.Variants.OrderBy(v => v.Width).Select(v => new { Url = storage.GetPublicUrl(v.ObjectKey), v.Width, v.Height }),
    };
}

public sealed record AltTextWrite(string AltTextFa);
