const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

async function main() {
  console.log("Seeding database with realistic supply chain data...");

  // Clear existing records to ensure fresh demo state
  await db.traceabilityLog.deleteMany({});
  await db.auditLog.deleteMany({});
  await db.notification.deleteMany({});
  await db.feedback.deleteMany({});
  await db.locationUpdate.deleteMany({});
  await db.pickupVerification.deleteMany({});
  await db.deliveryVerification.deleteMany({});
  await db.delivery.deleteMany({});
  await db.match.deleteMany({});
  await db.donationRequest.deleteMany({});
  await db.foodDonation.deleteMany({});
  await db.distributor.deleteMany({});
  await db.ngo.deleteMany({});
  await db.foodProvider.deleteMany({});
  await db.user.deleteMany({});

  const passwordHash = await bcrypt.hash("Demo@1234", 10);

  // 1. Admin User
  const adminUser = await db.user.create({
    data: {
      name: "Elena Vance",
      email: "admin@foodchain.org",
      phone: "+1 555-0100",
      passwordHash,
      role: "ADMIN",
      accountStatus: "ACTIVE",
    },
  });

  // 2. Food Providers
  const provider1User = await db.user.create({
    data: {
      name: "Marco Rossi",
      email: "provider@abcrestaurant.com",
      phone: "+1 555-0121",
      passwordHash,
      role: "FOOD_PROVIDER",
      accountStatus: "ACTIVE",
    },
  });
  const provider1 = await db.foodProvider.create({
    data: {
      userId: provider1User.id,
      organizationName: "ABC Grand Restaurant",
      organizationType: "RESTAURANT",
      address: "142 Metro Central Plaza",
      city: "Metropolis",
      latitude: 28.6139,
      longitude: 77.2090,
      verificationStatus: "VERIFIED",
    },
  });

  const provider2User = await db.user.create({
    data: {
      name: "Sarah Jenkins",
      email: "greenleaf@hotel.com",
      phone: "+1 555-0122",
      passwordHash,
      role: "FOOD_PROVIDER",
      accountStatus: "ACTIVE",
    },
  });
  const provider2 = await db.foodProvider.create({
    data: {
      userId: provider2User.id,
      organizationName: "Green Leaf Luxury Hotel",
      organizationType: "HOTEL",
      address: "88 Orchid Boulevard",
      city: "Metropolis",
      latitude: 28.6304,
      longitude: 77.2177,
      verificationStatus: "VERIFIED",
    },
  });

  // 3. NGOs
  const ngo1User = await db.user.create({
    data: {
      name: "Ananya Sharma",
      email: "contact@helpinghands.org",
      phone: "+1 555-0150",
      passwordHash,
      role: "NGO",
      accountStatus: "ACTIVE",
    },
  });
  const ngo1 = await db.ngo.create({
    data: {
      userId: ngo1User.id,
      organizationName: "Helping Hands Community Food Bank",
      address: "450 Relief Drive, Sector 4",
      city: "Metropolis",
      latitude: 28.6250,
      longitude: 77.2180,
      foodCapacity: 450,
      availabilityStatus: "AVAILABLE",
      verificationStatus: "VERIFIED",
    },
  });

  const ngo2User = await db.user.create({
    data: {
      name: "Marcus Brody",
      email: "relief@foodsupport.org",
      phone: "+1 555-0151",
      passwordHash,
      role: "NGO",
      accountStatus: "ACTIVE",
    },
  });
  const ngo2 = await db.ngo.create({
    data: {
      userId: ngo2User.id,
      organizationName: "Food Support Foundation",
      address: "12 Hope Avenue",
      city: "Metropolis",
      latitude: 28.6410,
      longitude: 77.2300,
      foodCapacity: 600,
      availabilityStatus: "AVAILABLE",
      verificationStatus: "VERIFIED",
    },
  });

  // 4. Distributors
  const dist1User = await db.user.create({
    data: {
      name: "Rahul Kumar",
      email: "rahul.kumar@fooddist.com",
      phone: "+1 555-0180",
      passwordHash,
      role: "DISTRIBUTOR",
      accountStatus: "ACTIVE",
    },
  });
  const dist1 = await db.distributor.create({
    data: {
      userId: dist1User.id,
      vehicleType: "VAN",
      availabilityStatus: "BUSY",
      reliabilityScore: 4.9,
      totalDeliveries: 48,
    },
  });

  const dist2User = await db.user.create({
    data: {
      name: "Amit Sharma",
      email: "amit.sharma@logistics.com",
      phone: "+1 555-0181",
      passwordHash,
      role: "DISTRIBUTOR",
      accountStatus: "ACTIVE",
    },
  });
  const dist2 = await db.distributor.create({
    data: {
      userId: dist2User.id,
      vehicleType: "REFRIGERATED_TRUCK",
      availabilityStatus: "AVAILABLE",
      reliabilityScore: 5.0,
      totalDeliveries: 62,
    },
  });

  // 5. Donations
  // Donation 1: In-Transit (Active GPS)
  const don1 = await db.foodDonation.create({
    data: {
      humanReadableId: "DON-2026-0001",
      providerId: provider1.id,
      foodName: "Steamed Vegetable Biryani & Dal Makhani",
      foodCategory: "COOKED_MEALS",
      quantity: 35,
      unit: "KG",
      preparationTime: new Date(Date.now() - 2 * 3600 * 1000),
      expiryTime: new Date(Date.now() + 6 * 3600 * 1000),
      dietaryFlags: "VEG",
      storageRequirements: "ROOM_TEMP",
      notes: "Packed in sanitized food-grade containers.",
      status: "IN_TRANSIT",
    },
  });

  const del1 = await db.delivery.create({
    data: {
      donationId: don1.id,
      distributorId: dist1.id,
      ngoId: ngo1.id,
      providerId: provider1.id,
      status: "IN_TRANSIT",
      pickupEta: new Date(Date.now() - 30 * 60 * 1000),
      deliveryEta: new Date(Date.now() + 25 * 60 * 1000),
      startedAt: new Date(Date.now() - 25 * 60 * 1000),
    },
  });

  await db.pickupVerification.create({
    data: {
      deliveryId: del1.id,
      verifiedByUserId: dist1User.id,
      verificationCode: "4821",
      packageCondition: "GOOD",
      temperatureCheck: "62°C (Hot holding compliant)",
      notes: "Checked temperature and loaded safely.",
    },
  });

  // Recent GPS telemetry for Donation 1
  await db.locationUpdate.createMany({
    data: [
      {
        deliveryId: del1.id,
        distributorId: dist1.id,
        latitude: 28.6180,
        longitude: 77.2120,
        accuracy: 8,
        speed: 28,
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        deliveryId: del1.id,
        distributorId: dist1.id,
        latitude: 28.6210,
        longitude: 77.2150,
        accuracy: 6,
        speed: 24,
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        deliveryId: del1.id,
        distributorId: dist1.id,
        latitude: 28.6235,
        longitude: 77.2170,
        accuracy: 5,
        speed: 20,
        timestamp: new Date(),
      },
    ],
  });

  await db.traceabilityLog.createMany({
    data: [
      {
        donationId: don1.id,
        stage: "SUBMITTED",
        actor: provider1.organizationName,
        actorRole: "FOOD_PROVIDER",
        action: "Batch Registered & Submitted",
        description: "35 KG Vegetable Biryani registered with 6-hour consumption window.",
        location: `${provider1.address}, ${provider1.city}`,
        timestamp: new Date(Date.now() - 120 * 60 * 1000),
      },
      {
        donationId: don1.id,
        stage: "APPROVED",
        actor: adminUser.name,
        actorRole: "ADMIN",
        action: "Food Safety Verified & Approved",
        description: "Passed visual quality and hygiene holding verification.",
        timestamp: new Date(Date.now() - 90 * 60 * 1000),
      },
      {
        donationId: don1.id,
        stage: "ASSIGNED",
        actor: adminUser.name,
        actorRole: "ADMIN",
        action: "Distributor Dispatched",
        description: `Assigned to driver ${dist1User.name} for delivery to ${ngo1.organizationName}.`,
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        donationId: don1.id,
        stage: "PICKED_UP",
        actor: dist1User.name,
        actorRole: "DISTRIBUTOR",
        action: "Pickup Verified & Loaded",
        description: "Inspected holding temperature (62°C) and sealed packaging.",
        location: provider1.address,
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
      },
      {
        donationId: don1.id,
        stage: "IN_TRANSIT",
        actor: dist1User.name,
        actorRole: "DISTRIBUTOR",
        action: "Transit En Route with Live GPS",
        description: `Heading towards ${ngo1.organizationName}. Telemetry active.`,
        timestamp: new Date(Date.now() - 20 * 60 * 1000),
      },
    ],
  });

  // Donation 2: Completed Rescue with Feedback
  const don2 = await db.foodDonation.create({
    data: {
      humanReadableId: "DON-2026-0002",
      providerId: provider2.id,
      foodName: "Artisan Sourdough Breads & Croissants",
      foodCategory: "BAKERY",
      quantity: 25,
      unit: "KG",
      preparationTime: new Date(Date.now() - 24 * 3600 * 1000),
      expiryTime: new Date(Date.now() + 12 * 3600 * 1000),
      dietaryFlags: "VEGAN",
      storageRequirements: "ROOM_TEMP",
      notes: "Daily fresh baked surplus packaged in paper bags.",
      status: "COMPLETED",
    },
  });

  const del2 = await db.delivery.create({
    data: {
      donationId: don2.id,
      distributorId: dist2.id,
      ngoId: ngo2.id,
      providerId: provider2.id,
      status: "COMPLETED",
      startedAt: new Date(Date.now() - 5 * 3600 * 1000),
      completedAt: new Date(Date.now() - 4 * 3600 * 1000),
    },
  });

  await db.pickupVerification.create({
    data: {
      deliveryId: del2.id,
      verifiedByUserId: dist2User.id,
      verificationCode: "9102",
      packageCondition: "GOOD",
      notes: "Dry and clean bakery surplus.",
    },
  });

  await db.deliveryVerification.create({
    data: {
      deliveryId: del2.id,
      confirmedByUserId: ngo2User.id,
      receivedQuantity: 25,
      conditionStatus: "EXCELLENT",
      status: "CONFIRMED",
      notes: "Delivered immediately to evening community kitchen.",
      confirmedAt: new Date(Date.now() - 4 * 3600 * 1000),
    },
  });

  await db.feedback.create({
    data: {
      deliveryId: del2.id,
      ngoId: ngo2.id,
      distributorId: dist2.id,
      rating: 5,
      punctualityRating: 5,
      foodQualityRating: 5,
      handlingRating: 5,
      comment: "Driver Amit was extremely punctual and handled packages with care.",
    },
  });

  // Donation 3: Available for NGO Request
  await db.foodDonation.create({
    data: {
      humanReadableId: "DON-2026-0003",
      providerId: provider1.id,
      foodName: "Fresh Farm Organic Seasonal Vegetables",
      foodCategory: "PRODUCE",
      quantity: 60,
      unit: "KG",
      preparationTime: new Date(Date.now() - 6 * 3600 * 1000),
      expiryTime: new Date(Date.now() + 36 * 3600 * 1000),
      dietaryFlags: "VEGAN",
      storageRequirements: "ROOM_TEMP",
      notes: "Carrots, bell peppers, tomatoes, and greens.",
      status: "APPROVED",
    },
  });

  // Donation 4: Submitted (Awaiting Admin Review)
  await db.foodDonation.create({
    data: {
      humanReadableId: "DON-2026-0004",
      providerId: provider2.id,
      foodName: "Hotel Continental Buffet Surplus Trays",
      foodCategory: "COOKED_MEALS",
      quantity: 40,
      unit: "KG",
      preparationTime: new Date(Date.now() - 1 * 3600 * 1000),
      expiryTime: new Date(Date.now() + 8 * 3600 * 1000),
      dietaryFlags: "NON_VEG",
      storageRequirements: "REFRIGERATED",
      notes: "Chilled chicken pasta and roast potatoes in aluminum containers.",
      status: "SUBMITTED",
    },
  });

  // Initial Audit Logs
  await db.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        actorRole: "ADMIN",
        action: "SYSTEM_INITIALIZED",
        entity: "SYSTEM",
        entityId: "SYSTEM",
        timestamp: new Date(Date.now() - 24 * 3600 * 1000),
      },
      {
        userId: provider1User.id,
        actorRole: "FOOD_PROVIDER",
        action: "DONATION_SUBMITTED",
        entity: "FOOD_DONATION",
        entityId: don1.id,
        timestamp: new Date(Date.now() - 2 * 3600 * 1000),
      },
      {
        userId: adminUser.id,
        actorRole: "ADMIN",
        action: "DONATION_APPROVED",
        entity: "FOOD_DONATION",
        entityId: don1.id,
        timestamp: new Date(Date.now() - 90 * 60 * 1000),
      },
      {
        userId: dist1User.id,
        actorRole: "DISTRIBUTOR",
        action: "PICKUP_VERIFIED",
        entity: "DELIVERY",
        entityId: del1.id,
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
      },
    ],
  });

  console.log("Database seeded successfully with all roles, donations, deliveries, and audit trails!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });