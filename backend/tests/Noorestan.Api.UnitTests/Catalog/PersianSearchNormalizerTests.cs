using Noorestan.Api.Features.Catalog.Search;

namespace Noorestan.Api.UnitTests.Catalog;

public sealed class PersianSearchNormalizerTests
{
    [Theory]
    [InlineData("چراغ كیفی", "چراغ کیفی")]
    [InlineData("مدل ۱۲۳", "مدل 123")]
    [InlineData("  نور‌ خطی  ", "نور خطی")]
    public void NormalizeStandardizesCommonPersianSearchVariants(string source, string expected)
    {
        Assert.Equal(expected, PersianSearchNormalizer.Normalize(source));
    }
}
