namespace Mehfuz.Api.Models;

public class Variant
{
    public string Id { get; set; } = Guid.NewGuid().ToString("n");
    public required string Label { get; set; }
    public int PriceInr { get; set; }
    public int Stock { get; set; } = 100;
    public bool IsActive { get; set; } = true;

    // Not `required`: when a Variant is added via Product.Variants, EF Core
    // sets this automatically through relationship fixup on save.
    public string ProductId { get; set; } = null!;
    public Product? Product { get; set; }

    public List<OrderItem> OrderItems { get; set; } = new();
}
