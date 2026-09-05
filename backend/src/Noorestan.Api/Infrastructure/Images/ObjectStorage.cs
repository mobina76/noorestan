namespace Noorestan.Api.Infrastructure.Images;

public interface IObjectStorage
{
    Task PutAsync(string key, Stream content, string mediaType, CancellationToken cancellationToken);
    Task DeleteAsync(string key, CancellationToken cancellationToken);
    string GetPublicUrl(string key);
}

public sealed class DevelopmentObjectStorage(IConfiguration configuration) : IObjectStorage
{
    private readonly string _root = Path.Combine(AppContext.BaseDirectory, "object-storage");
    private readonly string _publicBaseUrl = configuration["ObjectStorage:PublicBaseUrl"] ?? "/media";

    public async Task PutAsync(string key, Stream content, string mediaType, CancellationToken cancellationToken)
    {
        var path = SafePath(key);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        await using var output = File.Create(path);
        await content.CopyToAsync(output, cancellationToken);
    }

    public Task DeleteAsync(string key, CancellationToken cancellationToken)
    {
        var path = SafePath(key);
        if (File.Exists(path)) File.Delete(path);
        return Task.CompletedTask;
    }

    public string GetPublicUrl(string key) => $"{_publicBaseUrl.TrimEnd('/')}/{Uri.EscapeDataString(key).Replace("%2F", "/", StringComparison.OrdinalIgnoreCase)}";

    private string SafePath(string key)
    {
        var root = Path.GetFullPath(_root);
        var path = Path.GetFullPath(Path.Combine(root, key.Replace('/', Path.DirectorySeparatorChar)));
        if (!path.StartsWith(root, StringComparison.Ordinal)) throw new InvalidOperationException("Invalid object key.");
        return path;
    }
}
