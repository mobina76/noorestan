using System.Net;
using Noorestan.MazinoorImport.Extraction;
using Noorestan.MazinoorImport.Retrieval;

namespace Noorestan.MazinoorImport.Tests;

public sealed class MazinoorExtractorTests
{
    // A trimmed fixture mirroring the real structure observed on mazinoor.com product pages:
    // a plain-text name/description followed by a Vue `family-grid` component whose `:rows`
    // attribute carries an HTML-entity-encoded JSON array of SKU-level attributes, and a
    // lightbox photo gallery of `family_gallery_images`.
    private const string Fixture = """
        <html><body>
        <p class='mt-6 mb-2 font-bold text-base'>چراغ دانلايت توكار گرد آريانا</p>
        <p class='mb-8'>چراغ‌ دانلایت گرد توکار آریانا با طراحی پیشرفته مازی‌نور عرضه می‌گردد. عمر طولانی قطعات روشنایی، فقدان اشعه فرابنفش (UV) از ويژگي‌هاي این چراغ است.</p>
        <family-grid type="luminaire" :rows="[{&quot;PART_NO&quot;:&quot;31AX014001&quot;,&quot;M_DIMENSION&quot;:&quot;Ø78x55&quot;,&quot;M_BEAMANGLE&quot;:&quot;32 درجه&quot;,&quot;R_SOURCECCT&quot;:&quot;3000K - Warm White&quot;,&quot;M_SOURCELM&quot;:&quot;500&quot;,&quot;M_SOURCEWATT&quot;:&quot;6&quot;,&quot;M_SOURCEEFF&quot;:&quot;83&quot;,&quot;M_CATALOGNO&quot;:&quot;M582ED2LED2830-W&quot;},{&quot;PART_NO&quot;:&quot;31AX014002&quot;,&quot;M_DIMENSION&quot;:&quot;Ø78x55&quot;,&quot;M_BEAMANGLE&quot;:&quot;32 درجه&quot;,&quot;R_SOURCECCT&quot;:&quot;4000K - Neutral White&quot;,&quot;M_SOURCELM&quot;:&quot;550&quot;,&quot;M_SOURCEWATT&quot;:&quot;35&quot;,&quot;M_SOURCEEFF&quot;:&quot;92&quot;,&quot;M_CATALOGNO&quot;:&quot;M582ED2LED2840-W&quot;}]"></family-grid>
        <a data-fslightbox="family-gallery" href="/graphic/luminaire_family_gallery_images/img-ax01-01.jpg"><img src="/graphic/luminaire_family_gallery_images/img-ax01-01.jpg?1"></a>
        <a data-fslightbox="family-gallery" href="/graphic/luminaire_family_gallery_images/img-ax01-02.jpg"><img src="/graphic/luminaire_family_gallery_images/img-ax01-02.jpg?1"></a>
        </body></html>
        """;

    private sealed class StubHandler(string html) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(html, System.Text.Encoding.UTF8, "text/html"),
        });
    }

    private static MazinoorExtractor CreateExtractor(string html)
    {
        var options = new MazinoorImportOptions { AllowedOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "https://www.mazinoor.com" } };
        return new MazinoorExtractor(new MazinoorHttpSource(new HttpClient(new StubHandler(html)), options));
    }

    [Fact]
    public async Task ExtractProductAsyncParsesRealFamilyGridStructure()
    {
        var extractor = CreateExtractor(Fixture);
        var product = await extractor.ExtractProductAsync(new Uri("https://www.mazinoor.com/product"), "downlight", CancellationToken.None);

        Assert.Equal("چراغ دانلايت توكار گرد آريانا", product.NameFa);
        Assert.Equal("31AX014001", product.MazinoorProductCode);
        Assert.Equal(2, product.Images.Count);
        Assert.True(product.Images[0].IsPrimary);
        Assert.Contains(product.Specifications, s => s.Key == "watt" && s.Value == "۶ تا ۳۵ وات");
        Assert.Contains(product.Specifications, s => s.Key == "cct" && s.Value.Contains("3000K") && s.Value.Contains("4000K"));
        Assert.Contains(product.Specifications, s => s.Key == "catalog-no" && s.Value == "M582ED2LED2830-W");
        Assert.Contains("عمر طولانی قطعات روشنایی", product.FeaturesFa);
        Assert.Empty(product.Warnings);
    }

    [Fact]
    public async Task ExtractProductAsyncThrowsWhenNameIsMissing()
    {
        var extractor = CreateExtractor("<html><body><p class='mb-8'>توضیحات بدون نام</p></body></html>");
        await Assert.ThrowsAsync<InvalidDataException>(() => extractor.ExtractProductAsync(new Uri("https://www.mazinoor.com/product"), "downlight", CancellationToken.None));
    }

    [Fact]
    public async Task ExtractProductAsyncWarnsWhenSpecificationsAndImagesAreMissing()
    {
        var extractor = CreateExtractor("<html><body><p class='mt-6 mb-2 font-bold text-base'>محصول ساده</p><p class='mb-8'>توضیح کوتاه.</p></body></html>");
        var product = await extractor.ExtractProductAsync(new Uri("https://www.mazinoor.com/product"), "downlight", CancellationToken.None);

        Assert.Empty(product.Specifications);
        Assert.Empty(product.Images);
        Assert.Contains(product.Warnings, w => w.Contains("specification"));
        Assert.Contains(product.Warnings, w => w.Contains("image"));
    }
}
