using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mehfuz.Api.Data;
using Mehfuz.Api.DTOs;
using Mehfuz.Api.Middleware;
using Mehfuz.Api.Models;
using Mehfuz.Api.Services;

namespace Mehfuz.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize]
public class AdminController(MehfuzDbContext db) : ControllerBase
{
    // ---- Categories ----

    [HttpPost("categories")]
    public async Task<ActionResult<CategoryDto>> CreateCategory(UpsertCategoryRequest request)
    {
        var category = new Category
        {
            Name = request.Name,
            Slug = Slugify.ToSlug(request.Name),
            Description = request.Description,
            Origin = request.Origin,
        };
        db.Categories.Add(category);
        await db.SaveChangesAsync();
        return StatusCode(201, new CategoryDto(category.Id, category.Name, category.Slug, category.Description, category.Origin, category.CreatedAt, 0));
    }

    [HttpPut("categories/{id}")]
    public async Task<ActionResult<CategoryDto>> UpdateCategory(string id, UpsertCategoryRequest request)
    {
        var category = await db.Categories.FindAsync(id);
        if (category is null) return NotFound(new { error = "Category not found" });

        category.Name = request.Name;
        category.Slug = Slugify.ToSlug(request.Name);
        category.Description = request.Description;
        category.Origin = request.Origin;
        await db.SaveChangesAsync();

        return Ok(new CategoryDto(category.Id, category.Name, category.Slug, category.Description, category.Origin, category.CreatedAt, 0));
    }

    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategory(string id)
    {
        var productCount = await db.Products.CountAsync(p => p.CategoryId == id);
        if (productCount > 0)
            return Conflict(new { error = $"This category still has {productCount} product(s). Move or delete them first." });

        var category = await db.Categories.FindAsync(id);
        if (category is null) return NotFound(new { error = "Category not found" });

        db.Categories.Remove(category);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ---- Products ----

    [HttpPost("products")]
    public async Task<ActionResult<ProductDto>> CreateProduct(UpsertProductRequest request)
    {
        var product = new Product
        {
            Name = request.Name,
            Slug = Slugify.ToUniqueSlug(request.Name),
            Description = request.Description,
            Origin = request.Origin,
            Badge = request.Badge,
            ImageUrl = request.ImageUrl,
            IsFeatured = request.IsFeatured ?? false,
            IsActive = request.IsActive ?? true,
            CategoryId = request.CategoryId,
            Variants = request.Variants.Select(v => new Variant
            {
                Label = v.Label,
                PriceInr = v.PriceInr,
                Stock = v.Stock,
            }).ToList(),
        };

        db.Products.Add(product);
        await db.SaveChangesAsync();

        await db.Entry(product).Reference(p => p.Category).LoadAsync();
        return StatusCode(201, CatalogController.ToDto(product));
    }

    [HttpPut("products/{id}")]
    public async Task<ActionResult<ProductDto>> UpdateProduct(string id, UpsertProductRequest request)
    {
        var existing = await db.Products.Include(p => p.Variants).FirstOrDefaultAsync(p => p.Id == id);
        if (existing is null) return NotFound(new { error = "Product not found" });

        var incomingIds = request.Variants.Where(v => v.Id != null).Select(v => v.Id!).ToHashSet();
        var removed = existing.Variants.Where(v => !incomingIds.Contains(v.Id)).ToList();

        // A pack size that appears in a past order is deactivated rather than
        // deleted, so order history keeps pointing at something real.
        var removedIds = removed.Select(v => v.Id).ToList();
        var orderedVariantIds = await db.OrderItems
            .Where(oi => removedIds.Contains(oi.VariantId))
            .Select(oi => oi.VariantId)
            .Distinct()
            .ToListAsync();

        foreach (var variant in removed)
        {
            if (orderedVariantIds.Contains(variant.Id))
                variant.IsActive = false;
            else
                db.Variants.Remove(variant);
        }

        foreach (var input in request.Variants)
        {
            if (input.Id is not null)
            {
                var variant = existing.Variants.First(v => v.Id == input.Id);
                variant.Label = input.Label;
                variant.PriceInr = input.PriceInr;
                variant.Stock = input.Stock;
            }
            else
            {
                existing.Variants.Add(new Variant { Label = input.Label, PriceInr = input.PriceInr, Stock = input.Stock });
            }
        }

        existing.Name = request.Name;
        existing.Description = request.Description;
        existing.Origin = request.Origin;
        existing.Badge = request.Badge;
        existing.ImageUrl = request.ImageUrl;
        existing.IsFeatured = request.IsFeatured ?? existing.IsFeatured;
        existing.IsActive = request.IsActive ?? existing.IsActive;
        existing.CategoryId = request.CategoryId;
        existing.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        await db.Entry(existing).Reference(p => p.Category).LoadAsync();
        await db.Entry(existing).Collection(p => p.Variants).LoadAsync();
        existing.Variants = existing.Variants.Where(v => v.IsActive).OrderBy(v => v.PriceInr).ToList();

        return Ok(CatalogController.ToDto(existing));
    }

    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(string id)
    {
        // Order history references products, so a product that has ever been
        // ordered must not be hard-deleted — that would destroy those orders.
        var ordered = await db.OrderItems.CountAsync(oi => oi.ProductId == id);
        if (ordered > 0)
        {
            return Conflict(new
            {
                error = "This product has past orders, so deleting it would remove them from your order history. Hide it from the shop instead.",
                canHide = true,
            });
        }

        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound(new { error = "Product not found" });

        db.Products.Remove(product);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("products/{id}/visibility")]
    public async Task<ActionResult<ProductDto>> SetVisibility(string id, SetVisibilityRequest request)
    {
        var product = await db.Products.Include(p => p.Category).Include(p => p.Variants).FirstOrDefaultAsync(p => p.Id == id);
        if (product is null) return NotFound(new { error = "Product not found" });

        product.IsActive = request.IsActive;
        await db.SaveChangesAsync();
        return Ok(CatalogController.ToDto(product));
    }

    [HttpGet("products")]
    public async Task<ActionResult<List<ProductDto>>> GetAllProducts()
    {
        var products = await db.Products
            .Include(p => p.Category)
            // Deactivated pack sizes are retired, not editable — keep them out
            // of the admin list so they don't reappear in the edit form.
            .Include(p => p.Variants.Where(v => v.IsActive))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(products.Select(CatalogController.ToDto));
    }

    // ---- Dashboard summary ----

    [HttpGet("summary")]
    public async Task<ActionResult<AdminSummaryDto>> GetSummary()
    {
        var productCount = await db.Products.CountAsync();
        var orderCount = await db.Orders.CountAsync();
        var pendingOrders = await db.Orders.CountAsync(o => o.Status == OrderStatus.Pending);
        var revenue = await db.Orders
            .Where(o => o.Status != OrderStatus.Cancelled)
            .SumAsync(o => (int?)o.TotalInr) ?? 0;
        var stockCost = await db.StockReceipts.SumAsync(r => (int?)r.TotalCostInr) ?? 0;

        return Ok(new AdminSummaryDto(productCount, orderCount, pendingOrders, revenue, stockCost, revenue - stockCost));
    }
}
