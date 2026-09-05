using System.Security.Cryptography;
using SkiaSharp;

namespace Noorestan.Api.Infrastructure.Images;

public sealed record ValidatedImage(string MediaType, long ByteSize, string Sha256, int Width, int Height);

public sealed record ImageVariantOutput(int Width, int Height, long ByteSize, string Format, byte[] Content);

public interface IImageProcessor
{
    Task<byte[]> ReadAllBytesAsync(Stream content, long maximumBytes, CancellationToken cancellationToken);

    ValidatedImage Validate(byte[] content);

    IReadOnlyList<ImageVariantOutput> CreateVariants(byte[] content, IReadOnlyList<int> widths);
}

public sealed class ImageProcessor : IImageProcessor
{
    public async Task<byte[]> ReadAllBytesAsync(Stream content, long maximumBytes, CancellationToken cancellationToken)
    {
        using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, cancellationToken);
        if (buffer.Length is <= 0 || buffer.Length > maximumBytes) throw new InvalidDataException("Image size is invalid.");
        return buffer.ToArray();
    }

    public ValidatedImage Validate(byte[] content)
    {
        var mediaType = SniffMediaType(content);
        var hash = Convert.ToHexString(SHA256.HashData(content));
        using var codec = SKCodec.Create(new SKMemoryStream(content)) ?? throw new InvalidDataException("Image content could not be decoded.");
        return new ValidatedImage(mediaType, content.LongLength, hash, codec.Info.Width, codec.Info.Height);
    }

    public IReadOnlyList<ImageVariantOutput> CreateVariants(byte[] content, IReadOnlyList<int> widths)
    {
        using var original = SKBitmap.Decode(content) ?? throw new InvalidDataException("Image content could not be decoded.");
        var results = new List<ImageVariantOutput>();
        foreach (var targetWidth in widths.Where(w => w < original.Width).Append(original.Width).Distinct().OrderBy(w => w))
        {
            var targetHeight = (int)Math.Round(original.Height * (targetWidth / (double)original.Width));
            using var scaled = targetWidth == original.Width
                ? original.Copy()
                : original.Resize(new SKImageInfo(targetWidth, targetHeight), new SKSamplingOptions(SKFilterMode.Linear, SKMipmapMode.Linear));
            if (scaled is null) continue;
            using var image = SKImage.FromBitmap(scaled);
            using var data = image.Encode(SKEncodedImageFormat.Jpeg, 82);
            var bytes = data.ToArray();
            results.Add(new ImageVariantOutput(targetWidth, targetHeight, bytes.LongLength, "jpeg", bytes));
        }

        return results;
    }

    private static string SniffMediaType(byte[] header)
    {
        if (header.Length >= 12 && header[0] == 0xFF && header[1] == 0xD8) return "image/jpeg";
        if (header.Length >= 8 && header.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 })) return "image/png";
        if (header.Length >= 12 && header.AsSpan(0, 4).SequenceEqual("RIFF"u8) && header.AsSpan(8, 4).SequenceEqual("WEBP"u8)) return "image/webp";
        throw new InvalidDataException("Unsupported image signature.");
    }
}
