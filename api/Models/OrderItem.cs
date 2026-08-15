namespace Mehfuz.Api.Models;

public class OrderItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString("n");

    // Not `required`: when an OrderItem is added via Order.Items, EF Core
    // sets this automatically through relationship fixup on save.
    public string OrderId { get; set; } = null!;
    public Order? Order { get; set; }

    public required string ProductId { get; set; }
    public Product? Product { get; set; }

    public required string VariantId { get; set; }
    public Variant? Variant { get; set; }

    public required string NameSnapshot { get; set; }
    public required string LabelSnapshot { get; set; }
    public int PriceInr { get; set; }
    public int Quantity { get; set; }
}
