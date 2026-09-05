using System.Security.Cryptography;

namespace Noorestan.Api.Infrastructure.Images;

public sealed record ValidatedImage(string MediaType, long ByteSize, string Sha256);

public interface IImageProcessor
{
    Task<ValidatedImage> ValidateAsync(Stream content, long maximumBytes, CancellationToken cancellationToken);
}

public sealed class ImageProcessor : IImageProcessor
{
    public async Task<ValidatedImage> ValidateAsync(Stream content, long maximumBytes, CancellationToken cancellationToken)
    {
        if (!content.CanSeek) throw new InvalidOperationException("A seekable stream is required.");
        if (content.Length is <= 0 || content.Length > maximumBytes) throw new InvalidDataException("Image size is invalid.");
        var header = new byte[12];
        var read = await content.ReadAsync(header, cancellationToken);
        content.Position = 0;
        var mediaType = read >= 12 && header[0] == 0xFF && header[1] == 0xD8 ? "image/jpeg"
            : read >= 8 && header.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }) ? "image/png"
            : read >= 12 && header.AsSpan(0, 4).SequenceEqual("RIFF"u8) && header.AsSpan(8, 4).SequenceEqual("WEBP"u8) ? "image/webp"
            : throw new InvalidDataException("Unsupported image signature.");
        var hash = Convert.ToHexString(await SHA256.HashDataAsync(content, cancellationToken));
        content.Position = 0;
        return new ValidatedImage(mediaType, content.Length, hash);
    }
}
