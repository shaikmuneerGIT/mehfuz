using Microsoft.EntityFrameworkCore;
using Mehfuz.Api.Models;

namespace Mehfuz.Api.Data;

public class MehfuzDbContext(DbContextOptions<MehfuzDbContext> options) : DbContext(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Variant> Variants => Set<Variant>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Category>(e =>
        {
            e.HasIndex(x => x.Name).IsUnique();
            e.HasIndex(x => x.Slug).IsUnique();
        });

        b.Entity<Product>(e =>
        {
            e.HasIndex(x => x.Slug).IsUnique();
            e.HasOne(x => x.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Variant>(e =>
        {
            e.HasOne(x => x.Product)
                .WithMany(p => p.Variants)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Order>(e =>
        {
            e.HasIndex(x => x.OrderNumber).IsUnique();
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        });

        b.Entity<OrderItem>(e =>
        {
            e.HasOne(x => x.Order)
                .WithMany(o => o.Items)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            // Products/variants referenced by past orders must never cascade-delete —
            // order history has to survive the product being removed later.
            e.HasOne(x => x.Product)
                .WithMany(p => p.OrderItems)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Variant)
                .WithMany(v => v.OrderItems)
                .HasForeignKey(x => x.VariantId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<AdminUser>(e =>
        {
            e.HasIndex(x => x.Email).IsUnique();
        });

        // Money columns are plain integers (paise-free INR, matches the Node app) —
        // no decimal/rounding concerns since prices are always whole rupees.
    }
}
