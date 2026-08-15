using System.ComponentModel.DataAnnotations;
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
[Route("api/orders")]
public class OrdersController(MehfuzDbContext db) : ControllerBase
{
    private const int ShippingThresholdInr = 999;
    private const int ShippingFeeInr = 79;

    [HttpPost]
    public async Task<ActionResult<OrderDto>> Checkout(CheckoutRequest request)
    {
        if (!string.IsNullOrEmpty(request.Email) && !new EmailAddressAttribute().IsValid(request.Email))
            return BadRequest(new { error = "Invalid email address" });

        var variantIds = request.Items.Select(i => i.VariantId).ToList();
        var variants = await db.Variants
            .Include(v => v.Product)
            .Where(v => variantIds.Contains(v.Id) && v.IsActive)
            .ToListAsync();

        if (variants.Count != variantIds.Distinct().Count())
            return BadRequest(new { error = "One or more selected items are no longer available" });

        foreach (var item in request.Items)
        {
            var variant = variants.First(v => v.Id == item.VariantId);
            if (variant.Stock < item.Quantity)
                return BadRequest(new { error = $"Insufficient stock for {variant.Product!.Name}" });
        }

        var subtotal = 0;
        var itemsToCreate = new List<OrderItem>();
        foreach (var item in request.Items)
        {
            var variant = variants.First(v => v.Id == item.VariantId);
            subtotal += variant.PriceInr * item.Quantity;
            itemsToCreate.Add(new OrderItem
            {
                ProductId = variant.ProductId,
                VariantId = variant.Id,
                NameSnapshot = variant.Product!.Name,
                LabelSnapshot = variant.Label,
                PriceInr = variant.PriceInr,
                Quantity = item.Quantity,
            });
        }

        var shipping = subtotal >= ShippingThresholdInr ? 0 : ShippingFeeInr;
        var order = new Order
        {
            OrderNumber = OrderNumberGenerator.Generate(),
            CustomerName = request.CustomerName,
            Phone = request.Phone,
            Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email,
            AddressLine1 = request.AddressLine1,
            AddressLine2 = request.AddressLine2,
            City = request.City,
            State = request.State,
            Pincode = request.Pincode,
            Notes = request.Notes,
            SubtotalInr = subtotal,
            ShippingInr = shipping,
            TotalInr = subtotal + shipping,
            Items = itemsToCreate,
        };

        await using var tx = await db.Database.BeginTransactionAsync();

        db.Orders.Add(order);
        await db.SaveChangesAsync();

        foreach (var item in request.Items)
        {
            // Conditional UPDATE guarded on remaining stock, executed directly against
            // the database (not read-then-write), so two checkouts racing for the last
            // unit can't both succeed. A miss means someone else took it first — the
            // whole order rolls back via the transaction dispose below.
            var affected = await db.Variants
                .Where(v => v.Id == item.VariantId && v.Stock >= item.Quantity)
                .ExecuteUpdateAsync(s => s.SetProperty(v => v.Stock, v => v.Stock - item.Quantity));

            if (affected == 0)
            {
                var variant = variants.First(v => v.Id == item.VariantId);
                throw new HttpException(409,
                    $"Sorry, {variant.Product!.Name} just sold out. Please adjust your cart and try again.");
            }
        }

        await tx.CommitAsync();

        return StatusCode(201, ToDto(order));
    }

    [HttpGet("{orderNumber}")]
    public async Task<ActionResult<OrderDto>> GetByNumber(string orderNumber)
    {
        var order = await db.Orders.Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);

        return order is null ? NotFound(new { error = "Order not found" }) : Ok(ToDto(order));
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<OrderDto>>> GetAll()
    {
        var orders = await db.Orders.Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(ToDto));
    }

    [HttpPatch("{id}/status")]
    [Authorize]
    public async Task<ActionResult<OrderDto>> UpdateStatus(string id, UpdateOrderStatusRequest request)
    {
        if (!Enum.TryParse<OrderStatus>(request.Status, ignoreCase: true, out var status))
            return BadRequest(new { error = "Invalid status" });

        var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
        if (order is null) return NotFound(new { error = "Order not found" });

        order.Status = status;
        order.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(ToDto(order));
    }

    private static OrderDto ToDto(Order o) => new(
        o.Id, o.OrderNumber, o.CustomerName, o.Phone, o.Email,
        o.AddressLine1, o.AddressLine2, o.City, o.State, o.Pincode, o.Notes,
        o.Status.ToString().ToUpperInvariant(), o.PaymentMethod,
        o.SubtotalInr, o.ShippingInr, o.TotalInr, o.CreatedAt,
        o.Items.Select(i => new OrderItemDto(i.Id, i.ProductId, i.VariantId, i.NameSnapshot, i.LabelSnapshot, i.PriceInr, i.Quantity)).ToList()
    );
}
