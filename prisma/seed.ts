import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function hashPw(password: string) {
  return bcrypt.hash(password, 10);
}

function generateToken() {
  return crypto.randomBytes(16).toString("hex");
}

async function main() {
  console.log("🌱 Starting Cafe SaaS database seed...");

  // 1. Clean existing records
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItemAddOn.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.addOn.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.table.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.cafeMembership.deleteMany();
  await prisma.cafe.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned old records.");

  // 2. Subscription Plans
  const starterPlan = await prisma.subscriptionPlan.create({
    data: {
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

  const proPlan = await prisma.subscriptionPlan.create({
    data: {
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

  const enterprisePlan = await prisma.subscriptionPlan.create({
    data: {
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

  console.log("✅ Subscription plans seeded.");

  // 3. Super Admin User
  const adminPasswordHash = await hashPw("Admin@1234");
  const superAdmin = await prisma.user.create({
    data: {
      name: "Platform Administrator",
      email: "admin@cafesaas.com",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      phone: "+91 9876543210",
    },
  });

  // 4. Cafe Owner & Staff for "Aura Specialty Roastery"
  const auraOwnerPw = await hashPw("Owner@1234");
  const auraManagerPw = await hashPw("Manager@1234");
  const auraKitchenPw = await hashPw("Kitchen@1234");

  const auraOwner = await prisma.user.create({
    data: {
      name: "Vikramaditya Singhania",
      email: "owner@auracafe.com",
      passwordHash: auraOwnerPw,
      role: "CAFE_OWNER",
      phone: "+91 9820011223",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    },
  });

  const auraManager = await prisma.user.create({
    data: {
      name: "Ananya Deshmukh",
      email: "manager@auracafe.com",
      passwordHash: auraManagerPw,
      role: "CAFE_MANAGER",
      phone: "+91 9820044556",
    },
  });

  const auraKitchen = await prisma.user.create({
    data: {
      name: "Chef Marcus Vance",
      email: "kitchen@auracafe.com",
      passwordHash: auraKitchenPw,
      role: "KITCHEN_STAFF",
      phone: "+91 9820077889",
    },
  });

  // 5. Create Aura Cafe
  const auraCafe = await prisma.cafe.create({
    data: {
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
      taxRate: 5.0, // 5% GST
      isAcceptingOrders: true,
      openingHours: "07:30 AM – 11:30 PM",
      tableOrderingEnabled: true,
      estimatedPrepTime: 12,
    },
  });

  // Memberships
  await prisma.cafeMembership.createMany({
    data: [
      { userId: auraOwner.id, cafeId: auraCafe.id, role: "CAFE_OWNER" },
      { userId: auraManager.id, cafeId: auraCafe.id, role: "CAFE_MANAGER" },
      { userId: auraKitchen.id, cafeId: auraCafe.id, role: "KITCHEN_STAFF" },
    ],
  });

  // Subscription for Aura Cafe
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await prisma.subscription.create({
    data: {
      cafeId: auraCafe.id,
      planId: proPlan.id,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
      isDevMode: true,
    },
  });

  // 6. Tables for Aura Cafe
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
    const table = await prisma.table.create({
      data: {
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
  console.log(`✅ Created ${createdTables.length} tables for Aura Cafe.`);

  // 7. Menu Categories
  const catCoffee = await prisma.menuCategory.create({
    data: {
      cafeId: auraCafe.id,
      name: "Specialty Coffee & Espresso",
      slug: "coffee",
      description: "Direct-trade beans pulled on our custom Synesso MVP Hydra.",
      sortOrder: 1,
    },
  });

  const catColdDrinks = await prisma.menuCategory.create({
    data: {
      cafeId: auraCafe.id,
      name: "Cold Brews & Signature Elixirs",
      slug: "cold-beverages",
      description: "Slow-steeped 18-hour cold brew infusions & sparkling botanicals.",
      sortOrder: 2,
    },
  });

  const catBakery = await prisma.menuCategory.create({
    data: {
      cafeId: auraCafe.id,
      name: "Artisan Viennoiserie & Bakery",
      slug: "bakery",
      description: "Rolled with Normandy butter, fermented 48 hours and baked fresh daily.",
      sortOrder: 3,
    },
  });

  const catBrunch = await prisma.menuCategory.create({
    data: {
      cafeId: auraCafe.id,
      name: "All-Day Gourmet Brunch",
      slug: "brunch",
      description: "Organic free-range eggs, house cured toppings & artisan sourdough.",
      sortOrder: 4,
    },
  });

  const catMains = await prisma.menuCategory.create({
    data: {
      cafeId: auraCafe.id,
      name: "Woodfired Mains & Bowls",
      slug: "mains",
      description: "Hearty sourdough flatbreads, gourmet grain bowls & craft burgers.",
      sortOrder: 5,
    },
  });

  const catDesserts = await prisma.menuCategory.create({
    data: {
      cafeId: auraCafe.id,
      name: "Pastry Chef Delicacies",
      slug: "desserts",
      description: "Single-origin chocolate tarts, Basque cheesecakes & authentic tiramisu.",
      sortOrder: 6,
    },
  });

  console.log("✅ Menu categories created.");

  // 8. Menu Items with Variants and Add-ons
  // --- Item 1: Cortado Royale
  const cortado = await prisma.menuItem.create({
    data: {
      cafeId: auraCafe.id,
      categoryId: catCoffee.id,
      name: "Spanish Cortado Velvet",
      slug: "spanish-cortado-velvet",
      description: "Double ristretto of Ethiopian Yirgacheffe cut with equal ratio textured silky whole milk in a faceted Libbey glass.",
      price: 240,
      imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: true,
      isSpecial: true,
      isVeg: true,
      allergens: "Milk",
      preparationTime: 5,
      sortOrder: 1,
      variants: {
        create: [
          { name: "Single Cortado (4oz)", price: 220, isDefault: false },
          { name: "Double Cortado (6oz)", price: 240, isDefault: true },
        ],
      },
      addOns: {
        create: [
          { name: "Organic Oat Milk (Oatly Barista)", price: 50 },
          { name: "Madagascar Vanilla Bean", price: 40 },
          { name: "Extra Espresso Shot", price: 60 },
        ],
      },
    },
  });

  // --- Item 2: Flat White
  const flatWhite = await prisma.menuItem.create({
    data: {
      cafeId: auraCafe.id,
      categoryId: catCoffee.id,
      name: "Velvet Flat White",
      slug: "velvet-flat-white",
      description: "Micro-foamed steamed milk poured over a rich double ristretto with intricate latte art.",
      price: 260,
      imageUrl: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: true,
      isVeg: true,
      allergens: "Milk",
      preparationTime: 6,
      sortOrder: 2,
      variants: {
        create: [
          { name: "Regular (8oz)", price: 260, isDefault: true },
          { name: "Large (12oz)", price: 310, isDefault: false },
        ],
      },
      addOns: {
        create: [
          { name: "Almond Milk", price: 50 },
          { name: "Oat Milk", price: 50 },
          { name: "Caramel Drizzle", price: 40 },
        ],
      },
    },
  });

  // --- Item 3: Nitro Cascara Cold Brew
  const nitroBrew = await prisma.menuItem.create({
    data: {
      cafeId: auraCafe.id,
      categoryId: catColdDrinks.id,
      name: "Nitro Cascara Cloud Cold Brew",
      slug: "nitro-cascara-cloud-cold-brew",
      description: "18-hour cold steeped heirloom coffee charged with pure nitrogen for a Guinness-like creamy head, topped with sweet salted vanilla foam.",
      price: 320,
      imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: true,
      isSpecial: true,
      isVeg: true,
      allergens: "Milk (optional)",
      preparationTime: 4,
      sortOrder: 1,
      variants: {
        create: [
          { name: "Original Nitro (12oz)", price: 320, isDefault: true },
          { name: "Cascara Reserve (16oz)", price: 370, isDefault: false },
        ],
      },
      addOns: {
        create: [
          { name: "Salted Caramel Cold Foam", price: 60 },
          { name: "Spiced Cinnamon Dust", price: 20 },
        ],
      },
    },
  });

  // --- Item 4: Iced Yuzu Tonic Espresso
  const yuzuEspresso = await prisma.menuItem.create({
    data: {
      cafeId: auraCafe.id,
      categoryId: catColdDrinks.id,
      name: "Iced Yuzu Botanical Espresso Tonic",
      slug: "iced-yuzu-espresso-tonic",
      description: "Sparkling fever-tree tonic infused with Japanese Yuzu reduction, crowned with an espresso float and rosemary sprig.",
      price: 310,
      imageUrl: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isVeg: true,
      isVegan: true,
      preparationTime: 4,
      sortOrder: 2,
    },
  });

  // --- Item 5: Almond Butter Croissant
  const croissant = await prisma.menuItem.create({
    data: {
      cafeId: auraCafe.id,
      categoryId: catBakery.id,
      name: "Golden Almond Frangipane Croissant",
      slug: "almond-frangipane-croissant",
      description: "Double-baked flaky French croissant filled with rich almond cream, dusted with toasted sliced California almonds and powdered sugar.",
      price: 240,
      imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: true,
      isVeg: true,
      allergens: "Gluten, Dairy, Nuts",
      preparationTime: 3,
      sortOrder: 1,
      addOns: {
        create: [
          { name: "Warm Vanilla Custard Cup", price: 60 },
          { name: "House Berry Coulis", price: 40 },
        ],
      },
    },
  });

  // --- Item 6: Pain au Chocolat
  const painAuChocolat = await prisma.menuItem.create({
    data: {
      cafeId: auraCafe.id,
      categoryId: catBakery.id,
      name: "Valrhona Pain au Chocolat",
      slug: "valrhona-pain-au-chocolat",
      description: "Buttery laminated layers folded around dual batons of 70% dark Valrhona Guanaja chocolate.",
      price: 260,
      imageUrl: "https://images.unsplash.com/photo-1530610476181-d83430b64dcd?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isVeg: true,
      allergens: "Gluten, Dairy",
      preparationTime: 3,
      sortOrder: 2,
    },
  });

  // --- Item 7: Hass Avocado & Poached Eggs Sourdough
  const avoSourdough = await prisma.menuItem.create({
    data: {
      cafeId: auraCafe.id,
      categoryId: catBrunch.id,
      name: "Truffled Avocado & Poached Egg Toast",
      slug: "truffled-avocado-poached-egg-toast",
      description: "Thick slice of toasted naturally fermented country loaf, smashed Hass avocado, Danish feta mousse, two poached organic eggs, chili oil and micro herbs.",
      price: 440,
      imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: true,
      isSpecial: true,
      isVeg: false, // contains egg
      isSpicy: true,
      allergens: "Gluten, Egg, Dairy",
      preparationTime: 12,
      sortOrder: 1,
      variants: {
        create: [
          { name: "Classic Avocado Toast (Veg)", price: 380, isDefault: false },
          { name: "With Two Organic Poached Eggs", price: 440, isDefault: true },
          { name: "With Smoked Atlantic Salmon", price: 580, isDefault: false },
        ],
      },
      addOns: {
        create: [
          { name: "Crispy Hash Brown", price: 80 },
          { name: "Extra Poached Egg", price: 50 },
          { name: "White Truffle Oil Drizzle", price: 70 },
        ],
      },
    },
  });

  // --- Item 8: Brioche French Toast
  const frenchToast = await prisma.menuItem.create({
    data: {
      cafeId: auraCafe.id,
      categoryId: catBrunch.id,
      name: "Brulee Brioche French Toast",
      slug: "brulee-brioche-french-toast",
      description: "Caramelized French brioche custard soak, macerated wild strawberries, whipped mascarpone, pistachio crumble and pure Canadian maple syrup.",
      price: 420,
      imageUrl: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isVeg: true,
      allergens: "Gluten, Dairy, Egg",
      preparationTime: 14,
      sortOrder: 2,
    },
  });

  // --- Item 9: Smoked Burrata & Pesto Neapolitan Flatbread
  const flatbread = await prisma.menuItem.create({
    data: {
      cafeId: auraCafe.id,
      categoryId: catMains.id,
      name: "Smoked Burrata & Genovese Pesto Flatbread",
      slug: "smoked-burrata-pesto-flatbread",
      description: "Fermented 72-hour sourdough crust fired at 450°C, San Marzano tomato coulis, creamy pugliese burrata, pine nut basil pesto and aged balsamic glaze.",
      price: 520,
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: true,
      isVeg: true,
      allergens: "Gluten, Dairy, Pine Nuts",
      preparationTime: 15,
      sortOrder: 1,
      addOns: {
        create: [
          { name: "Extra Fresh Burrata Ball (100g)", price: 160 },
          { name: "Spicy Hot Honey", price: 40 },
          { name: "Kalamata Olives & Capers", price: 50 },
        ],
      },
    },
  });

  // --- Item 10: Truffle Smash Craft Burger
  const burger = await prisma.menuItem.create({
    data: {
      cafeId: auraCafe.id,
      categoryId: catMains.id,
      name: "Prime Truffle Brioche Burger",
      slug: "prime-truffle-brioche-burger",
      description: "Double smashed patty, melted gruyere & vintage cheddar, black truffle aioli, caramelized sweet onions, served with rosemary parmesan fries.",
      price: 560,
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: true,
      isVeg: false,
      allergens: "Gluten, Dairy",
      preparationTime: 16,
      sortOrder: 2,
      variants: {
        create: [
          { name: "Gourmet Portobello Mushroom Patty (Veg)", price: 490, isDefault: false },
          { name: "Double Smashed Wagyu Blend (Non-Veg)", price: 560, isDefault: true },
        ],
      },
      addOns: {
        create: [
          { name: "Crispy Bacon Strips", price: 90 },
          { name: "Extra Melted Vintage Cheddar", price: 50 },
          { name: "Truffle Fries Upgrade", price: 70 },
        ],
      },
    },
  });

  // --- Item 11: Classic Tiramisu
  const tiramisu = await prisma.menuItem.create({
    data: {
      cafeId: auraCafe.id,
      categoryId: catDesserts.id,
      name: "Aura Signature Espresso Tiramisu",
      slug: "signature-espresso-tiramisu",
      description: "House savoiardi ladyfingers steeped in our reserve espresso and dark rum, layered with silky sabayon mascarpone cream and dusted with Dutch cocoa.",
      price: 360,
      imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isFeatured: true,
      isSpecial: true,
      isVeg: true,
      allergens: "Gluten, Dairy, Egg",
      preparationTime: 4,
      sortOrder: 1,
    },
  });

  // --- Item 12: San Sebastian Basque Cheesecake
  const cheesecake = await prisma.menuItem.create({
    data: {
      cafeId: auraCafe.id,
      categoryId: catDesserts.id,
      name: "Burnt Basque Cheesecake",
      slug: "burnt-basque-cheesecake",
      description: "Caramelized dark outer crust with an impossibly molten, creamy vanilla bean core. Served warm with tart raspberry compote.",
      price: 380,
      imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isVeg: true,
      allergens: "Dairy, Egg",
      preparationTime: 4,
      sortOrder: 2,
    },
  });

  console.log("✅ Menu items, variants & add-ons created.");

  // 9. Create Sample Realistic Orders (Pending, Preparing, Ready, Served)
  // Order 1: Live Pending Order (Just placed by table T01)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: "ORD-84192",
      cafeId: auraCafe.id,
      tableId: createdTables[0].id, // T01
      customerName: "Aarav Sharma",
      customerPhone: "+91 9811223344",
      customerEmail: "aarav@example.com",
      status: "PENDING",
      subtotal: 580,
      taxAmount: 29, // 5%
      discountAmount: 0,
      totalAmount: 609,
      paymentStatus: "UNPAID",
      paymentMethod: "PAY_AT_COUNTER",
      notes: "Please make the Cortado with very hot milk if possible.",
      createdAt: new Date(Date.now() - 3 * 60 * 1000), // 3 mins ago
      items: {
        create: [
          {
            menuItemId: cortado.id,
            name: "Spanish Cortado Velvet",
            variantName: "Double Cortado (6oz)",
            unitPrice: 240,
            quantity: 1,
            totalPrice: 290,
            specialInstructions: "Extra hot milk",
            selectedAddOns: {
              create: [{ name: "Organic Oat Milk (Oatly Barista)", price: 50, quantity: 1 }],
            },
          },
          {
            menuItemId: croissant.id,
            name: "Golden Almond Frangipane Croissant",
            unitPrice: 240,
            quantity: 1,
            totalPrice: 290,
            selectedAddOns: {
              create: [{ name: "Warm Vanilla Custard Cup", price: 60, quantity: 1 }],
            },
          },
        ],
      },
      statusHistory: {
        create: [
          {
            status: "PENDING",
            note: "Order submitted by customer via Table T01 QR code",
            changedBy: "Customer",
            createdAt: new Date(Date.now() - 3 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Order 2: Preparing Order (Kitchen working on it, Table T02)
  const order2 = await prisma.order.create({
    data: {
      orderNumber: "ORD-84191",
      cafeId: auraCafe.id,
      tableId: createdTables[1].id, // T02
      customerName: "Rhea Sen",
      customerPhone: "+91 9844332211",
      status: "PREPARING",
      subtotal: 1080,
      taxAmount: 54,
      discountAmount: 0,
      totalAmount: 1134,
      paymentStatus: "PAID",
      paymentMethod: "UPI_ONLINE",
      notes: "Less spicy on the avocado toast",
      createdAt: new Date(Date.now() - 11 * 60 * 1000), // 11 mins ago
      estimatedReadyTime: new Date(Date.now() + 4 * 60 * 1000),
      items: {
        create: [
          {
            menuItemId: avoSourdough.id,
            name: "Truffled Avocado & Poached Egg Toast",
            variantName: "With Two Organic Poached Eggs",
            unitPrice: 440,
            quantity: 1,
            totalPrice: 520,
            specialInstructions: "Less chili flakes",
            selectedAddOns: {
              create: [{ name: "Crispy Hash Brown", price: 80, quantity: 1 }],
            },
          },
          {
            menuItemId: burger.id,
            name: "Prime Truffle Brioche Burger",
            variantName: "Double Smashed Wagyu Blend (Non-Veg)",
            unitPrice: 560,
            quantity: 1,
            totalPrice: 560,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            status: "PENDING",
            note: "Order submitted via QR",
            changedBy: "Customer",
            createdAt: new Date(Date.now() - 11 * 60 * 1000),
          },
          {
            status: "ACCEPTED",
            note: "Order confirmed by manager",
            changedBy: "Manager (Ananya)",
            createdAt: new Date(Date.now() - 9 * 60 * 1000),
          },
          {
            status: "PREPARING",
            note: "KOT printed & Chef started grilling patties",
            changedBy: "Kitchen (Marcus)",
            createdAt: new Date(Date.now() - 8 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Order 3: Ready for Pickup / Serving (Table T03)
  const order3 = await prisma.order.create({
    data: {
      orderNumber: "ORD-84190",
      cafeId: auraCafe.id,
      tableId: createdTables[2].id, // T03
      customerName: "Karan Mehta",
      customerPhone: "+91 9766554433",
      status: "READY",
      subtotal: 680,
      taxAmount: 34,
      discountAmount: 0,
      totalAmount: 714,
      paymentStatus: "PAID",
      paymentMethod: "UPI_ONLINE",
      createdAt: new Date(Date.now() - 22 * 60 * 1000),
      items: {
        create: [
          {
            menuItemId: nitroBrew.id,
            name: "Nitro Cascara Cloud Cold Brew",
            variantName: "Original Nitro (12oz)",
            unitPrice: 320,
            quantity: 1,
            totalPrice: 320,
          },
          {
            menuItemId: tiramisu.id,
            name: "Aura Signature Espresso Tiramisu",
            unitPrice: 360,
            quantity: 1,
            totalPrice: 360,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            status: "PENDING",
            note: "Order placed",
            changedBy: "Customer",
            createdAt: new Date(Date.now() - 22 * 60 * 1000),
          },
          {
            status: "ACCEPTED",
            note: "Accepted",
            changedBy: "Manager",
            createdAt: new Date(Date.now() - 20 * 60 * 1000),
          },
          {
            status: "PREPARING",
            note: "Brewing & plating",
            changedBy: "Kitchen",
            createdAt: new Date(Date.now() - 18 * 60 * 1000),
          },
          {
            status: "READY",
            note: "Dishes plated and staged at service counter",
            changedBy: "Kitchen",
            createdAt: new Date(Date.now() - 2 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Order 4: Completed / Served Order (Table T04)
  const order4 = await prisma.order.create({
    data: {
      orderNumber: "ORD-84189",
      cafeId: auraCafe.id,
      tableId: createdTables[3].id, // T04
      customerName: "Pooja Hegde",
      customerPhone: "+91 9988776655",
      status: "SERVED",
      subtotal: 1220,
      taxAmount: 61,
      discountAmount: 50,
      totalAmount: 1231,
      paymentStatus: "PAID",
      paymentMethod: "CARD",
      createdAt: new Date(Date.now() - 75 * 60 * 1000),
      items: {
        create: [
          {
            menuItemId: flatbread.id,
            name: "Smoked Burrata & Genovese Pesto Flatbread",
            unitPrice: 520,
            quantity: 1,
            totalPrice: 520,
          },
          {
            menuItemId: frenchToast.id,
            name: "Brulee Brioche French Toast",
            unitPrice: 420,
            quantity: 1,
            totalPrice: 420,
          },
          {
            menuItemId: flatWhite.id,
            name: "Velvet Flat White",
            variantName: "Regular (8oz)",
            unitPrice: 260,
            quantity: 1,
            totalPrice: 280,
            selectedAddOns: {
              create: [{ name: "Caramel Drizzle", price: 40, quantity: 1 }],
            },
          },
        ],
      },
      statusHistory: {
        create: [
          {
            status: "SERVED",
            note: "Order served to table T04 by server",
            changedBy: "Manager (Ananya)",
            createdAt: new Date(Date.now() - 45 * 60 * 1000),
          },
        ],
      },
    },
  });

  // 10. Second Cafe for Multi-Tenancy demonstration: "Bella Cucina Coffee & Trattoria"
  const bellaOwnerPw = await hashPw("Bella@1234");
  const bellaOwner = await prisma.user.create({
    data: {
      name: "Matteo Rossi",
      email: "owner@bellacucina.com",
      passwordHash: bellaOwnerPw,
      role: "CAFE_OWNER",
      phone: "+91 9777112233",
    },
  });

  const bellaCafe = await prisma.cafe.create({
    data: {
      name: "Bella Cucina Bistro & Espresso Bar",
      slug: "bella-cucina",
      tagline: "Authentic Italian Espresso, Paninis & Gelato",
      description: "Traditional Italian roasts, wood-fired focaccia, and house-made dolci.",
      logoUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=250&q=80",
      coverUrl: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1600&q=80",
      phone: "+91 22 2640 9911",
      email: "ciao@bellacucina.com",
      address: "12 Bandra West Seaside Promenade",
      city: "Mumbai",
      currency: "INR",
      currencySymbol: "₹",
      taxRate: 5.0,
      isAcceptingOrders: true,
      openingHours: "08:00 AM – 11:00 PM",
    },
  });

  await prisma.cafeMembership.create({
    data: { userId: bellaOwner.id, cafeId: bellaCafe.id, role: "CAFE_OWNER" },
  });

  await prisma.subscription.create({
    data: {
      cafeId: bellaCafe.id,
      planId: starterPlan.id,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
      isDevMode: true,
    },
  });

  const bellaTable1 = await prisma.table.create({
    data: {
      cafeId: bellaCafe.id,
      tableNumber: "B01",
      label: "Al Fresco Terrace",
      capacity: 4,
      qrToken: generateToken(),
    },
  });

  const bellaCat = await prisma.menuCategory.create({
    data: {
      cafeId: bellaCafe.id,
      name: "Espresso Tradizionale",
      slug: "espresso-tradizionale",
      sortOrder: 1,
    },
  });

  await prisma.menuItem.create({
    data: {
      cafeId: bellaCafe.id,
      categoryId: bellaCat.id,
      name: "Classic Italian Ristretto",
      slug: "classic-italian-ristretto",
      description: "Dense, aromatic short shot pulled from dark roasted Sicilian beans.",
      price: 180,
      imageUrl: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isVeg: true,
      preparationTime: 3,
    },
  });

  console.log("✅ Seed completed successfully! 🎉");
  console.log("-----------------------------------------");
  console.log("Demo Credentials:");
  console.log("Super Admin: admin@cafesaas.com / Admin@1234");
  console.log("Cafe Owner:  owner@auracafe.com / Owner@1234");
  console.log("Manager:     manager@auracafe.com / Manager@1234");
  console.log("Kitchen:     kitchen@auracafe.com / Kitchen@1234");
  console.log("Bella Owner: owner@bellacucina.com / Bella@1234");
  console.log("Customer Menu URL: /menu/aura-cafe?table=T01");
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
