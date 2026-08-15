namespace Mehfuz.Api.Models;

public class Product
{
    public string Id { get; set; } = Guid.NewGuid().ToString("n");
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public string? Description { get; set; }
    public string? Origin { get; set; }
    public string? Badge { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public required string CategoryId { get; set; }
    public Category? Category { get; set; }

    public List<Variant> Variants { get; set; } = new();
    public List<OrderItem> OrderItems { get; set; } = new();
}
