using System.ComponentModel.DataAnnotations;

namespace Mehfuz.Api.DTOs;

public record CheckoutItemRequest(
    [Required] string VariantId,
    [Range(1, 50)] int Quantity
);

public record CheckoutRequest(
    [Required, MinLength(2)] string CustomerName,
    [Required, MinLength(8), MaxLength(15)] string Phone,
    // Validated manually in the controller: empty string ("" — what the
    // React form sends for an unfilled optional field) must be accepted
    // alongside null and a real address; [EmailAddress] alone rejects "".
    string? Email,
    [Required, MinLength(3)] string AddressLine1,
    string? AddressLine2,
    [Required, MinLength(2)] string City,
    [Required, MinLength(2)] string State,
    [Required, MinLength(4), MaxLength(10)] string Pincode,
    string? Notes,
    [Required, MinLength(1)] List<CheckoutItemRequest> Items
);

public record OrderItemDto(
    string Id,
    string ProductId,
    string VariantId,
    string NameSnapshot,
    string LabelSnapshot,
    int PriceInr,
    int Quantity
);

public record OrderDto(
    string Id,
    string OrderNumber,
    string CustomerName,
    string Phone,
    string? Email,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string Pincode,
    string? Notes,
    string Status,
    string PaymentMethod,
    int SubtotalInr,
    int ShippingInr,
    int TotalInr,
    DateTime CreatedAt,
    List<OrderItemDto> Items
);

public record UpdateOrderStatusRequest([Required] string Status);
