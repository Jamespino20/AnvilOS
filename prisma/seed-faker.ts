/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 15, 2026

Faker-based seed for stress testing.
Run: npx tsx prisma/seed-faker.ts
*/

import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const USERS = [
  {
    id: 1,
    sellerName: "Jones Itaka",
    username: "SUPERADMIN",
    passwordHash: bcrypt.hashSync("password123", 10),
    email: "test@gmail.com",
    role: "SUPERADMIN" as const,
  },
  {
    id: 2,
    sellerName: "Skya Aguilar",
    username: "ADMIN  ",
    passwordHash: bcrypt.hashSync("password123", 10),
    email: "test@yahoo.com.ph",
    role: "ADMIN" as const,
  },
  {
    id: 3,
    sellerName: "Juan De la Cruz",
    username: "juandlc3",
    passwordHash: bcrypt.hashSync("password123", 10),
    email: "test@gmail.com",
    role: "STAFF" as const,
  },
];

const BRANDS = [
  "Sheridan",
  "Pioneer",
  "Holcim",
  "Eagle Cement",
  "Boral",
  "Apex Steel",
  "Philippine Steel",
  "Cemex",
  "Taiwan Lumber",
  "Cypress",
  "Boerden",
  "Hardiflex",
  "Wonderboard",
  "Mariwasa",
  "ASA",
  "Tulsa",
  "Flexi",
  "Koby",
  "Stanley",
  "Bosch",
];

const CATEGORIES = [
  "Hardware",
  "Lumber",
  "Wires",
  "Plywood",
  "Pipes",
  "Paints",
  "Bars",
  "Corneza",
  "T & G",
  "Door Jamb",
  "Liston",
  "G.I Sheets",
  "Electrical",
  "Plumbing",
  "Nails",
  "Chemicals",
  "Screws, Bolts, & Nuts",
  "Tools",
  "Solid Panel Door",
  "Solid Cabinet Door",
  "Flushdoor",
  "HDF Moulded Doors",
  "Drawer Face",
  "Ventilations",
  "Stair Component",
  "Laminated Wider Board",
  "Cabinet Door",
  "Carvings",
  "Toilet Accessories",
  "Insulation",
  "Wiring Devices",
  "Stock Files",
  "Sheridan",
  "Gulong",
  "Roofings",
  "Nuts",
  "Screws",
];

