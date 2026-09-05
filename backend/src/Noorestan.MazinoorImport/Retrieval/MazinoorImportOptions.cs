namespace Noorestan.MazinoorImport.Retrieval;

public sealed class MazinoorImportOptions
{
    public required IReadOnlySet<string> AllowedOrigins { get; init; }
    public TimeSpan RequestTimeout { get; init; } = TimeSpan.FromSeconds(20);
    public long MaximumResponseBytes { get; init; } = 5 * 1024 * 1024;
    public int MaximumConcurrency { get; init; } = 3;
    public int MaximumRetries { get; init; } = 2;
}
