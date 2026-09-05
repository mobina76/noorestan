using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Noorestan.MazinoorImport.Contracts;
using Noorestan.MazinoorImport.Retrieval;

namespace Noorestan.MazinoorImport.Extraction;

public sealed partial class MazinoorExtractor(MazinoorHttpSource source)
{
    public async Task<ExtractedProduct> ExtractProductAsync(Uri uri, string categorySourceKey, CancellationToken cancellationToken)
    {
        var html = await source.GetHtmlAsync(uri, cancellationToken);
        var name = Decode(TitleRegex().Match(html).Groups[1].Value);
        var description = Decode(DescriptionRegex().Match(html).Groups[1].Value);
        var code = ValueOrNull(ProductCodeRegex().Match(html).Groups[1].Value);
        var warnings = new List<string>();
        if (string.IsNullOrWhiteSpace(description)) warnings.Add("Description is missing.");
        if (string.IsNullOrWhiteSpace(name)) throw new InvalidDataException("Product name is missing.");
        var images = ImageRegex().Matches(html).Select(match => new ExtractedImage(
            new Uri(uri, WebUtility.HtmlDecode(match.Groups[1].Value)), name, false, null)).ToArray();
        if (images.Length == 0) warnings.Add("No product image was found.");
        return new ExtractedProduct(code, categorySourceKey, name, null, description,
            new ExtractionTrace(uri, Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(html)))), [], [], images, warnings);
    }

    private static string Decode(string value) => WebUtility.HtmlDecode(TagRegex().Replace(value, " ")).Trim();
    private static string? ValueOrNull(string value) => string.IsNullOrWhiteSpace(value) ? null : Decode(value);

    [GeneratedRegex("<h1[^>]*>(.*?)</h1>", RegexOptions.IgnoreCase | RegexOptions.Singleline)] private static partial Regex TitleRegex();
    [GeneratedRegex("<meta[^>]+(?:name|property)=[\"'](?:description|og:description)[\"'][^>]+content=[\"']([^\"']*)", RegexOptions.IgnoreCase)] private static partial Regex DescriptionRegex();
    [GeneratedRegex("(?:data-product-code=[\"']|product[- ]?code[^<:]*[: ]+)([A-Za-z0-9_-]+)", RegexOptions.IgnoreCase)] private static partial Regex ProductCodeRegex();
    [GeneratedRegex("<img[^>]+src=[\"']([^\"']+)[\"'][^>]*>", RegexOptions.IgnoreCase)] private static partial Regex ImageRegex();
    [GeneratedRegex("<[^>]+>")] private static partial Regex TagRegex();
}
