using System.Net;
using Noorestan.MazinoorImport.Retrieval;

namespace Noorestan.MazinoorImport.Tests;

public sealed class MazinoorHttpSourceTests
{
    [Fact]
    public void ValidateUriRejectsNonHttpsAndUnlistedOrigins()
    {
        var source = CreateSource(new StubHandler("<html></html>"));
        Assert.Throws<InvalidOperationException>(() => source.ValidateUri(new Uri("http://www.mazinoor.com/product")));
        Assert.Throws<InvalidOperationException>(() => source.ValidateUri(new Uri("https://example.com/product")));
    }

    [Fact]
    public async Task GetHtmlAsyncReturnsBoundedHtmlFromAllowedOrigin()
    {
        var source = CreateSource(new StubHandler("<html><h1>چراغ</h1></html>"));
        var html = await source.GetHtmlAsync(new Uri("https://www.mazinoor.com/product"), CancellationToken.None);
        Assert.Contains("چراغ", html, StringComparison.Ordinal);
    }

    private static MazinoorHttpSource CreateSource(HttpMessageHandler handler) => new(new HttpClient(handler), new MazinoorImportOptions
    {
        AllowedOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "https://www.mazinoor.com" },
        MaximumResponseBytes = 1024,
        MaximumRetries = 0,
    });

    private sealed class StubHandler(string html) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(html, System.Text.Encoding.UTF8, "text/html"),
        });
    }
}
