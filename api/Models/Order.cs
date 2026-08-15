namespace Mehfuz.Api.Models;

public enum OrderStatus
{
    Pending,
    Confirmed,
    Packed,
    Shipped,
    Delivered,
    Cancelled,
}

public class Order
{
    public string Id { get; set; } = Guid.NewGuid().ToString("n");
    public required string OrderNumber { get; set; }
    public required string CustomerName { get; set; }
    public required string Phone { get; set; }
    public string? Email { get; set; }
    public required string AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public required string City { get; set; }
    public required string State { get; set; }
    public required string Pincode { get; set; }
    public string? Notes { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public string PaymentMethod { get; set; } = "COD";
    public int SubtotalInr { get; set; }
    public int ShippingInr { get; set; }
    public int TotalInr { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<OrderItem> Items { get; set; } = new();
}
