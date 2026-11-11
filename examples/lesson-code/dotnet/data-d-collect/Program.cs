// From lesson 'd-collect' (data). Code status: Python executed 2026-11-02 (examples/gap-topics/gap_topics.py sql and viz); C# not compiled (no .NET SDK in the build environment)
using Microsoft.Data.SqlClient;

const string sql = """
    SELECT c.Id, COUNT(o.Id) AS NOrders, COALESCE(AVG(o.Amount), 0) AS AvgAmount
    FROM Customers c LEFT JOIN Orders o ON o.CustomerId = c.Id
    WHERE c.Country = @country
    GROUP BY c.Id
    """;
using var connection = new SqlConnection(Environment.GetEnvironmentVariable("SALES_DB"));
await connection.OpenAsync();
using var command = new SqlCommand(sql, connection);
command.Parameters.AddWithValue("@country", "UK");          // never paste user input into SQL text
using var reader = await command.ExecuteReaderAsync();
var rows = new List<CustomerFeatures>();
while (await reader.ReadAsync())
    rows.Add(new CustomerFeatures(reader.GetInt32(0), reader.GetInt32(1), Convert.ToSingle(reader.GetValue(2))));
Console.WriteLine($"{rows.Count} customers loaded");

public record CustomerFeatures(int Id, int NOrders, float AvgAmount);
