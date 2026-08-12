import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Round to a clean rupee value the way a shop would price a smaller pack.
function roundClean(n: number): number {
  return Math.round(n / 5) * 5;
}

// Most of the catalog was given as a single "per kilogram" price. We split
// that into the same 250g / 500g / 1kg tiers used on the Anjeer flyer,
// where 250g ~= 25% and 500g ~= 50% of the 1kg price.
function kgVariants(kgPrice: number) {
  return [
    { label: "250g", priceInr: roundClean(kgPrice * 0.28), stock: 100 },
    { label: "500g", priceInr: roundClean(kgPrice * 0.52), stock: 100 },
    { label: "1kg", priceInr: kgPrice, stock: 60 },
  ];
}

// Saffron is priced per gram, not per kilogram.
function saffronVariants(perGramPrice: number) {
  return [
    { label: "1 gram", priceInr: perGramPrice, stock: 100 },
    { label: "2 gram", priceInr: roundClean(perGramPrice * 1.95), stock: 100 },
    { label: "5 gram", priceInr: roundClean(perGramPrice * 4.7), stock: 60 },
  ];
}

async function upsertCategory(
  name: string,
  description: string,
  origin: string
) {
  return prisma.category.upsert({
    where: { slug: slugify(name) },
    update: { description, origin },
    create: { name, slug: slugify(name), description, origin },
  });
}

async function createProduct(opts: {
  name: string;
  categoryId: string;
  description: string;
  origin: string;
  badge?: string;
  isFeatured?: boolean;
  variants: { label: string; priceInr: number; stock: number }[];
}) {
  const slug = slugify(opts.name) + "-" + Math.random().toString(36).slice(2, 7);
  return prisma.product.create({
    data: {
      name: opts.name,
      slug,
      description: opts.description,
      origin: opts.origin,
      badge: opts.badge,
      isFeatured: opts.isFeatured ?? false,
      categoryId: opts.categoryId,
      variants: { create: opts.variants },
    },
  });
}

