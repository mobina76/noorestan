namespace Noorestan.MazinoorImport.Retrieval;

public sealed class MazinoorHttpSource(HttpClient client, MazinoorImportOptions options)
{
    public async Task<string> GetHtmlAsync(Uri uri, CancellationToken cancellationToken)
    {
        ValidateUri(uri);
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(options.RequestTimeout);
        for (var attempt = 0; ; attempt++)
        {
            try
            {
                using var response = await client.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
                response.EnsureSuccessStatusCode();
                if (response.Content.Headers.ContentLength > options.MaximumResponseBytes) throw new InvalidDataException("Source response is too large.");
                var mediaType = response.Content.Headers.ContentType?.MediaType;
                if (mediaType is not ("text/html" or "application/xhtml+xml")) throw new InvalidDataException("Source did not return HTML.");
                await using var stream = await response.Content.ReadAsStreamAsync(timeout.Token);
                using var reader = new StreamReader(stream);
                var buffer = new char[8192];
                var total = 0;
                var writer = new System.Text.StringBuilder();
                while (await reader.ReadAsync(buffer, timeout.Token) is var read && read > 0)
                {
                    total += read;
                    if (total > options.MaximumResponseBytes) throw new InvalidDataException("Source response is too large.");
                    writer.Append(buffer, 0, read);
                }
                return writer.ToString();
            }
            catch (HttpRequestException) when (attempt < options.MaximumRetries)
            {
                await Task.Delay(TimeSpan.FromMilliseconds(250 * Math.Pow(2, attempt)), timeout.Token);
            }
        }
    }

    public void ValidateUri(Uri uri)
    {
        if (uri.Scheme != Uri.UriSchemeHttps || !options.AllowedOrigins.Contains(uri.GetLeftPart(UriPartial.Authority)))
            throw new InvalidOperationException("URL is not an allowed official Mazinoor origin.");
    }
}
