namespace Mehfuz.Api.Models;

/// <summary>
/// A bulk delivery from a supplier (e.g. "10kg box of Anjeer"), recorded
/// against a product and broken down by how many units of each pack size
/// it was portioned into — <see cref="StockReceiptItem"/> — which is what
/// actually credits sellable stock.
/// </summary>
public class StockReceipt
{
    public string Id { get; set; } = Guid.NewGuid().ToString("n");

    public required string ProductId { get; set; }
    public Product? Product { get; set; }

    public string? SupplierName { get; set; }
    public string? Notes { get; set; }
    public int TotalCostInr { get; set; }
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<StockReceiptItem> Items { get; set; } = new();
}

public class StockReceiptItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString("n");

    public string StockReceiptId { get; set; } = null!;
    public StockReceipt? StockReceipt { get; set; }

    public required string VariantId { get; set; }
    public Variant? Variant { get; set; }

    // Snapshot of the pack size label at receipt time (e.g. "250g"), so
    // history reads correctly even if the variant is later renamed/removed.
    public required string LabelSnapshot { get; set; }
    public int Quantity { get; set; }
}
