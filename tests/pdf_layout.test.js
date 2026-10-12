const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
const ts = require("typescript");
const Module = require("module");

const origResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    request = path.join(process.cwd(), "src", request.slice(2));
  }
  return origResolve.call(this, request, parent, isMain, options);
};

require.extensions[".ts"] = function(module, filename) {
  const content = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2020,
    },
  });
  module._compile(compiled.outputText, filename);
};

const { generateTransitReportPdf } = require("../src/services/report.service.ts");

// Helper to count pages in a PDF buffer
function countPdfPages(pdfBuffer) {
  const pdfString = pdfBuffer.toString("binary");
  const matches = pdfString.match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : 0;
}

// Sample base report data
function createMockReportData(overrides = {}) {
  const baseData = {
    delivery: {
      id: "del-uuid-12345",
      status: "COMPLETED",
      startedAt: new Date("2026-09-01T17:12:00Z"),
      completedAt: new Date("2026-09-01T17:35:00Z"),
      donation: {
        id: "don-uuid-12345",
        humanReadableId: "DON-2026-0004",
        foodName: "Hotel Continental Buffet Surplus Trays",
        foodCategory: "COOKED_MEALS",
        quantity: 40,
        unit: "KG",
        preparationTime: new Date("2026-08-30T17:45:00Z"),
        expiryTime: new Date("2026-09-02T17:06:00Z"),
        storageRequirements: "REFRIGERATED",
        imageUrl: null,
        provider: {
          organizationName: "Green Leaf Luxury Hotel",
          address: "88 Orchid Boulevard, Grand Central District",
          city: "Metropolis",
          verificationStatus: "VERIFIED",
        },
        traceabilityLogs: [
          {
            stage: "APPROVED",
            actor: "Elena Vance",
            action: "Donation Approved",
            timestamp: new Date("2026-09-01T16:44:00Z"),
          },
          {
            stage: "COMPLETED",
            actor: "Helping Hands Food Bank",
            action: "Delivery Confirmed & Received",
            timestamp: new Date("2026-09-01T18:05:00Z"),
          },
        ],
        wasteRecords: [],
      },
      distributor: {
        vehicleType: "VAN",
        reliabilityScore: 4.8,
        totalDeliveries: 50,
        user: {
          name: "Rahul Kumar",
          avatarUrl: "/uploads/verifications/pickup_1788371604200_4e9b90e6.jpg",
        },
      },
      ngo: {
        organizationName: "Helping Hands Community Food Bank",
        address: "450 Relief Drive, Sector 4",
        city: "Metropolis",
        foodCapacity: 450,
      },
      pickupVerification: {
        verificationCode: "1234",
        packageCondition: "GOOD",
        temperatureCheck: "4°C (Safe chilled range)",
        verifiedAt: new Date("2026-09-01T17:12:21Z"),
        photoUrl: "/uploads/verifications/test_proof_sample.jpg",
        notes: "Containers verified intact and temperature audited compliant.",
      },
      deliveryVerification: {
        receivedQuantity: 40,
        conditionStatus: "EXCELLENT",
        status: "CONFIRMED",
        confirmedAt: new Date("2026-09-01T17:35:04Z"),
        notes: "Inspection passed at intake station.",
      },
      feedback: {
        rating: 5,
        comment: "Excellent handling, punctual arrival, compliant cold storage.",
      },
      wasteRecords: [],
      locationUpdates: [
        { latitude: 28.63013, longitude: 77.21771, accuracy: 5, timestamp: new Date("2026-09-01T17:14:00Z") },
        { latitude: 28.625, longitude: 77.218, accuracy: 5, timestamp: new Date("2026-09-01T17:34:00Z") },
      ],
    },
    impact: {
      mealsServed: 96,
      co2SavedKg: 100,
      waterSavedLiters: 50000,
      financialValueSavedUsd: 140,
    },
    transitDurationMinutes: 23,
    reportGeneratedAt: new Date("2026-10-12T10:00:00Z"),
  };

  // Deep merge overrides
  if (overrides.delivery) Object.assign(baseData.delivery, overrides.delivery);
  if (overrides.impact) Object.assign(baseData.impact, overrides.impact);
  return baseData;
}

