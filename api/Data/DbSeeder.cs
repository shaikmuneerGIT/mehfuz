using Microsoft.EntityFrameworkCore;
using Mehfuz.Api.Models;
using Mehfuz.Api.Services;

namespace Mehfuz.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(MehfuzDbContext db, IConfiguration config)
    {
        Console.WriteLine("Seeding Mehfuz catalog...");

        // ---- Admin user ----
        var adminEmail = config["AdminSeed:Email"] ?? "admin@mehfuzdryfruits.com";
        var adminPassword = config["AdminSeed:Password"];
        if (string.IsNullOrWhiteSpace(adminPassword))
        {
            Console.Error.WriteLine("FATAL: AdminSeed:Password is not configured.");
            Environment.Exit(1);
        }
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword, workFactor: 10);

        var admin = await db.AdminUsers.FirstOrDefaultAsync(a => a.Email == adminEmail);
        if (admin is null)
            db.AdminUsers.Add(new AdminUser { Email = adminEmail, Name = "Mehfuz Admin", PasswordHash = passwordHash });
        else
            admin.PasswordHash = passwordHash;
        await db.SaveChangesAsync();
        Console.WriteLine($"Admin user ready: {adminEmail}");

        // ---- Categories ----
        var figs = await UpsertCategory(db, "Figs (Anjeer)", "Handpicked jumbo anjeer, sun-dried to lock in natural sweetness.", "Afghanistan");
        var dates = await UpsertCategory(db, "Dates", "A full spread of premium Middle Eastern dates, from soft Safawi to royal Medjool.", "Middle East");
        var nuts = await UpsertCategory(db, "Nuts", "Snow-white Kashmiri walnuts, crunchy Californian pistachios, and classic almonds.", "Kashmir & California");
        var raisins = await UpsertCategory(db, "Raisins", "Naturally sun-dried raisins, seeded and seedless.", "India");
        var seeds = await UpsertCategory(db, "Seeds", "Roasted-ready pumpkin and watermelon seeds packed with protein.", "India");
        var driedFruit = await UpsertCategory(db, "Dried Fruits & Berries", "Tangy, chewy dried fruit and superfood berries for everyday snacking.", "Turkey, USA & India");
        var saffron = await UpsertCategory(db, "Saffron (Kesar)", "Hand-picked Kashmiri saffron threads, cultivated and crafted in the Kashmir valleys.", "Kashmir, India");
        var coffee = await UpsertCategory(db, "Coffee", "Estate-grown coffee, cultivated and roasted in the hills of Chikmagalur.", "Chikmagalur, Karnataka");
        var spices = await UpsertCategory(db, "Spices", "Sun-dried whole and ground spices sourced directly from Indian growing regions.", "Coorg & Guntur, India");
        await db.SaveChangesAsync();

        // Runs on every startup so the admin account and categories stay in
        // sync. Products are only created on a fresh database — otherwise
        // every restart would duplicate the catalog and bury price edits
        // made in the admin panel.
        var existingProducts = await db.Products.CountAsync();
        if (existingProducts > 0)
        {
            Console.WriteLine($"Catalog already has {existingProducts} products — leaving them as they are.");
            return;
        }

        // ---- Figs ----
        AddProduct(db, "Anjeer – Premium Jumbo", figs.Id,
            "Premium JUMBO anjeer, handpicked from Afghanistan. Naturally sweet, soft-centred figs, sun-dried the traditional way.",
            "Afghanistan", badge: "Bestseller", isFeatured: true,
            variants: [("250g", 299, 100), ("500g", 599, 100), ("1kg", 1199, 60)]);
        AddProduct(db, "Anjeer – Regular", figs.Id,
            "Everyday-grade anjeer with the same handpicked Afghan sourcing, in a lighter pack size.",
            "Afghanistan", variants: KgVariants(750));

        // ---- Dates ----
        AddProduct(db, "Safawi Dates", dates.Id, "Dark, soft-textured Safawi dates from Madinah — rich, caramel-like sweetness.", "Saudi Arabia", isFeatured: true, variants: KgVariants(670));
        AddProduct(db, "Khudri Dates", dates.Id, "Everyday premium dates with a firm bite and mild sweetness, straight from Madinah.", "Saudi Arabia", variants: KgVariants(330));
        AddProduct(db, "Tunisian Dates", dates.Id, "Golden Tunisian dates known for their delicate texture and honeyed flavour.", "Tunisia", variants: KgVariants(390));
        AddProduct(db, "Medjool Dates", dates.Id, "The 'king of dates' — large, caramel-soft Medjool dates prized worldwide.", "Jordan", badge: "Premium", isFeatured: true, variants: KgVariants(1290));
        AddProduct(db, "Mabroom Dates", dates.Id, "Long, chewy Mabroom dates with a rich, less-sweet, nutty finish.", "Saudi Arabia", variants: KgVariants(790));
        AddProduct(db, "Mashooq Dates", dates.Id, "Soft, glossy Mashooq dates with a smooth, sweet finish.", "Saudi Arabia", variants: KgVariants(450));

        // ---- Nuts ----
        AddProduct(db, "Almond Regular", nuts.Id, "Crunchy, protein-rich almonds — a daily wellness staple.", "USA / Kashmir", isFeatured: true, variants: KgVariants(1000));
        AddProduct(db, "Walnut Kashmiri", nuts.Id, "Premium snow-white walnut kernels, cultivated and crafted in the Kashmiri valleys.", "Kashmir, India", badge: "Snow White", isFeatured: true, variants: KgVariants(1250));
        AddProduct(db, "Walnut Cheli", nuts.Id, "Extra-large, light-coloured Cheli walnut kernels with a rich, buttery taste.", "Kashmir, India", badge: "Jumbo", variants: KgVariants(1590));
        AddProduct(db, "Pista California", nuts.Id, "Roasted, lightly salted Californian pistachios with a satisfying crack.", "California, USA", variants: KgVariants(1570));

        // ---- Raisins ----
        AddProduct(db, "Indian Round Raisins", raisins.Id, "Golden, plump seeded raisins — naturally sun-dried.", "India", variants: KgVariants(450));
        AddProduct(db, "Black Raisins Seedless", raisins.Id, "Antioxidant-rich seedless black raisins with a deep, tangy sweetness.", "India", variants: KgVariants(450));

        // ---- Seeds ----
        AddProduct(db, "Pumpkin Seeds", seeds.Id, "Raw pumpkin seeds, packed with magnesium and plant protein.", "India", variants: KgVariants(590));
        AddProduct(db, "Watermelon Seeds", seeds.Id, "Nutty, crunchy watermelon seeds — a light and healthy snack.", "India", variants: KgVariants(650));

        // ---- Dried Fruits & Berries ----
        AddProduct(db, "Apricot Turkey", driedFruit.Id, "Soft, tangy-sweet dried Turkish apricots, naturally sun-dried.", "Turkey", variants: KgVariants(1190));
        AddProduct(db, "Apricot Bold", driedFruit.Id, "Bold, chewy dried apricots with a deep amber colour and tart-sweet flavour.", "Turkey", variants: KgVariants(490));
        AddProduct(db, "Blueberry (Dried)", driedFruit.Id, "Sweet-tart dried blueberries, bursting with antioxidants.", "USA", badge: "Superfood", variants: KgVariants(1300));
        AddProduct(db, "Black Berry Plum", driedFruit.Id, "Tangy dried blackberry plum — a distinctive sweet-and-sour bite.", "India", variants: KgVariants(390));
        AddProduct(db, "Sweet Amla", driedFruit.Id, "Vitamin C-rich dried amla (Indian gooseberry) with a naturally sweet finish.", "India", variants: KgVariants(310));
        AddProduct(db, "Kiwi Green (Dried)", driedFruit.Id, "Vibrant dried green kiwi slices — tangy, chewy, and vitamin-packed.", "India", variants: KgVariants(420));

        // ---- Saffron ----
        AddProduct(db, "Kashmiri Saffron (Kesar)", saffron.Id,
            "Hand-picked saffron threads, cultivated and crafted in the Kashmiri valleys. Deep aroma and rich colour release.",
            "Kashmir, India", badge: "Premium", isFeatured: true, variants: SaffronVariants(280));

        // ---- Coffee ----
        AddProduct(db, "Chikmagalur Filter Coffee", coffee.Id,
            "Cultivated and roasted in the Chikmagalur region — a bold, aromatic South Indian filter coffee. Price to be confirmed.",
            "Chikmagalur, Karnataka", badge: "Price TBD", variants: KgVariants(600));

        // ---- Spices ----
        AddProduct(db, "Black Pepper (Coorg)", spices.Id,
            "Sun-dried whole black pepper cultivated in Coorg, Karnataka. Sharp, robust heat. Price to be confirmed.",
            "Coorg, Karnataka", badge: "Price TBD", variants: KgVariants(950));
        AddProduct(db, "Red Chilli Powder (Guntur Teja)", spices.Id,
            "Purely handpicked Guntur Teja variety red chillies, sun-dried and ground without any added colours or flavours. Price to be confirmed.",
            "Guntur, Andhra Pradesh", badge: "Price TBD", variants: KgVariants(380));

        await db.SaveChangesAsync();
        Console.WriteLine("Seed complete.");
    }

    private static async Task<Category> UpsertCategory(MehfuzDbContext db, string name, string description, string origin)
    {
        var slug = Slugify.ToSlug(name);
        var existing = await db.Categories.FirstOrDefaultAsync(c => c.Slug == slug);
        if (existing is not null)
        {
            existing.Description = description;
            existing.Origin = origin;
            return existing;
        }

        var category = new Category { Name = name, Slug = slug, Description = description, Origin = origin };
        db.Categories.Add(category);
        return category;
    }

    private static void AddProduct(
        MehfuzDbContext db, string name, string categoryId, string description, string origin,
        (string Label, int PriceInr, int Stock)[] variants,
        string? badge = null, bool isFeatured = false)
    {
        db.Products.Add(new Product
        {
            Name = name,
            Slug = Slugify.ToUniqueSlug(name),
            Description = description,
            Origin = origin,
            Badge = badge,
            IsFeatured = isFeatured,
            CategoryId = categoryId,
            Variants = variants.Select(v => new Variant { Label = v.Label, PriceInr = v.PriceInr, Stock = v.Stock }).ToList(),
        });
    }

    // Round to a clean rupee value the way a shop would price a smaller pack.
    private static int RoundClean(double n) => (int)(Math.Round(n / 5) * 5);

    // Most of the catalog was given as a single "per kilogram" price. Split
    // into the same 250g / 500g / 1kg tiers used on the Anjeer flyer, where
    // 250g ~= 28% and 500g ~= 52% of the 1kg price.
    private static (string, int, int)[] KgVariants(int kgPrice) =>
    [
        ("250g", RoundClean(kgPrice * 0.28), 100),
        ("500g", RoundClean(kgPrice * 0.52), 100),
        ("1kg", kgPrice, 60),
    ];

    // Saffron is priced per gram, not per kilogram.
    private static (string, int, int)[] SaffronVariants(int perGramPrice) =>
    [
        ("1 gram", perGramPrice, 100),
        ("2 gram", RoundClean(perGramPrice * 1.95), 100),
        ("5 gram", RoundClean(perGramPrice * 4.7), 60),
    ];
}