const SUPPLIERS_DATA = [
  {
    name: "Top Silver Signal Marketing Inc.",
    contact: "Aging",
    address: "137 RI Mc.Arthur Highway Tuktukan Guiginto Bulacan",
  },
  { name: "Megaworld Trading", contact: "Jhenny delos Santos" },
  {
    name: "Orange Resources Inc.",
    contact: "James Son",
    address: "10 Gasan St., Masambong, SFDM, Quezon City",
  },
  {
    name: "Fourkings Lumber and Construction Supply",
    contact: "Rene",
    address: "282 DRT Highway, Brgy. Bagong Nayon, Baliuag, Bulacan",
  },
  {
    name: "LPK Construction Supply Trading",
    contact: "Joseph",
    address: "K-59 Anonas St. corner K-10, Project 2, Quezon City",
  },
  {
    name: "Golden Star Commercial",
    contact: "James Son",
    address: "Road 1, Arty Subd., Brgy. Talipapa, Novaliches, Quezon City",
  },
  {
    name: "SHERIDAN MARKETING, INC",
    address: "74 De Jesus St., Brgy. San Antonio, SFDM, Quezon City",
  },
  {
    name: "Globe International Distributor Center INC.",
    address: "228 Roosevelt Avenue, Quezon City",
  },
  {
    name: "Four Silver Jade Trading Corp.",
    address:
      "Rm.713 Downtown Center Bldg., 516 Q. Paredes St., Binondo, Manila",
  },
  {
    name: "SOUDOWELD INDUSTRIAL PHILS.",
    address: "10 M.Antonio St. Maysan, Valenzuela City",
  },
  {
    name: "R.O.H TRADING AND SERVICES",
    address: "131 Cagayan Valley Road, Taal, Pulilan, Bulacan",
  },
  {
    name: "Philippine HardwareHouse Co. Inc.",
    address: "2713 Zamora St., Brgy. 097, Pasay City",
  },
  {
    name: "ARTES MYER PHILIPPINES",
    contact: "Lito De Leon",
    address: "57 Sgt. Rivera St, Quezon City, 1115 Metro Manila",
  },
  {
    name: "HISENSE TRADING",
    address: "112 Kanlaon St. Cor Simoun St., Sta. Mesa Heights, Quezon City",
  },
  { name: "GIVM CONCRETE PRODUCT", address: "San Rafael, Bulacan" },
  {
    name: "LIROBENSON HARDWARE",
    address: "2263 Sinaglong cor. A. Francisco, Malate, Manila",
  },
  { name: "DILCUE TRADING", address: "Malabon City" },
  {
    name: "MORNING BRIGHT WIRES AND CABLE MARKETING",
    address: "#80 Cenacle Drive, Sanville Subd., Brgy. Culiat, Quezon City",
  },
  {
    name: "M. AYROSO LUMBER AND HARDWARE",
    address: "9 Gov. Halili Ave., Ext., Binang 2nd, Bocaue, Bulacan",
  },
  {
    name: "VE Enterprises",
    address:
      "Blk. 14 Lot 30 Pomelo St. Rainbow Villa. 5 Bagumbong, Caloocan City",
  },
  {
    name: "Sea King Commercial",
    address:
      "9428 Urna Drive Corner Cecile St., Airport Village, Parañaque City",
  },
  { name: "Bo De Oro", address: "Hanga, Sta. Rita, Guiguinto, Bulacan" },
  {
    name: "Supertop Trading Inc.",
    contact: "Mike Velarde",
    address: "41 E.porto Street Brgy Del monte SFDM, Quezon City",
  },
  {
    name: "FIREFLY ELECTRIC AND LIGHTNING CORPORATION",
    address: "Sky 1 Tower, Dasmarinas St., Binondo, Manila",
  },
  {
    name: "P.C.A.",
    address: "A&J Rosegold Compound, Circum Road, Cutcot, Angeles",
  },
  { name: "WT Commercial", address: "Valenzuela City" },
  { name: "DS COMMERCIAL", address: "Poblacion, San Miguel, Bulacan" },
  {
    name: "TAN SU AND SONS CORPORATION",
    address: "Bo. Tikay, Malolos, Bulacan",
  },
  { name: "A.F. Bautista Lumber", address: "Poblacion, Pulilan, Bulacan" },
  {
    name: "New Samex Trading Eagle",
    contact: "Archie",
    address: "San Ildefonso, Bulacan",
  },
  { name: "GIVM CONCRETE PIPE", address: "Sampaloc, San Rafael, Bulacan" },
  {
    name: "Uniprime Beaver",
    address: "226 Sumulong Hi-way, Mambugan, Antipolo",
  },
  {
    name: "NEW Grace Enterprises",
    address: "Tierra Dayao, Sta. Cruz, Guiguinto, Bulacan",
  },
  {
    name: "PARPIPES CONCRETE PRODUCTS CORP.",
    contact: "Ms. Oya",
    address: "KM 38, Pulong Buhangin, Sta. Maria, Bulacan",
  },
  {
    name: "Caltex Pulilan",
    contact: "Mr. John Luna",
    address: "Sto. Cristo, Pulilan, Bulacan",
  },
];

const DELIVERY_METHODS = ["Pickup", "Delivery", "COD", "WalkIn"] as const;
const TRANSACTION_TYPES_SALE = ["SaleWalkIn", "SalePO"] as const;
const TRANSACTION_TYPES_ALL = [
  "SaleWalkIn",
  "SalePO",
  "Restock",
  "Adjustment",
  "Return",
  "Damage",
] as const;
const TRANSACTION_STATUSES = [
  "Ongoing",
  "Processing",
  "OnTheWay",
  "Completed",
  "Cancelled",
] as const;
const PAYMENT_METHODS = [
  "Cash",
  "GCash",
  "Maya",
  "Bank Transfer",
  "Cheque",
  "Credit",
];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

