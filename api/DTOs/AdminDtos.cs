using System.ComponentModel.DataAnnotations;

namespace Mehfuz.Api.DTOs;

public record LoginRequest([Required, EmailAddress] string Email, [Required] string Password);

public record AdminInfoDto(string Id, string Email, string Name);

public record LoginResponse(string Token, AdminInfoDto Admin);

public record UpsertCategoryRequest(
    [Required, MinLength(2)] string Name,
    string? Description,
    string? Origin
);

public record VariantInput(
    string? Id,
    [Required] string Label,
    [Range(1, int.MaxValue)] int PriceInr,
    [Range(0, int.MaxValue)] int Stock
);

public record UpsertProductRequest(
    [Required, MinLength(2)] string Name,
    string? Description,
    string? Origin,
    string? Badge,
    string? ImageUrl,
    bool? IsFeatured,
    bool? IsActive,
    [Required] string CategoryId,
    [Required, MinLength(1)] List<VariantInput> Variants
);

public record SetVisibilityRequest(bool IsActive);

public record AdminSummaryDto(
    int ProductCount,
    int OrderCount,
    int PendingOrders,
    int TotalRevenueInr,
    int TotalStockCostInr,
    int ProfitInr
);
