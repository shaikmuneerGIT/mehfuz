namespace Mehfuz.Api.DTOs;

public record CategoryDto(
    string Id,
    string Name,
    string Slug,
    string? Description,
    string? Origin,
    DateTime CreatedAt,
    int ProductCount
);

public record VariantDto(
    string Id,
    string Label,
    int PriceInr,
    int Stock,
    bool IsActive
);

public record ProductDto(
    string Id,
    string Name,
    string Slug,
    string? Description,
    string? Origin,
    string? Badge,
    string? ImageUrl,
    bool IsFeatured,
    bool IsActive,
    string CategoryId,
    CategoryDto Category,
    List<VariantDto> Variants
);
