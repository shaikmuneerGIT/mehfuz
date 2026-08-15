using System.ComponentModel.DataAnnotations;

namespace Mehfuz.Api.DTOs;

public record StockReceiptItemInput(
    [Required] string VariantId,
    [Range(1, int.MaxValue)] int Quantity
);

public record CreateStockReceiptRequest(
    [Required] string ProductId,
    string? SupplierName,
    string? Notes,
    [Range(0, int.MaxValue)] int TotalCostInr,
    DateTime? ReceivedAt,
    [Required, MinLength(1)] List<StockReceiptItemInput> Items
);

public record StockReceiptItemDto(
    string Id,
    string VariantId,
    string LabelSnapshot,
    int Quantity
);

public record StockReceiptDto(
    string Id,
    string ProductId,
    string ProductName,
    string? SupplierName,
    string? Notes,
    int TotalCostInr,
    DateTime ReceivedAt,
    List<StockReceiptItemDto> Items
);