function generateReceiptNumber(): number {
  return 10000000 + Math.floor(Math.random() * 90000000);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function main() {
  console.log("=== Faker Seed: AnvilOS Stress Test ===\n");

  // Clear existing data (order matters for foreign keys)
  console.log("Clearing existing data...");
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.notificationRead.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.buyer.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.emailToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.category.deleteMany();

  // ── Users ────────────────────────────────────────────────────────
  console.log(`Seeding ${USERS.length} users...`);
  await prisma.user.createMany({
    data: USERS.map((u) => ({
      id: u.id,
      sellerName: u.sellerName,
      username: u.username,
      passwordHash: u.passwordHash,
      email: u.email,
      role: u.role,
      registryDate: new Date("2025-05-29"),
      lastLogin: new Date("2025-06-19"),
      isActive: true,
      emailVerified: new Date("2025-05-29"),
    })),
  });

  // ── Categories ───────────────────────────────────────────────────
  console.log(`Seeding ${CATEGORIES.length} categories...`);
  const categoryRecords: { id: number; name: string }[] = [];
  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = await prisma.category.create({
      data: {
        name: CATEGORIES[i],
        isAvailable: true,
        createdAt: new Date("2025-06-02"),
        updatedAt: new Date("2025-06-02"),
      },
    });
    categoryRecords.push({ id: cat.id, name: cat.name });
  }

  // ── Brands ───────────────────────────────────────────────────────
  console.log(`Seeding ${BRANDS.length} brands...`);
  const brandRecords: { id: number; name: string }[] = [];
  for (const brandName of BRANDS) {
    const brand = await prisma.brand.create({
      data: {
        name: brandName,
        isAvailable: true,
        createdAt: new Date("2025-06-02"),
      },
    });
    brandRecords.push({ id: brand.id, name: brand.name });
  }

  // ── Suppliers ────────────────────────────────────────────────────
  console.log(`Seeding ${SUPPLIERS_DATA.length} suppliers...`);
  const supplierRecords: { id: number; name: string }[] = [];
  for (let i = 0; i < SUPPLIERS_DATA.length; i++) {
    const s = SUPPLIERS_DATA[i];
    const supplier = await prisma.supplier.create({
      data: {
        supplierName: s.name,
        contactName: s.contact || null,
        address: s.address || null,
        isAvailable: true,
      },
    });
    supplierRecords.push({ id: supplier.id, name: supplier.supplierName });
  }

  // ── Products (300) ──────────────────────────────────────────────
  console.log("Seeding 300 products...");
  const productRecords: {
    id: number;
    name: string;
    unitPrice: number;
    sellingPrice: number;
  }[] = [];
  const hardwareProductNames = [
    'Concrete Hollow Block 6"',
    'Concrete Hollow Block 8"',
    "Portland Cement 40kg",
    "Portland Cement 50kg",
    "Gravel (per cu.m.)",
    "Sand (per cu.m.)",
    "Deformed Bar 10mm",
    "Deformed Bar 12mm",
    "Deformed Bar 16mm",
    "Deformed Bar 20mm",
    "Ordinary Round Bar 10mm",
    "Ordinary Round Bar 12mm",
    "Ordinary Round Bar 16mm",
    "G.I. Sheet 10x10",
    "G.I. Sheet 4x8",
    "G.I. Sheet Corrugated 10x10",
    "Plywood 4x8 6mm",
    "Plywood 4x8 9mm",
    "Plywood 4x8 12mm",
    "Phenolic Board 4x8",
    "Marine Plywood 4x8",
    "Hardiflex 4x8 6mm",
    "Hardiflex 4x8 8mm",
    "Wonderboard 4x8",
    "Cement Finish 4x8",
    "T & G 4x8",
    "Flooring Plywood 4x8",
    'Clavos (1" - 100pcs)',
    'Clavos (1.5" - 100pcs)',
    'Clavos (2" - 100pcs)',
    'Drywall Screw #6x1"',
    'Drywall Screw #6x1.5"',
    'Drywall Screw #6x2"',
    'Concrete Nail 2"',
    'Concrete Nail 3"',
    'Common Wire Nail 1"',
    'Common Wire Nail 1.5"',
    'Common Wire Nail 2"',
    'Common Wire Nail 3"',
    "Galvanized Wire #16",
    "Galvanized Wire #18",
    "Galvanized Wire #20",
    "Electrical Wire #14 (100m)",
    "Electrical Wire #12 (100m)",
    "Electrical Wire #10 (100m)",
    "Flexible Cord (100m)",
    "Flat Cord (100m)",
    'PVC Pipe 1/2"',
    'PVC Pipe 3/4"',
    'PVC Pipe 1"',
    'PVC Pipe 1.5"',
    'PVC Pipe 2"',
    'PVC Elbow 1/2"',
    'PVC Elbow 3/4"',
    'PVC Elbow 1"',
    'PVC Tee 1/2"',
    'PVC Tee 3/4"',
    'PVC Tee 1"',
    'PVC Socket 1/2"',
    'PVC Socket 3/4"',
    'PVC Socket 1"',
    "Teflon Tape (roll)",
    "PVC Glue (small)",
    "PVC Glue (big)",
    "Flush Door 2.1m x 0.9m",
    "Flush Door 2.1m x 0.7m",
    "Panel Door 2.1m x 0.9m",
    "Panel Door 2.1m x 0.7m",
    "Cabinet Door 60cm",
    "Cabinet Door 70cm",
    "Cabinet Door 80cm",
    "Drawer Face 60cm",
    "Drawer Face 70cm",
    "Drawer Face 80cm",
    "Door Jamb 2.1m",
    "Door Jamb 2.4m",
    "Liston 1x2x10",
    "Liston 1x3x10",
    "Liston 2x2x10",
    "Muriatic Acid (gal)",
    "Paint Thinner (gal)",
    "Boiled Linseed Oil (gal)",
    "Wall Putty (25kg)",
    "Primer (gal)",
    "Enamel Paint 1L",
    "Latex Paint 1L",
    "Enamel Paint 4L",
    "Latex Paint 4L",
    'Brush 1"',
    'Brush 2"',
    'Brush 3"',
    'Paint Roller 9"',
    "Sandpaper #80",
    "Sandpaper #120",
    "Sandpaper #220",
    'Hex Bolt 3/8x2"',
    'Hex Bolt 3/8x3"',
    'Hex Bolt 1/2x3"',
    'Hex Nut 3/8"',
    'Hex Nut 1/2"',
    'Flat Washer 3/8"',
    'Flat Washer 1/2"',
    'Lock Washer 3/8"',
    'Lock Washer 1/2"',
    'Toggle Bolt 3/8"',
    'Expansion Bolt 1/4"',
    'Expansion Bolt 3/8"',
    "Steel Bracket L-Type",
    "Steel Bracket Flat",
    'Tee Hinge 4"',
    'Tee Hinge 6"',
    'Butt Hinge 3"',
    'Butt Hinge 4"',
    "Door Knob (Standard)",
    "Door Knob (Privacy)",
    "Deadbolt Lock",
    "Door Closer",
    "Cabinet Hinge 35mm",
    'Cabinet Slide 12"',
    "Electrical Tape (roll)",
    "Wire Nuts (pack)",
    " junction Box 4x4",
    "Switch Single",
    "Switch Double",
    "Outlet Duplex",
    "Outlet GFCI",
    "Breaker 15A Single",
    "Breaker 20A Single",
    "Breaker 30A Double",
    "Breaker Panel 4-Gang",
    "Breaker Panel 6-Gang",
    'Conduit 1/2" EMT (10ft)',
    'Conduit 3/4" EMT (10ft)',
    'Conduit Strap 1/2"',
    'Coupling 1/2" EMT',
    'Connector 1/2" EMT',
    "Gutter 100mm (3m)",
    "Gutter 150mm (3m)",
    "Downspout 75mm (3m)",
    'Roofing Nail 1.5"',
    'Roofing Nail 2"',
    'Rivet 3/16x1/2"',
    "Rivet Gun",
    "Hacksaw Frame",
    "Hacksaw Blade (3-pack)",
    "Tape Measure 5m",
    "Tape Measure 8m",
    'Level 24"',
    'Level 48"',
    "Drill Bit Set (13pcs)",
    'Masonry Bit 1/4"',
    'Masonry Bit 3/8"',
    "Screwdriver Set (6pcs)",
    "Pliers Standard",
    "Pliers Long Nose",
    "Wire Cutter",
    'Adjustable Wrench 8"',
    'Adjustable Wrench 12"',
    'Pipe Wrench 14"',
    'Pipe Wrench 18"',
    "Allen Wrench Set",
    "Caulking Gun",
    "Silicone Sealant (tube)",
    "Epoxy Adhesive",
    "Foam Sealant 12oz",
    "Weatherstrip Door",
    "Door Sweep",
    'Rubber Gasket 1/8"',
    "Felt Pad (20pcs)",
    "Corrugated G.I. Sheet 2.44m",
    "Corrugated G.I. Sheet 3.05m",
    "Flat G.I. Sheet 2.44m",
    "Flat G.I. Sheet 3.05m",
    "Steel Stud 2x4 (3m)",
    "Steel Stud 2x6 (3m)",
    "Metal Furring (3m)",
    "Metal Channel (3m)",
    "Insulation Board 4x8",
    "Rockwool Insulation",
    "Fiberglass Batt",
    'Ventilation Fan 6"',
    'Ventilation Fan 8"',
    'Exhaust Hood 10"',
    "Stair Tread 30x100cm",
    "Stair Railing 1.2m",
    "Stair Baluster",
    "Cabinet Handle 96mm",
    "Cabinet Handle 128mm",
    "Cabinet Knob",
    "Sliding Door Track 1.8m",
    "Sliding Door Roller",
    "Furniture Slide",
    'Conduit Elbow 1/2"',
    "Conduit Body Type LB",
    'Junction Box Round 4"',
    "Wire Nut Yellow",
    "Wire Nut Red",
    "MC Cable 12/2 (50m)",
    "MC Cable 14/2 (50m)",
    "Romex 12/2 (50m)",
    "Romex 14/2 (50m)",
    "Ground Rod 5/8x8ft",
    "Ground Clamp",
    "Split Bolt Connector",
    'U-Bolt 3/8"',
    'Carriage Bolt 3/8x3"',
    'Lag Bolt 3/8x3"',
    'Wood Screw #8x1"',
    'Wood Screw #8x2"',
    'Wood Screw #10x3"',
    'Machine Screw 1/4x1"',
    'Machine Screw 1/4x2"',
    'Self-Drilling Screw #8x1"',
    'Self-Drilling Screw #8x1.5"',
    'Pop Rivet Aluminum 3/16"',
    'Pop Rivet Steel 1/8"',
    "Threaded Rod 3/8x6ft",
    "Threaded Rod 1/2x6ft",
    "Unistrut Channel (3m)",
    'Unistrut Clamp 1/2"',
    "Cable Tray 300mm",
    "Wire Mesh Cable Tray",
    'Clevis Hanger 1/2"',
    'Riser Clamp 1/2"',
    'Pipe Roll 1/2"',
    "Beam Clamp",
    'Saddle Clamp 1"',
    'Pipe Strap 1/2"',
    'Floor Trap 4"',
    'P-Trap 1.5"',
    'Clean Out 4"',
    "Toilet Flange",
    "Wax Ring",
    "Fill Valve",
    "Flush Valve",
    "Ballcock Assembly",
    "Toilet Seat Standard",
    "Toilet Seat Soft-Close",
    "Sink Faucet Standard",
    "Sink Faucet Single-Lever",
    "Shower Faucet",
    'Angle Stop 1/2"',
    'Flexible Hose 12"',
    'Flexible Hose 16"',
    'Tee Joint 1/2"',
    'Elbow Joint 1/2"',
    'Union Joint 1/2"',
    'Hose Bibb 1/2"',
    'Check Valve 1"',
    'Gate Valve 1"',
    'Ball Valve 1/2"',
    'Ball Valve 1"',
    'Reducing Tee 1"x1/2"',
    'Street Elbow 1/2"',
    'Coupling 1/2"',
    'Nipple 1/2"x4"',
  ];

  const usedProductNames = new Set<string>();

  for (let i = 0; i < 300; i++) {
    const cat = pickRandom(categoryRecords);
    const supplier = pickRandom(supplierRecords);
    const brand = pickRandom(brandRecords);

    let baseName: string;
    if (i < hardwareProductNames.length) {
      baseName = hardwareProductNames[i];
    } else {
      baseName = `${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()}`;
    }
    // ensure unique
    let name = baseName;
    let suffix = 2;
    while (usedProductNames.has(name)) {
      name = `${baseName} #${suffix++}`;
    }
    usedProductNames.add(name);

    const unitPrice = round2(10 + Math.random() * 5000);
    const markup = 1.05 + Math.random() * 0.4; // 5-45% markup
    const sellingPrice = round2(unitPrice * markup);
    const quantity = Math.floor(Math.random() * 300);
    const minThreshold = Math.floor(5 + Math.random() * 50);

    const product = await prisma.product.create({
      data: {
        productName: name,
        categoryId: cat.id,
        category: cat.name,
        supplierId: supplier.id,
        supplierName: supplier.name,
        brandId: brand.id,
        unitPrice,
        sellingPrice,
        quantity,
        minThreshold,
        isFastMoving: Math.random() < 0.3,
        sellByWeight: Math.random() < 0.1,
        sellByBox: Math.random() < 0.1,
        isAvailable: Math.random() < 0.95,
        createdAt: new Date("2025-06-02"),
        updatedAt: new Date("2025-06-15"),
      },
    });
    productRecords.push({
      id: product.id,
      name: product.productName,
      unitPrice,
      sellingPrice,
    });
  }

  // ── Buyers (50) ─────────────────────────────────────────────────
  console.log("Seeding 50 buyers...");
  const buyerRecords: { id: number; name: string }[] = [];
  const buyerNames = new Set<string>();
  for (let i = 0; i < 50; i++) {
    let bName: string;
    if (i < 3) {
      bName = ["Walk-In Customer", "CWL Hardware", "Regular Buyer"][i];
    } else {
      bName = faker.person.fullName();
      while (buyerNames.has(bName)) bName = faker.person.fullName();
    }
    buyerNames.add(bName);

    const buyer = await prisma.buyer.create({
      data: {
        name: bName,
        email:
          Math.random() < 0.6
            ? faker.internet.email({
                firstName: bName.split(" ")[0].toLowerCase(),
              })
            : null,
        phone: Math.random() < 0.7 ? "09" + faker.string.numeric(9) : null,
        address:
          Math.random() < 0.5
            ? faker.location.streetAddress() + ", " + faker.location.city()
            : null,
        totalOrders: 0,
        totalSpent: 0,
        creditBalance: 0,
        sellerId: pickRandom(USERS).id,
      },
    });
    buyerRecords.push({ id: buyer.id, name: buyer.name });
  }

  // ── Notifications (50) ──────────────────────────────────────────
  console.log("Seeding 50 notifications...");
  const notifData: {
    systemNotification: string;
    message: string;
    createdAt: Date;
  }[] = [];
  for (let i = 0; i < 50; i++) {
    const isStock = Math.random() < 0.6;
    const prod = pickRandom(productRecords);
    const date = randomDate(new Date("2025-06-01"), new Date("2025-06-15"));
    if (isStock) {
      const isOut = prod.unitPrice < 100; // just random heuristic
      notifData.push({
        systemNotification: `Stock_${prod.id}`,
        message: isOut
          ? `NO STOCK: ${prod.name} is out of stock!`
          : `LOW STOCK: ${prod.name} quantity is ${Math.floor(Math.random() * 20)} (threshold: 20)`,
        createdAt: date,
      });
    } else {
      notifData.push({
        systemNotification: `Transaction_${10000 + i}`,
        message: `Ongoing transaction: #${10000 + i} with ${pickRandom(buyerRecords).name}`,
        createdAt: date,
      });
    }
  }
  await prisma.notification.createMany({ data: notifData });

  // ── Transactions (400) + TransactionItems ────────────────────────
  console.log("Seeding 400 transactions with items...");
  const txData: {
    receiptNumber: number;
    buyerName: string;
    buyerId: number;
    sellerId: number;
    sellerName: string;
    transactionType: string;
    deliveryMethod: string;
    transactionStatus: string;
    transactionDate: Date;
    grandTotal: number;
    paymentMethod: string | null;
    isReturned: boolean;
    returnForReceiptNumber: number | null;
    items: {
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      costPrice: number;
    }[];
  }[] = [];

  const completedReceipts: number[] = [];

  for (let i = 0; i < 400; i++) {
    const txType = pickRandom(TRANSACTION_TYPES_ALL);
    const seller = pickRandom(USERS);
    const buyer = pickRandom(buyerRecords);
    const txDate = randomDate(new Date("2025-05-25"), new Date("2025-06-15"));
    const receiptNum = generateReceiptNumber();

    let status: string;
    if (txType === "SaleWalkIn" || txType === "SalePO") {
      status = pickRandom([
        "Completed",
        "Completed",
        "Completed",
        "Completed",
        "Ongoing",
        "Cancelled",
      ]);
    } else {
      status = "Completed";
    }

    const isReturn = txType === "Return";
    const isReturned = false;
    const returnFor =
      isReturn && completedReceipts.length > 0
        ? pickRandom(completedReceipts)
        : null;

    // Generate 1-5 items per transaction
    const numItems = 1 + Math.floor(Math.random() * 5);
    const txItems: (typeof txData)[0]["items"] = [];
    let grandTotal = 0;

    for (let j = 0; j < numItems; j++) {
      const prod = pickRandom(productRecords);
      const qty = 1 + Math.floor(Math.random() * 20);
      const total = round2(prod.sellingPrice * qty);
      const costPrice = round2(prod.unitPrice * (0.6 + Math.random() * 0.3));
      grandTotal += total;
      txItems.push({
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        unitPrice: prod.sellingPrice,
        totalPrice: total,
        costPrice,
      });
    }

    if (
      status === "Completed" &&
      (txType === "SaleWalkIn" || txType === "SalePO")
    ) {
      completedReceipts.push(receiptNum);
    }

    const delivery =
      txType === "Restock" ? "WalkIn" : pickRandom(DELIVERY_METHODS);

    txData.push({
      receiptNumber: receiptNum,
      buyerName: buyer.name,
      buyerId: buyer.id,
      sellerId: seller.id,
      sellerName: seller.sellerName,
      transactionType: txType,
      deliveryMethod: delivery,
      transactionStatus: status,
      transactionDate: txDate,
      grandTotal: round2(grandTotal),
      paymentMethod:
        status === "Completed" ? pickRandom(PAYMENT_METHODS) : null,
      isReturned,
      returnForReceiptNumber: returnFor,
      items: txItems,
    });
  }

  // Insert transactions and items in batches
  const TX_BATCH = 50;
  let txInserted = 0;
  let itemInserted = 0;

  for (let i = 0; i < txData.length; i += TX_BATCH) {
    const batch = txData.slice(i, i + TX_BATCH);
    const txRows = batch.map((tx) => ({
      receiptNumber: tx.receiptNumber,
      buyerName: tx.buyerName,
      buyerId: tx.buyerId,
      sellerId: tx.sellerId,
      sellerName: tx.sellerName,
      transactionType: tx.transactionType as any,
      deliveryMethod: tx.deliveryMethod as any,
      transactionStatus: tx.transactionStatus as any,
      transactionDate: tx.transactionDate,
      grandTotal: tx.grandTotal,
      paymentMethod: tx.paymentMethod,
      isReturned: tx.isReturned,
      returnForReceiptNumber: tx.returnForReceiptNumber,
      createdAt: tx.transactionDate,
    }));

    const created = await prisma.transaction.createMany({ data: txRows });
    txInserted += created.count;

    // Now insert items for each transaction in this batch
    const createdTxs = await prisma.transaction.findMany({
      where: { receiptNumber: { in: batch.map((tx) => tx.receiptNumber) } },
      select: { id: true, receiptNumber: true },
    });
    const receiptToId = new Map(createdTxs.map((t) => [t.receiptNumber, t.id]));

    const itemRows: {
      transactionId: number;
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      costPrice: number;
    }[] = [];

    for (const tx of batch) {
      const txId = receiptToId.get(tx.receiptNumber);
      if (!txId) continue;
      for (const item of tx.items) {
        itemRows.push({
          transactionId: txId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          costPrice: item.costPrice,
        });
      }
    }

    if (itemRows.length > 0) {
      const createdItems = await prisma.transactionItem.createMany({
        data: itemRows,
      });
      itemInserted += createdItems.count;
    }

    process.stdout.write(
      `\r  transactions: ${Math.min(i + TX_BATCH, txData.length)}/${txData.length}`,
    );
  }
  console.log(`\n  -> ${txInserted} transactions, ${itemInserted} items`);

  // ── Audit Logs (500) ────────────────────────────────────────────
  console.log("Seeding 500 audit logs...");
  const panels = [
    "Inventory",
    "POS",
    "Categories",
    "Suppliers",
    "Brands",
    "Users",
    "Orders",
    "Buyers",
    "Finance",
    "Settings",
  ];
  const actions = [
    "Create Product",
    "Update Product",
    "Delete Product",
    "Create Category",
    "Update Category",
    "Delete Category",
    "Create Supplier",
    "Update Supplier",
    "Delete Supplier",
    "Create Brand",
    "Update Brand",
    "Delete Brand",
    "Checkout Transaction",
    "Cancel Transaction",
    "Process Return",
    "Update Buyer",
    "Create Buyer",
    "Login",
    "Logout",
    "Change Password",
    "Update Profile",
    "Export Data",
    "Import Data",
  ];
  const auditData: {
    sellerId: number;
    logTime: Date;
    successStatus: boolean;
    panel: string;
    action: string;
    details: string;
  }[] = [];

  for (let i = 0; i < 500; i++) {
    const seller = pickRandom(USERS);
    const panel = pickRandom(panels);
    const action = pickRandom(actions);
    const logTime = randomDate(new Date("2025-05-25"), new Date("2025-06-15"));
    const success = Math.random() < 0.92;
    const details = success
      ? `${action} successful`
      : `${action} failed: ${faker.hacker.phrase()}`;

    auditData.push({
      sellerId: seller.id,
      logTime,
      successStatus: success,
      panel,
      action,
      details,
    });
  }

  const AUDIT_BATCH = 100;
  for (let i = 0; i < auditData.length; i += AUDIT_BATCH) {
    const batch = auditData.slice(i, i + AUDIT_BATCH);
    await prisma.auditLog.createMany({
      data: batch.map((r) => ({
        sellerId: r.sellerId,
        logTime: r.logTime,
        successStatus: r.successStatus,
        panel: r.panel,
        action: r.action,
        details: r.details,
      })),
    });
    process.stdout.write(
      `\r  audit logs: ${Math.min(i + AUDIT_BATCH, auditData.length)}/${auditData.length}`,
    );
  }
  console.log("");

  // ── Reset AUTO_INCREMENT ─────────────────────────────────────────
  console.log("Resetting auto-increments...");
  const tableCols: [string, string][] = [
    ["users", "SELLER_ID"],
    ["suppliers", "SUPPLIER_ID"],
    ["products", "PRODUCT_ID"],
    ["categories", "CATEGORY_ID"],
    ["brands", "BRAND_ID"],
    ["transactions", "TRANSACTION_ID"],
    ["transaction_items", "ITEM_ID"],
    ["buyers", "BUYER_ID"],
    ["notifications", "NOTIFICATION_ID"],
    ["audit_log", "LOG_ID"],
  ];
  for (const [table, col] of tableCols) {
    const rows = await prisma.$queryRawUnsafe<{ max_id: bigint | null }[]>(
      `SELECT MAX(\`${col}\`) AS max_id FROM \`${table}\``,
    );
    const nextId = Number(rows[0]?.max_id ?? 0) + 1;
    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`${table}\` AUTO_INCREMENT = ${nextId}`,
    );
  }

  // ── Summary ──────────────────────────────────────────────────────
  console.log("\n=== Seed Complete ===");
  console.log(`  Users:      ${USERS.length}`);
  console.log(`  Categories: ${categoryRecords.length}`);
  console.log(`  Brands:     ${brandRecords.length}`);
  console.log(`  Suppliers:  ${supplierRecords.length}`);
  console.log(`  Products:   ${productRecords.length}`);
  console.log(`  Buyers:     ${buyerRecords.length}`);
  console.log(`  Transactions: ${txInserted}`);
  console.log(`  Items:        ${itemInserted}`);
  console.log(`  Notifications: ${notifData.length}`);
  console.log(`  Audit Logs:   ${auditData.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