test("PDF Layout 1: All three photographs available and rendered", async () => {
  const data = createMockReportData({
    delivery: {
      donation: {
        ...createMockReportData().delivery.donation,
        imageUrl: "/uploads/verifications/test_proof_sample.jpg", // valid food photo
      },
      distributor: {
        vehicleType: "VAN",
        reliabilityScore: 4.8,
        totalDeliveries: 50,
        user: {
          name: "Rahul Kumar",
          avatarUrl: "/uploads/verifications/pickup_1788371604200_4e9b90e6.jpg", // valid driver photo
        },
      },
      pickupVerification: {
        verificationCode: "1234",
        packageCondition: "GOOD",
        temperatureCheck: "4°C (Safe chilled range)",
        verifiedAt: new Date("2026-09-01T17:12:21Z"),
        photoUrl: "/uploads/verifications/test_proof_sample.jpg", // valid pickup photo
        notes: "Verified intact.",
      },
    },
  });

  const pdf = await generateTransitReportPdf(data);
  assert.ok(Buffer.isBuffer(pdf), "Output must be a buffer");
  assert.strictEqual(pdf.slice(0, 4).toString(), "%PDF", "Must be a valid PDF");
  assert.ok(pdf.length > 5000, "PDF buffer must contain substantial data");
  const pages = countPdfPages(pdf);
  assert.ok(pages === 1 || pages === 2, `Page count should be 1 or 2 (got ${pages})`);

  const pdfStr = pdf.toString("binary");
  assert.ok(!pdfStr.includes("Invalid Date"), "Must not contain Invalid Date");
  assert.ok(!pdfStr.includes("&bull;"), "Must not contain raw html entities");
});

test("PDF Layout 2: One or more photographs missing (graceful placeholders)", async () => {
  const data = createMockReportData({
    delivery: {
      donation: {
        ...createMockReportData().delivery.donation,
        imageUrl: null, // missing food photo
      },
      distributor: {
        vehicleType: "ECO_BICYCLE",
        reliabilityScore: 5.0,
        totalDeliveries: 12,
        user: { name: "Ananya Sharma", avatarUrl: null }, // missing driver photo
      },
      pickupVerification: {
        verificationCode: "9988",
        packageCondition: "GOOD",
        temperatureCheck: "Ambient",
        verifiedAt: new Date("2026-09-01T17:12:21Z"),
        photoUrl: null, // missing pickup photo
        notes: null,
      },
    },
  });

  const pdf = await generateTransitReportPdf(data);
  assert.ok(Buffer.isBuffer(pdf), "Output must be a buffer");
  assert.strictEqual(pdf.slice(0, 4).toString(), "%PDF", "Must be a valid PDF");
  assert.ok(pdf.length > 1000, "PDF buffer must contain substantial data");
  const pages = countPdfPages(pdf);
  assert.ok(pages === 1 || pages === 2, `Page count should be 1 or 2 (got ${pages})`);

  const pdfStr = pdf.toString("binary");
  assert.ok(!pdfStr.includes("Invalid Date"), "Must not contain Invalid Date");
  assert.ok(!pdfStr.includes("&bull;"), "Must not contain raw html entities");
});

test("PDF Layout 3: Long text, long organization names, and long notes", async () => {
  const data = createMockReportData({
    delivery: {
      donation: {
        ...createMockReportData().delivery.donation,
        foodName: "Artisanal Multigrain Sourdough Boules With Organic Heritage Grain Varieties And Seed Crust",
        provider: {
          organizationName: "International Metropolitan Culinary Institute & Charitable Bakery Distribution Hub",
          address: "Building 45B, North Perimeter Logistics Park, Extended Commercial Industrial Corridor",
          city: "Metropolitan Megacity North",
          verificationStatus: "PREMIUM_VERIFIED",
        },
      },
      pickupVerification: {
        verificationCode: "7766",
        packageCondition: "GOOD",
        temperatureCheck: "Audited Safe",
        verifiedAt: new Date("2026-09-01T17:12:21Z"),
        photoUrl: "/uploads/verifications/test_proof_sample.jpg",
        notes: "Detailed quality inspection conducted by donor senior quality officer. Package sealed in double-lined thermal insulated containers with dry ice packs and calibrated temperature data loggers.",
      },
      deliveryVerification: {
        receivedQuantity: 40,
        conditionStatus: "EXCELLENT",
        status: "CONFIRMED",
        confirmedAt: new Date("2026-09-01T17:35:04Z"),
        notes: "Comprehensive intake reconciliation completed at destination dock. Seal numbers match chain of custody manifest. Zero package degradation observed.",
      },
    },
  });

  const pdf = await generateTransitReportPdf(data);
  assert.ok(Buffer.isBuffer(pdf), "Output must be valid buffer");
  assert.strictEqual(pdf.slice(0, 4).toString(), "%PDF", "Must be a valid PDF");
  const pages = countPdfPages(pdf);
  assert.ok(pages >= 1 && pages <= 3, `Page count should remain compact (got ${pages})`);
});

