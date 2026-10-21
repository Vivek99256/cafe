import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

async function hashPw(password: string) {
  return bcrypt.hash(password, 10);
}

function generateToken() {
  return crypto.randomBytes(16).toString("hex");
}

export async function runDatabaseSeed(prisma: PrismaClient) {
  console.log("🌱 Executing live database seed...");

  // Check if already seeded with super admin
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@cafesaas.com" },
  });

  if (existingAdmin) {
    const existingCafe = await prisma.cafe.findUnique({
      where: { slug: "aura-cafe" },
    });
    if (existingCafe) {
      return { success: true, message: "Database is already seeded and active." };
    }
  }

  // 1. Subscription Plans
  const starterPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "starter-barista" },
    update: {},
    create: {
      name: "Starter Barista",
      slug: "starter-barista",
      price: 1499,
      interval: "monthly",
      maxTables: 12,
      maxMenuItems: 60,
      maxStaff: 3,
      features: JSON.stringify([
        "Up to 12 QR code tables",
        "Digital contactless mobile menu",
        "Kitchen live order board",
        "Real-time order status tracking",
        "Basic sales analytics",
        "Receipt printing & KOT",
      ]),
      isPopular: false,
    },
  });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "pro-roastery" },
    update: {},
    create: {
      name: "Pro Roastery & Bistro",
      slug: "pro-roastery",
      price: 2999,
      interval: "monthly",
      maxTables: 40,
      maxMenuItems: 300,
      maxStaff: 10,
      features: JSON.stringify([
        "Up to 40 QR code tables",
        "Branded digital menu & custom theme",
        "Real-time audio alerts & order manager",
        "Product variants & unlimited add-ons",
        "Advanced revenue & item analytics",
        "Automated tent-card PDF generation",
        "Multi-staff role permissions",
        "CSV data export",
      ]),
      isPopular: true,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { slug: "enterprise-multi-outlet" },
    update: {},
    create: {
      name: "Enterprise Multi-Outlet",
      slug: "enterprise-multi-outlet",
      price: 6999,
      interval: "monthly",
      maxTables: 150,
      maxMenuItems: 1000,
      maxStaff: 30,
      features: JSON.stringify([
        "Unlimited tables & outlets",
        "Custom domain support",
        "Dedicated account manager",
        "Inventory tracking & allergen warnings",
        "Direct POS hardware integration",
        "Priority 24/7 SLA support",
      ]),
      isPopular: false,
    },
  });

  // 2. Super Admin User
  const adminPasswordHash = await hashPw("Admin@1234");
  await prisma.user.upsert({
    where: { email: "admin@cafesaas.com" },
    update: { passwordHash: adminPasswordHash },
    create: {
      name: "Platform Administrator",
      email: "admin@cafesaas.com",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      phone: "+91 9876543210",
    },
  });

  // 3. Aura Cafe Users
  const auraOwnerPw = await hashPw("Owner@1234");
  const auraManagerPw = await hashPw("Manager@1234");
  const auraKitchenPw = await hashPw("Kitchen@1234");

  const auraOwner = await prisma.user.upsert({
    where: { email: "owner@auracafe.com" },
    update: { passwordHash: auraOwnerPw },
    create: {
      name: "Vikramaditya Singhania",
      email: "owner@auracafe.com",
      passwordHash: auraOwnerPw,
      role: "CAFE_OWNER",
      phone: "+91 9820011223",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    },
  });

  const auraManager = await prisma.user.upsert({
    where: { email: "manager@auracafe.com" },
    update: { passwordHash: auraManagerPw },
    create: {
      name: "Ananya Deshmukh",
      email: "manager@auracafe.com",
      passwordHash: auraManagerPw,
      role: "CAFE_MANAGER",
      phone: "+91 9820044556",
    },
  });

  const auraKitchen = await prisma.user.upsert({
    where: { email: "kitchen@auracafe.com" },
    update: { passwordHash: auraKitchenPw },
    create: {
      name: "Chef Marcus Vance",
      email: "kitchen@auracafe.com",
      passwordHash: auraKitchenPw,
      role: "KITCHEN_STAFF",
      phone: "+91 9820077889",
    },
  });

  // 4. Aura Cafe
  const auraCafe = await prisma.cafe.upsert({
    where: { slug: "aura-cafe" },
    update: {},
    create: {
      name: "Aura Specialty Roastery & Cafe",
      slug: "aura-cafe",
      tagline: "Single-Origin Pour-Overs, Artisanal Sourdough & Elevated Brunch",
      description:
        "Welcome to Aura. We roast ethically sourced high-altitude beans on-site and bake sourdough pastries fresh each dawn. Scan your table QR to craft your bespoke order.",
      logoUrl: "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=250&q=80",
      coverUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=80",
      phone: "+91 22 4920 8800",
      email: "hello@auracafe.com",
      address: "Plot 42, Heritage Quarter, Lavelle Boulevard",
      city: "Bengaluru",
      currency: "INR",
      currencySymbol: "₹",
      taxRate: 5.0,
      isAcceptingOrders: true,
      openingHours: "07:30 AM – 11:30 PM",
      tableOrderingEnabled: true,
      estimatedPrepTime: 12,
    },
  });

  // Memberships
  await prisma.cafeMembership.upsert({
    where: { userId_cafeId: { userId: auraOwner.id, cafeId: auraCafe.id } },
    update: {},
    create: { userId: auraOwner.id, cafeId: auraCafe.id, role: "CAFE_OWNER" },
  });
  await prisma.cafeMembership.upsert({
    where: { userId_cafeId: { userId: auraManager.id, cafeId: auraCafe.id } },
    update: {},
    create: { userId: auraManager.id, cafeId: auraCafe.id, role: "CAFE_MANAGER" },
  });
  await prisma.cafeMembership.upsert({
    where: { userId_cafeId: { userId: auraKitchen.id, cafeId: auraCafe.id } },
    update: {},
    create: { userId: auraKitchen.id, cafeId: auraCafe.id, role: "KITCHEN_STAFF" },
  });

  // Subscription
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await prisma.subscription.upsert({
    where: { cafeId: auraCafe.id },
    update: {},
    create: {
      cafeId: auraCafe.id,
      planId: proPlan.id,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
      isDevMode: true,
    },
  });

  // Tables
  const tablesData = [
    { tableNumber: "T01", label: "Garden Conservatory Window", capacity: 2 },
    { tableNumber: "T02", label: "Heritage Courtyard Patio", capacity: 4 },
    { tableNumber: "T03", label: "Main Espresso Bar Counter", capacity: 2 },
    { tableNumber: "T04", label: "Mezzanine Library Nook", capacity: 4 },
    { tableNumber: "T05", label: "Sunlit Skylight Terrace", capacity: 6 },
    { tableNumber: "T06", label: "Private Roastery Booth", capacity: 6 },
    { tableNumber: "T07", label: "Center Olive Tree Banquette", capacity: 4 },
    { tableNumber: "T08", label: "Acoustic Corner Alcove", capacity: 2 },
  ];

  const createdTables = [];
  for (const t of tablesData) {
    const table = await prisma.table.upsert({
      where: { cafeId_tableNumber: { cafeId: auraCafe.id, tableNumber: t.tableNumber } },
      update: {},
      create: {
        cafeId: auraCafe.id,
        tableNumber: t.tableNumber,
        label: t.label,
        capacity: t.capacity,
        isActive: true,
        qrToken: generateToken(),
      },
    });
    createdTables.push(table);
  }

  // Categories & Items
  const catCoffee = await prisma.menuCategory.upsert({
    where: { cafeId_slug: { cafeId: auraCafe.id, slug: "coffee" } },
    update: {},
    create: {
      cafeId: auraCafe.id,
      name: "Specialty Coffee & Espresso",
      slug: "coffee",
      description: "Direct-trade beans pulled on our custom Synesso MVP Hydra.",
      sortOrder: 1,
    },
  });

  const catColdDrinks = await prisma.menuCategory.upsert({
    where: { cafeId_slug: { cafeId: auraCafe.id, slug: "cold-beverages" } },
    update: {},
    create: {
      cafeId: auraCafe.id,
      name: "Cold Brews & Signature Elixirs",
      slug: "cold-beverages",
      description: "Slow-steeped 18-hour cold brew infusions & sparkling botanicals.",
      sortOrder: 2,
    },
  });

  const catBakery = await prisma.menuCategory.upsert({
    where: { cafeId_slug: { cafeId: auraCafe.id, slug: "bakery" } },
    update: {},
    create: {
      cafeId: auraCafe.id,
      name: "Artisan Viennoiserie & Bakery",
      slug: "bakery",
      description: "Rolled with Normandy butter, fermented 48 hours and baked fresh daily.",
      sortOrder: 3,
    },
  });

  const catBrunch = await prisma.menuCategory.upsert({
    where: { cafeId_slug: { cafeId: auraCafe.id, slug: "brunch" } },
    update: {},
    create: {
      cafeId: auraCafe.id,
      name: "All-Day Gourmet Brunch",
      slug: "brunch",
      description: "Organic free-range eggs, house cured toppings & artisan sourdough.",
      sortOrder: 4,
    },
  });

  // Sample items
  const existingItem = await prisma.menuItem.findFirst({ where: { cafeId: auraCafe.id } });
  if (!existingItem) {
    await prisma.menuItem.create({
      data: {
        cafeId: auraCafe.id,
        categoryId: catCoffee.id,
        name: "Spanish Cortado Velvet",
        slug: "spanish-cortado-velvet",
        description: "Double ristretto of Ethiopian Yirgacheffe cut with equal ratio textured silky whole milk.",
        price: 240,
        imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
        isAvailable: true,
        isFeatured: true,
        isSpecial: true,
        isVeg: true,
        preparationTime: 5,
        variants: {
          create: [
            { name: "Single Cortado (4oz)", price: 220, isDefault: false },
            { name: "Double Cortado (6oz)", price: 240, isDefault: true },
          ],
        },
        addOns: {
          create: [
            { name: "Organic Oat Milk", price: 50 },
            { name: "Madagascar Vanilla Bean", price: 40 },
          ],
        },
      },
    });

    await prisma.menuItem.create({
      data: {
        cafeId: auraCafe.id,
        categoryId: catBakery.id,
        name: "Golden Almond Frangipane Croissant",
        slug: "almond-frangipane-croissant",
        description: "Double-baked flaky French croissant filled with rich almond cream.",
        price: 240,
        imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
        isAvailable: true,
        isFeatured: true,
        isVeg: true,
        preparationTime: 3,
      },
    });

    await prisma.menuItem.create({
      data: {
        cafeId: auraCafe.id,
        categoryId: catBrunch.id,
        name: "Truffled Avocado & Poached Egg Toast",
        slug: "truffled-avocado-poached-egg-toast",
        description: "Thick slice of toasted naturally fermented country loaf, smashed Hass avocado, Danish feta, and organic poached eggs.",
        price: 440,
        imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
        isAvailable: true,
        isFeatured: true,
        isSpecial: true,
        isVeg: false,
        preparationTime: 12,
      },
    });
  }

  // 5. Bella Cucina Bistro
  const bellaOwnerPw = await hashPw("Bella@1234");
  const bellaOwner = await prisma.user.upsert({
    where: { email: "owner@bellacucina.com" },
    update: { passwordHash: bellaOwnerPw },
    create: {
      name: "Matteo Rossi",
      email: "owner@bellacucina.com",
      passwordHash: bellaOwnerPw,
      role: "CAFE_OWNER",
      phone: "+91 9777112233",
    },
  });

  const bellaCafe = await prisma.cafe.upsert({
    where: { slug: "bella-cucina" },
    update: {},
    create: {
      name: "Bella Cucina Bistro & Espresso Bar",
      slug: "bella-cucina",
      tagline: "Authentic Italian Espresso, Paninis & Gelato",
      description: "Traditional Italian roasts, wood-fired focaccia, and house-made dolci.",
      logoUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=250&q=80",
      coverUrl: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1600&q=80",
      city: "Mumbai",
      currency: "INR",
      currencySymbol: "₹",
      taxRate: 5.0,
      isAcceptingOrders: true,
      openingHours: "08:00 AM – 11:00 PM",
    },
  });

  await prisma.cafeMembership.upsert({
    where: { userId_cafeId: { userId: bellaOwner.id, cafeId: bellaCafe.id } },
    update: {},
    create: { userId: bellaOwner.id, cafeId: bellaCafe.id, role: "CAFE_OWNER" },
  });

  await prisma.subscription.upsert({
    where: { cafeId: bellaCafe.id },
    update: {},
    create: {
      cafeId: bellaCafe.id,
      planId: starterPlan.id,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
      isDevMode: true,
    },
  });

  await prisma.table.upsert({
    where: { cafeId_tableNumber: { cafeId: bellaCafe.id, tableNumber: "B01" } },
    update: {},
    create: {
      cafeId: bellaCafe.id,
      tableNumber: "B01",
      label: "Al Fresco Terrace",
      capacity: 4,
      qrToken: generateToken(),
    },
  });

  console.log("✅ Seed completed successfully!");
  return { success: true, message: "Database initialized with complete demo data" };
}
