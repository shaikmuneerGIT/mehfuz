namespace Mehfuz.Api.Models;

public class Category
{
    public string Id { get; set; } = Guid.NewGuid().ToString("n");
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public string? Description { get; set; }
    public string? Origin { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<Product> Products { get; set; } = new();
}
