using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mehfuz.Api.Data;
using Mehfuz.Api.DTOs;
using Mehfuz.Api.Models;

namespace Mehfuz.Api.Controllers;

[ApiController]
[Route("api/admin/stock-receipts")]
[Authorize]
public class StockController(MehfuzDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<StockReceiptDto>> Create(CreateStockReceiptRequest request)
    {
        var product = await db.Products.FindAsync(request.ProductId);
        if (product is null) return NotFound(new { error = "Product not found" });

        var variantIds = request.Items.Select(i => i.VariantId).ToList();
        var variants = await db.Variants
            .Where(v => variantIds.Contains(v.Id))
            .ToListAsync();

        // Every pack size in this delivery must actually belong to the
        // product it's being received against — otherwise stock would
        // silently land on the wrong product's variant.
        if (variants.Count != variantIds.Distinct().Count() || variants.Any(v => v.ProductId != request.ProductId))
            return BadRequest(new { error = "One or more pack sizes don't belong to this product" });

        var receipt = new StockReceipt
        {
            ProductId = request.ProductId,
            SupplierName = string.IsNullOrWhiteSpace(request.SupplierName) ? null : request.SupplierName,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes,
            TotalCostInr = request.TotalCostInr,
            ReceivedAt = request.ReceivedAt ?? DateTime.UtcNow,
            Items = request.Items.Select(i =>
            {
                var variant = variants.First(v => v.Id == i.VariantId);
                return new StockReceiptItem
                {
                    VariantId = variant.Id,
                    LabelSnapshot = variant.Label,
                    Quantity = i.Quantity,
                };
            }).ToList(),
        };

        foreach (var item in request.Items)
        {
            var variant = variants.First(v => v.Id == item.VariantId);
            variant.Stock += item.Quantity;
        }

        db.StockReceipts.Add(receipt);
        await db.SaveChangesAsync();

        return StatusCode(201, ToDto(receipt, product.Name));
    }

    [HttpGet]
    public async Task<ActionResult<List<StockReceiptDto>>> GetAll()
    {
        var receipts = await db.StockReceipts
            .Include(r => r.Product)
            .Include(r => r.Items)
            .OrderByDescending(r => r.ReceivedAt)
            .ToListAsync();

        return Ok(receipts.Select(r => ToDto(r, r.Product!.Name)));
    }

    private static StockReceiptDto ToDto(StockReceipt r, string productName) => new(
        r.Id, r.ProductId, productName, r.SupplierName, r.Notes, r.TotalCostInr, r.ReceivedAt,
        r.Items.Select(i => new StockReceiptItemDto(i.Id, i.VariantId, i.LabelSnapshot, i.Quantity)).ToList()
    );
}
