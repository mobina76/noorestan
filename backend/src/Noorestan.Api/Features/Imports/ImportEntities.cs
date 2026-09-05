using Noorestan.Api.Infrastructure.Persistence;

namespace Noorestan.Api.Features.CatalogImports;

public enum ImportMode { DryRun, Commit }
public enum ImportRunStatus { Queued, Running, Completed, CompletedWithWarnings, Failed, Cancelled }
public enum ImportItemOutcome { New, Unchanged, Updated, Skipped, Invalid, Failed }

public sealed class ImportRun : EntityBase
{
    public string SourceBaseUrl { get; set; } = string.Empty;
    public string ExtractorVersion { get; set; } = string.Empty;
    public ImportMode Mode { get; set; }
    public ImportRunStatus Status { get; set; } = ImportRunStatus.Queued;
    public string? RequestedScopeJson { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public Guid RequestedBy { get; set; }
    public string SummaryJson { get; set; } = "{}";
    public string? ErrorSummary { get; set; }
    public List<ImportItem> Items { get; set; } = [];
}

public sealed class ImportItem : EntityBase
{
    public Guid ImportRunId { get; set; }
    public ImportRun ImportRun { get; set; } = null!;
    public string CanonicalSourceUrl { get; set; } = string.Empty;
    public string? MazinoorProductCode { get; set; }
    public string SourceContentHash { get; set; } = string.Empty;
    public ImportItemOutcome Outcome { get; set; }
    public Guid? ProductId { get; set; }
    public string MessagesJson { get; set; } = "[]";
    public DateTimeOffset FetchedAt { get; set; }
}
