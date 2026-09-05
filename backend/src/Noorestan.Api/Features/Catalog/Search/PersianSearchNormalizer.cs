using System.Globalization;
using System.Text;

namespace Noorestan.Api.Features.Catalog.Search;

public static class PersianSearchNormalizer
{
    public static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        var source = value.Normalize(NormalizationForm.FormKC);
        var result = new StringBuilder(source.Length);
        var previousWhitespace = false;
        foreach (var character in source)
        {
            var mapped = character switch
            {
                '\u064A' or '\u0649' => '\u06CC',
                '\u0643' => '\u06A9',
                '\u200C' or '\u200D' => ' ',
                >= '\u0660' and <= '\u0669' => (char)('0' + character - '\u0660'),
                >= '\u06F0' and <= '\u06F9' => (char)('0' + character - '\u06F0'),
                _ => character,
            };
            var category = CharUnicodeInfo.GetUnicodeCategory(mapped);
            if (category is UnicodeCategory.NonSpacingMark) continue;
            if (char.IsWhiteSpace(mapped))
            {
                if (!previousWhitespace && result.Length > 0) result.Append(' ');
                previousWhitespace = true;
            }
            else
            {
                result.Append(char.ToLowerInvariant(mapped));
                previousWhitespace = false;
            }
        }
        return result.ToString().Trim();
    }
}