async function main() {
  console.log("Seeding Mehfuz catalog...");

  // ---- Admin user ----
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@mehfuzdryfruits.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Mehfuz@Admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, name: "Mehfuz Admin", passwordHash },
  });
  console.log(`Admin user ready: ${adminEmail}`);

  // ---- Categories ----
  const figs = await upsertCategory(
    "Figs (Anjeer)",
    "Handpicked jumbo anjeer, sun-dried to lock in natural sweetness.",
    "Afghanistan"
  );
  const dates = await upsertCategory(
    "Dates",
    "A full spread of premium Middle Eastern dates, from soft Safawi to royal Medjool.",
    "Middle East"
  );
  const nuts = await upsertCategory(
    "Nuts",
    "Snow-white Kashmiri walnuts, crunchy Californian pistachios, and classic almonds.",
    "Kashmir & California"
  );
  const raisins = await upsertCategory(
    "Raisins",
    "Naturally sun-dried raisins, seeded and seedless.",
    "India"
  );
  const seeds = await upsertCategory(
    "Seeds",
    "Roasted-ready pumpkin and watermelon seeds packed with protein.",
    "India"
  );
  const driedFruit = await upsertCategory(
    "Dried Fruits & Berries",
    "Tangy, chewy dried fruit and superfood berries for everyday snacking.",
    "Turkey, USA & India"
  );
  const saffron = await upsertCategory(
    "Saffron (Kesar)",
    "Hand-picked Kashmiri saffron threads, cultivated and crafted in the Kashmir valleys.",
    "Kashmir, India"
  );
  const coffee = await upsertCategory(
    "Coffee",
    "Estate-grown coffee, cultivated and roasted in the hills of Chikmagalur.",
    "Chikmagalur, Karnataka"
  );
  const spices = await upsertCategory(
    "Spices",
    "Sun-dried whole and ground spices sourced directly from Indian growing regions.",
    "Coorg & Guntur, India"
  );

  // ---- Figs ----
  await createProduct({
    name: "Anjeer – Premium Jumbo",
    categoryId: figs.id,
    description:
      "Premium JUMBO anjeer, handpicked from Afghanistan. Naturally sweet, soft-centred figs, sun-dried the traditional way.",
    origin: "Afghanistan",
    badge: "Bestseller",
    isFeatured: true,
    variants: [
      { label: "250g", priceInr: 299, stock: 100 },
      { label: "500g", priceInr: 599, stock: 100 },
      { label: "1kg", priceInr: 1199, stock: 60 },
    ],
  });
  await createProduct({
    name: "Anjeer – Regular",
    categoryId: figs.id,
    description: "Everyday-grade anjeer with the same handpicked Afghan sourcing, in a lighter pack size.",
    origin: "Afghanistan",
    variants: kgVariants(750),
  });

  // ---- Dates ----
  await createProduct({
    name: "Safawi Dates",
    categoryId: dates.id,
    description: "Dark, soft-textured Safawi dates from Madinah — rich, caramel-like sweetness.",
    origin: "Saudi Arabia",
    isFeatured: true,
    variants: kgVariants(670),
  });
  await createProduct({
    name: "Khudri Dates",
    categoryId: dates.id,
    description: "Everyday premium dates with a firm bite and mild sweetness, straight from Madinah.",
    origin: "Saudi Arabia",
    variants: kgVariants(330),
  });
  await createProduct({
    name: "Tunisian Dates",
    categoryId: dates.id,
    description: "Golden Tunisian dates known for their delicate texture and honeyed flavour.",
    origin: "Tunisia",
    variants: kgVariants(390),
  });
  await createProduct({
    name: "Medjool Dates",
    categoryId: dates.id,
    description: "The 'king of dates' — large, caramel-soft Medjool dates prized worldwide.",
    origin: "Jordan",
    badge: "Premium",
    isFeatured: true,
    variants: kgVariants(1290),
  });
  await createProduct({
    name: "Mabroom Dates",
    categoryId: dates.id,
    description: "Long, chewy Mabroom dates with a rich, less-sweet, nutty finish.",
    origin: "Saudi Arabia",
    variants: kgVariants(790),
  });
  await createProduct({
    name: "Mashooq Dates",
    categoryId: dates.id,
    description: "Soft, glossy Mashooq dates with a smooth, sweet finish.",
    origin: "Saudi Arabia",
    variants: kgVariants(450),
  });

  // ---- Nuts ----
  await createProduct({
    name: "Almond Regular",
    categoryId: nuts.id,
    description: "Crunchy, protein-rich almonds — a daily wellness staple.",
    origin: "USA / Kashmir",
    isFeatured: true,
    variants: kgVariants(1000),
  });
  await createProduct({
    name: "Walnut Kashmiri",
    categoryId: nuts.id,
    description: "Premium snow-white walnut kernels, cultivated and crafted in the Kashmiri valleys.",
    origin: "Kashmir, India",
    badge: "Snow White",
    isFeatured: true,
    variants: kgVariants(1250),
  });
  await createProduct({
    name: "Walnut Cheli",
    categoryId: nuts.id,
    description: "Extra-large, light-coloured Cheli walnut kernels with a rich, buttery taste.",
    origin: "Kashmir, India",
    badge: "Jumbo",
    variants: kgVariants(1590),
  });
  await createProduct({
    name: "Pista California",
    categoryId: nuts.id,
    description: "Roasted, lightly salted Californian pistachios with a satisfying crack.",
    origin: "California, USA",
    variants: kgVariants(1570),
  });

  // ---- Raisins ----
  await createProduct({
    name: "Indian Round Raisins",
    categoryId: raisins.id,
    description: "Golden, plump seeded raisins — naturally sun-dried.",
    origin: "India",
    variants: kgVariants(450),
  });
  await createProduct({
    name: "Black Raisins Seedless",
    categoryId: raisins.id,
    description: "Antioxidant-rich seedless black raisins with a deep, tangy sweetness.",
    origin: "India",
    variants: kgVariants(450),
  });

  // ---- Seeds ----
  await createProduct({
    name: "Pumpkin Seeds",
    categoryId: seeds.id,
    description: "Raw pumpkin seeds, packed with magnesium and plant protein.",
    origin: "India",
    variants: kgVariants(590),
  });
  await createProduct({
    name: "Watermelon Seeds",
    categoryId: seeds.id,
    description: "Nutty, crunchy watermelon seeds — a light and healthy snack.",
    origin: "India",
    variants: kgVariants(650),
  });

  // ---- Dried Fruits & Berries ----
  await createProduct({
    name: "Apricot Turkey",
    categoryId: driedFruit.id,
    description: "Soft, tangy-sweet dried Turkish apricots, naturally sun-dried.",
    origin: "Turkey",
    variants: kgVariants(1190),
  });
  await createProduct({
    name: "Apricot Bold",
    categoryId: driedFruit.id,
    description: "Bold, chewy dried apricots with a deep amber colour and tart-sweet flavour.",
    origin: "Turkey",
    variants: kgVariants(490),
  });
  await createProduct({
    name: "Blueberry (Dried)",
    categoryId: driedFruit.id,
    description: "Sweet-tart dried blueberries, bursting with antioxidants.",
    origin: "USA",
    badge: "Superfood",
    variants: kgVariants(1300),
  });
  await createProduct({
    name: "Black Berry Plum",
    categoryId: driedFruit.id,
    description: "Tangy dried blackberry plum — a distinctive sweet-and-sour bite.",
    origin: "India",
    variants: kgVariants(390),
  });
  await createProduct({
    name: "Sweet Amla",
    categoryId: driedFruit.id,
    description: "Vitamin C-rich dried amla (Indian gooseberry) with a naturally sweet finish.",
    origin: "India",
    variants: kgVariants(310),
  });
  await createProduct({
    name: "Kiwi Green (Dried)",
    categoryId: driedFruit.id,
    description: "Vibrant dried green kiwi slices — tangy, chewy, and vitamin-packed.",
    origin: "India",
    variants: kgVariants(420),
  });

  // ---- Saffron ----
  await createProduct({
    name: "Kashmiri Saffron (Kesar)",
    categoryId: saffron.id,
    description:
      "Hand-picked saffron threads, cultivated and crafted in the Kashmiri valleys. Deep aroma and rich colour release.",
    origin: "Kashmir, India",
    badge: "Premium",
    isFeatured: true,
    variants: saffronVariants(280),
  });

  // ---- Coffee ----
  await createProduct({
    name: "Chikmagalur Filter Coffee",
    categoryId: coffee.id,
    description:
      "Cultivated and roasted in the Chikmagalur region — a bold, aromatic South Indian filter coffee. Price to be confirmed.",
    origin: "Chikmagalur, Karnataka",
    badge: "Price TBD",
    variants: kgVariants(600),
  });

  // ---- Spices ----
  await createProduct({
    name: "Black Pepper (Coorg)",
    categoryId: spices.id,
    description:
      "Sun-dried whole black pepper cultivated in Coorg, Karnataka. Sharp, robust heat. Price to be confirmed.",
    origin: "Coorg, Karnataka",
    badge: "Price TBD",
    variants: kgVariants(950),
  });
  await createProduct({
    name: "Red Chilli Powder (Guntur Teja)",
    categoryId: spices.id,
    description:
      "Purely handpicked Guntur Teja variety red chillies, sun-dried and ground without any added colours or flavours. Price to be confirmed.",
    origin: "Guntur, Andhra Pradesh",
    badge: "Price TBD",
    variants: kgVariants(380),
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
