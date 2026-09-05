namespace Noorestan.MazinoorImport.Contracts;

public sealed record ExtractionTrace(Uri SourceUrl, string SourceContentHash);
public sealed record ExtractedImage(Uri SourceUrl, string AltTextFa, bool IsPrimary, string? SourceContentHash);
public sealed record ExtractedSpecification(string Key, string LabelFa, string Value);
public sealed record ExtractedProduct(
    string? MazinoorProductCode,
    string CategorySourceKey,
    string NameFa,
    string? ShortDescriptionFa,
    string DescriptionFa,
    ExtractionTrace Trace,
    IReadOnlyList<string> FeaturesFa,
    IReadOnlyList<ExtractedSpecification> Specifications,
    IReadOnlyList<ExtractedImage> Images,
    IReadOnlyList<string> Warnings);

public sealed record MazinoorExtraction(
    string SchemaVersion,
    Uri SourceBaseUrl,
    string ExtractorVersion,
    DateTimeOffset FetchedAt,
    IReadOnlyList<ExtractedProduct> Products,
    IReadOnlyList<string> Warnings);