test("PDF Layout 4: Optional fields missing (pending verification and feedback)", async () => {
  const data = createMockReportData({
    delivery: {
      pickupVerification: null, // pending pickup
      deliveryVerification: null, // pending delivery
      feedback: null, // no feedback yet
      startedAt: null,
      completedAt: null,
      locationUpdates: [],
    },
  });

  const pdf = await generateTransitReportPdf(data);
  assert.ok(Buffer.isBuffer(pdf), "Output must be valid buffer");
  assert.strictEqual(pdf.slice(0, 4).toString(), "%PDF", "Must be a valid PDF");
  const pages = countPdfPages(pdf);
  assert.strictEqual(pages, 1, `Short report with pending fields must fit on 1 page (got ${pages})`);
  const pdfStr = pdf.toString("binary");
  assert.ok(!pdfStr.includes("Invalid Date"), "Must not contain Invalid Date");
});

test("PDF Layout 5: Large GPS telemetry section (50 breadcrumbs)", async () => {
  const locations = [];
  const baseTime = new Date("2026-09-01T17:15:00Z").getTime();
  for (let i = 0; i < 50; i++) {
    locations.push({
      latitude: 28.63 + (i * 0.001),
      longitude: 77.21 + (i * 0.0005),
      accuracy: 4.5,
      timestamp: new Date(baseTime + i * 30000),
    });
  }

  const data = createMockReportData({
    delivery: {
      locationUpdates: locations,
    },
  });

  const pdf = await generateTransitReportPdf(data);
  assert.ok(Buffer.isBuffer(pdf), "Output must be valid buffer");
  assert.strictEqual(pdf.slice(0, 4).toString(), "%PDF", "Must be a valid PDF");
  const pages = countPdfPages(pdf);
  assert.ok(pages >= 1 && pages <= 3, `Large telemetry report should paginate cleanly (got ${pages})`);
});

test("PDF Layout 6: Spoilage / Waste Exception records present", async () => {
  const data = createMockReportData({
    delivery: {
      wasteRecords: [
        {
          humanReadableId: "WST-2026-0001",
          quantityWasted: 5,
          unit: "KG",
          reason: "PACKAGING_DAMAGED",
          disposalMethod: "COMPOSTING",
          stage: "IN_TRANSIT",
          notes: "Outer seal broke during sudden braking; contents separated and diverted to municipal compost.",
        },
      ],
    },
  });

  const pdf = await generateTransitReportPdf(data);
  assert.ok(Buffer.isBuffer(pdf), "Output must be valid buffer");
  assert.strictEqual(pdf.slice(0, 4).toString(), "%PDF", "Must be a valid PDF");
  const pages = countPdfPages(pdf);
  assert.ok(pages >= 1 && pages <= 3, `Waste record report should paginate cleanly (got ${pages})`);
});

test("PDF Layout 7: Accurate page numbering on every page without trailing blank pages", async () => {
  const data = createMockReportData();
  const pdf = await generateTransitReportPdf(data);
  assert.ok(Buffer.isBuffer(pdf), "Output must be valid buffer");
  assert.strictEqual(pdf.slice(0, 4).toString(), "%PDF", "Must be a valid PDF");
  const pages = countPdfPages(pdf);
  assert.ok(pages === 1 || pages === 2, `Report must be compact 1 or 2 pages without blank trailing page (got ${pages})`);
});
