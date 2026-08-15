using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mehfuz.Api.Data;
using Mehfuz.Api.DTOs;

namespace Mehfuz.Api.Controllers;

[ApiController]
[Route("api/catalog")]
public class CatalogController(MehfuzDbContext db) : ControllerBase
{
    [HttpGet("categories")]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
    {
        var categories = await db.Categories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(
                c.Id, c.Name, c.Slug, c.Description, c.Origin, c.CreatedAt,
                c.Products.Count(p => p.IsActive)
            ))
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("products")]
    public async Task<ActionResult<List<ProductDto>>> GetProducts(
        [FromQuery] string? category,
        [FromQuery] string? featured,
        [FromQuery] string? q)
    {
        var query = db.Products
            .Include(p => p.Category)
            .Include(p => p.Variants.Where(v => v.IsActive))
            .Where(p => p.IsActive)
            // A product with no sellable pack size would render as "From ₹0" on the storefront.
            .Where(p => p.Variants.Any(v => v.IsActive));

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(p => p.Category!.Slug == category);

        if (featured == "true")
            query = query.Where(p => p.IsFeatured);

        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(p => p.Name.Contains(q) || (p.Description != null && p.Description.Contains(q)));

        var products = await query.OrderBy(p => p.Name).ToListAsync();

        return Ok(products.Select(ToDto));
    }

    [HttpGet("products/{slug}")]
    public async Task<ActionResult<ProductDto>> GetProduct(string slug)
    {
        var product = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Variants.Where(v => v.IsActive))
            .FirstOrDefaultAsync(p => p.Slug == slug);

        if (product is null || !product.IsActive)
            return NotFound(new { error = "Product not found" });

        return Ok(ToDto(product));
    }

    internal static ProductDto ToDto(Models.Product p) => new(
        p.Id, p.Name, p.Slug, p.Description, p.Origin, p.Badge, p.ImageUrl,
        p.IsFeatured, p.IsActive, p.CategoryId,
        new CategoryDto(p.Category!.Id, p.Category.Name, p.Category.Slug, p.Category.Description, p.Category.Origin, p.Category.CreatedAt, 0),
        p.Variants
            .OrderBy(v => v.PriceInr)
            .Select(v => new VariantDto(v.Id, v.Label, v.PriceInr, v.Stock, v.IsActive))
            .ToList()
    );
}
