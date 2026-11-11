// From lesson 'app-multimodal' (apps). Code status: Conceptual (no model access in the build environment); C# not compiled (no .NET SDK)
using Microsoft.Extensions.AI;

byte[] image = await File.ReadAllBytesAsync("invoice.png");
var message = new ChatMessage(ChatRole.User,
[
    new TextContent("Extract the invoice number, date (YYYY-MM-DD) and total. Use null if missing."),
    new DataContent(image, "image/png"),
]);
ChatResponse<Invoice> response = await chat.GetResponseAsync<Invoice>([message], new ChatOptions { Temperature = 0 });

if (response.TryGetResult(out var invoice) && invoice is not null && DateOnly.TryParse(invoice.Date, out _) && invoice.Total >= 0)
    Console.WriteLine($"{invoice.InvoiceNumber}: {invoice.Total} on {invoice.Date}");
else
    Console.WriteLine("Could not read the invoice reliably; send to a person.");

public record Invoice(string? InvoiceNumber, string? Date, decimal Total);
