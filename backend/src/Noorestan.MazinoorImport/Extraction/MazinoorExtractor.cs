using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Noorestan.MazinoorImport.Contracts;
using Noorestan.MazinoorImport.Retrieval;

namespace Noorestan.MazinoorImport.Extraction;

/// <summary>
/// Parses official mazinoor.com product pages. Real Mazinoor pages embed each SKU variant's
/// structured attributes (wattage, lumen output, CCT, dimensions, catalog number, ...) as an
/// HTML-entity-encoded JSON array in a `&lt;family-grid :rows="[...]"&gt;` component attribute,
/// alongside a plain-text name/description and a lightbox photo gallery. This extractor targets
/// that real, observed structure rather than inventing a generic layout.
/// </summary>
public sealed partial class MazinoorExtractor(MazinoorHttpSource source)
{
    public async Task<ExtractedProduct> ExtractProductAsync(Uri uri, string categorySourceKey, CancellationToken cancellationToken)
    {
        var html = await source.GetHtmlAsync(uri, cancellationToken);
        var name = Decode(NameRegex().Match(html).Groups[1].Value);
        var description = Decode(DescriptionRegex().Match(html).Groups[1].Value);
        if (string.IsNullOrWhiteSpace(name)) throw new InvalidDataException("Product name is missing.");

        var warnings = new List<string>();
        if (string.IsNullOrWhiteSpace(description)) warnings.Add("Description is missing.");

        var rows = ParseRows(html);
        var specifications = new List<ExtractedSpecification>();
        string? catalogNo = null;
        if (rows.Count > 0)
        {
            AddSpec(specifications, rows, "M_SOURCEWATT", "watt", "توان", "وات");
            AddSpec(specifications, rows, "M_SOURCELM", "lumen", "شار نوری", "لومن");
            AddSpec(specifications, rows, "M_SOURCEEFF", "efficacy", "بازده نوری", "لومن بر وات");
            AddSpec(specifications, rows, "M_BEAMANGLE", "beam-angle", "زاویه تابش", null);
            AddSpec(specifications, rows, "M_DIMENSION", "dimension", "ابعاد", null);
            AddCctSpec(specifications, rows);
            catalogNo = rows[0].GetValueOrDefault("M_CATALOGNO");
            if (catalogNo is not null) specifications.Add(new ExtractedSpecification("catalog-no", "کد فنی مرجع", catalogNo));
        }
        else
        {
            warnings.Add("No structured specification data was found on this page.");
        }

        var images = GalleryRegex().Matches(html)
            .Select((match, index) => new ExtractedImage(new Uri(uri, WebUtility.HtmlDecode(match.Groups[1].Value)), name, index == 0, null))
            .ToList();
        if (images.Count == 0) warnings.Add("No product image was found.");

        var code = rows.Count > 0 ? rows[0].GetValueOrDefault("PART_NO") : null;
        var features = SplitFeatures(description);
        var trace = new ExtractionTrace(uri, Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(html))));

        return new ExtractedProduct(code ?? catalogNo, categorySourceKey, name, null, description, trace, features, specifications, images, warnings);
    }

    private static List<Dictionary<string, string>> ParseRows(string html)
    {
        var match = RowsRegex().Match(html);
        if (!match.Success) return [];
        var decoded = Decode(match.Groups[1].Value);
        try
        {
            using var document = JsonDocument.Parse(decoded);
            var rows = new List<Dictionary<string, string>>();
            foreach (var element in document.RootElement.EnumerateArray())
            {
                var row = new Dictionary<string, string>();
                foreach (var property in element.EnumerateObject())
                {
                    if (property.Value.ValueKind is JsonValueKind.String) row[property.Name] = property.Value.GetString() ?? "";
                }
                rows.Add(row);
            }
            return rows;
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static void AddSpec(List<ExtractedSpecification> specifications, List<Dictionary<string, string>> rows, string field, string key, string label, string? unit)
    {
        var values = rows.Select(r => r.GetValueOrDefault(field)).Where(v => !string.IsNullOrWhiteSpace(v)).Distinct().ToList();
        if (values.Count == 0) return;
        var text = NumericRangeOrJoin(values!) + (unit is null ? "" : $" {unit}");
        specifications.Add(new ExtractedSpecification(key, label, text));
    }

    private static void AddCctSpec(List<ExtractedSpecification> specifications, List<Dictionary<string, string>> rows)
    {
        var values = rows.Select(r => r.GetValueOrDefault("R_SOURCECCT")?.Split(" - ")[0]).Where(v => !string.IsNullOrWhiteSpace(v)).Distinct().ToList();
        if (values.Count == 0) return;
        specifications.Add(new ExtractedSpecification("cct", "دمای رنگ", string.Join("، ", values)));
    }

    private static string NumericRangeOrJoin(List<string> values)
    {
        var numbers = values.Select(v => decimal.TryParse(v, NumberStyles.Number, CultureInfo.InvariantCulture, out var n) ? (decimal?)n : null).ToList();
        if (numbers.All(n => n is not null))
        {
            var min = numbers.Min()!.Value;
            var max = numbers.Max()!.Value;
            return min == max ? ToPersianDigits(min) : $"{ToPersianDigits(min)} تا {ToPersianDigits(max)}";
        }
        return string.Join("، ", values);
    }

    private static string ToPersianDigits(decimal value)
    {
        var text = value.ToString("0.##", CultureInfo.InvariantCulture);
        return text.Aggregate(new StringBuilder(), (builder, c) => builder.Append(c is >= '0' and <= '9' ? (char)('۰' + (c - '0')) : c)).ToString();
    }

    private static List<string> SplitFeatures(string description)
    {
        var sentences = Regex.Split(description.Trim(), @"(?<=[.])\s+");
        if (sentences.Length < 2) return [];
        var tail = string.Join(" ", sentences.Skip(1));
        tail = Regex.Replace(tail, "از (ويژگي‌هاي|ویژگی‌های) این چراغ است\\.?", "");
        tail = Regex.Replace(tail, "می[‌ ]?توان به\\s*", "");
        tail = Regex.Replace(tail, "اشاره کرد\\.?", "");
        return tail.Split(['،', ',']).Select(s => s.Trim()).Where(s => s.Length > 1).ToList();
    }

    private static string Decode(string value) => WebUtility.HtmlDecode(TagRegex().Replace(value, " ")).Trim();

    [GeneratedRegex(@"<p class='mt-6 mb-2 font-bold text-base'>([^<]*)</p>", RegexOptions.IgnoreCase)] private static partial Regex NameRegex();
    [GeneratedRegex(@"<p class='mb-8'>([^<]*)</p>", RegexOptions.IgnoreCase)] private static partial Regex DescriptionRegex();
    [GeneratedRegex(@":rows=""([^""]*)""", RegexOptions.IgnoreCase)] private static partial Regex RowsRegex();
    [GeneratedRegex(@"data-fslightbox=""family-gallery"" href=""(/graphic/luminaire_family_gallery_images/[^""]+\.jpg)""", RegexOptions.IgnoreCase)] private static partial Regex GalleryRegex();
    [GeneratedRegex("<[^>]+>")] private static partial Regex TagRegex();
}
