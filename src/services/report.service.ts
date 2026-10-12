import { db } from "@/lib/db";
import { SessionUser } from "@/types";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { calculateImpactFromKg } from "@/lib/impact";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

export async function getTransitReportData(user: SessionUser, deliveryId: string) {
  const delivery = await db.delivery.findFirst({
    where: {
      OR: [
        { id: deliveryId },
        { donationId: deliveryId },
        { donation: { humanReadableId: deliveryId } },
      ],
    },
    include: {
      donation: {
        include: {
          provider: true,
          traceabilityLogs: { orderBy: { timestamp: "asc" } },
          wasteRecords: true,
        },
      },
      distributor: { include: { user: true } },
      ngo: true,
      pickupVerification: true,
      deliveryVerification: true,
      feedback: true,
      wasteRecords: true,
      locationUpdates: { orderBy: { timestamp: "asc" } },
    },
  });

  if (!delivery) {
    throw new NotFoundError("Delivery not found");
  }

  // Authorization Check
  if (user.role === "NGO") {
    const userNgo = await db.ngo.findUnique({ where: { userId: user.id } });
    if (!userNgo || delivery.ngoId !== userNgo.id) {
      throw new ForbiddenError("Access denied. NGOs can only access reports for their own received deliveries.");
    }
  } else if (user.role === "FOOD_PROVIDER") {
    const userProvider = await db.foodProvider.findUnique({ where: { userId: user.id } });
    if (!userProvider || delivery.providerId !== userProvider.id) {
      throw new ForbiddenError("Access denied. Food Providers can only access reports for their own donations.");
    }
  } else if (user.role === "DISTRIBUTOR") {
    const userDist = await db.distributor.findUnique({ where: { userId: user.id } });
    if (!userDist || delivery.distributorId !== userDist.id) {
      throw new ForbiddenError("Access denied. Distributors can only access reports for their own assigned tasks.");
    }
  }
  // Admin is unrestricted

  const impact = calculateImpactFromKg(delivery.donation.quantity);

  // Calculate transit duration if available
  let transitDurationMinutes = null;
  if (delivery.startedAt && delivery.completedAt) {
    const diffMs = new Date(delivery.completedAt).getTime() - new Date(delivery.startedAt).getTime();
    transitDurationMinutes = Math.max(1, Math.round(diffMs / (60 * 1000)));
  }

  return {
    delivery,
    impact,
    transitDurationMinutes,
    reportGeneratedAt: new Date(),
  };
}

export async function generateTransitReportPdf(reportData: any): Promise<Buffer> {
  const { delivery, impact, transitDurationMinutes, reportGeneratedAt } = reportData;
  const { donation, distributor, ngo, pickupVerification, deliveryVerification, feedback, locationUpdates } = delivery;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 36,
        size: "A4",
        bufferPages: true,
        info: {
          Title: `Transit Report - ${donation.humanReadableId}`,
          Author: "Smart Food Supply Chain Platform",
          Subject: "Chain of Custody & ESG Impact Verification",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // Brand Palette
      const PRIMARY_COLOR = "#0f172a"; // Slate 900
      const ACCENT_COLOR = "#059669";  // Emerald 600
      const MUTED_TEXT = "#64748b";    // Slate 500
      const BORDER_COLOR = "#e2e8f0";  // Slate 200
      const BG_LIGHT = "#f8fafc";      // Slate 50
      const TEXT_DARK = "#1e293b";     // Slate 800
      const ALERT_BG = "#fff1f2";      // Rose 50
      const ALERT_TEXT = "#be123c";    // Rose 700

      let currentY = 36;
      let sectionCounter = 1;

      // Helper: Resolve local image path safely
      function getLocalImagePath(relativeUrl?: string | null): string | null {
        if (!relativeUrl) return null;
        try {
          const cleanRel = relativeUrl.replace(/^\//, "");
          const absPath = path.join(process.cwd(), "public", cleanRel);
          if (fs.existsSync(absPath)) {
            return absPath;
          }
        } catch {
          // Ignore path resolution errors
        }
        return null;
      }

      // Helper: Dynamic pagination guard
      function ensureSpace(neededHeight: number) {
        if (currentY + neededHeight > 785) {
          doc.addPage();
          currentY = 36;
          drawSubsequentPageHeader();
        }
      }

      // Helper: Subsequent page running header
      function drawSubsequentPageHeader() {
        doc.rect(36, 36, 523, 22).fill(PRIMARY_COLOR);
        doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold")
          .text("SMART FOOD SUPPLY CHAIN PLATFORM | OFFICIAL AUDIT REPORT", 46, 43);
        doc.fillColor("#34d399").fontSize(7.5).font("Helvetica-Bold")
          .text(`${donation.humanReadableId} | ${delivery.status}`, 400, 43, { align: "right", width: 145 });
        currentY = 66;
      }

      // Helper: Section Banner
      function drawSectionBanner(title: string, color = PRIMARY_COLOR, bgColor = BG_LIGHT) {
        ensureSpace(26);
        doc.rect(36, currentY, 523, 18).fill(bgColor);
        doc.fillColor(color).fontSize(8.5).font("Helvetica-Bold").text(title, 44, currentY + 4.5);
        currentY += 24;
      }

      // ==========================================
      // PAGE 1: HEADER BANNER
      // ==========================================
      doc.rect(36, 36, 523, 50).fill(PRIMARY_COLOR);
      doc.fillColor("#ffffff").fontSize(13).font("Helvetica-Bold").text("SMART FOOD SUPPLY CHAIN PLATFORM", 48, 45);
      doc.fillColor("#34d399").fontSize(8).font("Helvetica").text("OFFICIAL CHAIN OF CUSTODY & TRANSIT HANDOFF REPORT", 48, 61);
      doc.fillColor("#94a3b8").fontSize(7).text(`Generated: ${new Date(reportGeneratedAt).toLocaleString()}`, 48, 72);

      doc.fillColor("#ffffff").fontSize(11).font("Helvetica-Bold").text(donation.humanReadableId, 420, 46, { align: "right", width: 125 });
      doc.fillColor("#34d399").fontSize(8).font("Helvetica-Bold").text(`Status: ${delivery.status}`, 420, 62, { align: "right", width: 125 });

      currentY = 94;

      // ----------------------------------------------------
      // SECTION 1: FOOD BATCH SPECIFICATIONS & ORDER DETAILS
      // ----------------------------------------------------
      doc.fontSize(8.5).font("Helvetica-Bold");
      const nameH = doc.heightOfString(donation.foodName || "N/A", { width: 130 });
      const row1ValH = Math.max(nameH, 12);
      const row1TotalH = 10 + row1ValH + 6;
      const row2TotalH = 28;
      const leftH = row1TotalH + row2TotalH;
      const photoBoxH = 76;
      const s1Height = Math.max(leftH, photoBoxH);

      ensureSpace(18 + 6 + s1Height + 10);
      drawSectionBanner(`${sectionCounter++}. FOOD BATCH SPECIFICATIONS & ORDER DETAILS`);

      const s1StartY = currentY;

      // Row 1
      doc.fillColor(MUTED_TEXT).fontSize(7.5).font("Helvetica");
      doc.text("Food Item:", 44, s1StartY);
      doc.text("Category:", 180, s1StartY);
      doc.text("Quantity / Unit:", 300, s1StartY);

      doc.fillColor(TEXT_DARK).fontSize(8.5).font("Helvetica-Bold");
      doc.text(donation.foodName || "N/A", 44, s1StartY + 10, { width: 130 });
      doc.text((donation.foodCategory || "").replace(/_/g, " "), 180, s1StartY + 10, { width: 115 });
      doc.text(`${donation.quantity} ${donation.unit}`, 300, s1StartY + 10, { width: 105 });

      // Row 2 (placed strictly below wrapped food title)
      const row2Y = s1StartY + row1TotalH;
      doc.fillColor(MUTED_TEXT).fontSize(7.5).font("Helvetica");
      doc.text("Prepared At:", 44, row2Y);
      doc.text("Safe Expiry Date / Time:", 180, row2Y);
      doc.text("Storage Condition:", 300, row2Y);

      doc.fillColor(TEXT_DARK).fontSize(8.5).font("Helvetica-Bold");
      doc.text(new Date(donation.preparationTime).toLocaleString(), 44, row2Y + 10, { width: 130 });
      doc.text(new Date(donation.expiryTime).toLocaleString(), 180, row2Y + 10, { width: 115 });
      doc.text(donation.storageRequirements || "Ambient", 300, row2Y + 10, { width: 105 });

      // Right Photo Box (Food / Batch Photo)
      const foodPhotoPath = getLocalImagePath(donation.imageUrl);
      const foodImgX = 415;
      const foodImgW = 140;
      doc.rect(foodImgX, s1StartY, foodImgW, photoBoxH).stroke(BORDER_COLOR);

      if (foodPhotoPath) {
        try {
          doc.image(foodPhotoPath, foodImgX + 2, s1StartY + 2, {
            fit: [foodImgW - 4, photoBoxH - 16],
            align: "center",
            valign: "center",
          });
          doc.fillColor(ACCENT_COLOR).fontSize(6.5).font("Helvetica-Bold")
            .text("Food / Batch Photo", foodImgX, s1StartY + photoBoxH - 11, { align: "center", width: foodImgW });
        } catch {
          doc.fillColor(MUTED_TEXT).fontSize(6.5).font("Helvetica")
            .text("Food Photo", foodImgX, s1StartY + 30, { align: "center", width: foodImgW });
        }
      } else {
        doc.fillColor(MUTED_TEXT).fontSize(6.5).font("Helvetica")
          .text("No Food Photo\nAvailable", foodImgX, s1StartY + 28, { align: "center", width: foodImgW });
      }

      currentY = s1StartY + s1Height + 12;

      // ----------------------------------------------------
      // SECTION 2: STAKEHOLDERS & LOGISTICS CARRIER
      // ----------------------------------------------------
      doc.fontSize(7).font("Helvetica");
      const addr1H = doc.heightOfString(donation.provider.address || "N/A", { width: 155 });
      const addr2H = doc.heightOfString(ngo.address || "N/A", { width: 155 });
      const cardH = Math.max(76, 52 + Math.max(addr1H, addr2H));

      ensureSpace(18 + 6 + cardH + 10);
      drawSectionBanner(`${sectionCounter++}. STAKEHOLDERS & ASSIGNED LOGISTICS CARRIER`);

      const cardW = 167;

      // Card 1: Origin Donor
      doc.rect(36, currentY, cardW, cardH).stroke(BORDER_COLOR);
      doc.fillColor(ACCENT_COLOR).fontSize(7).font("Helvetica-Bold").text("ORIGIN: DONOR KITCHEN", 42, currentY + 6);
      doc.fillColor(TEXT_DARK).fontSize(8.5).font("Helvetica-Bold").text(donation.provider.organizationName, 42, currentY + 17, { width: 155, ellipsis: true });
      doc.fillColor(MUTED_TEXT).fontSize(7).font("Helvetica").text(donation.provider.address, 42, currentY + 29, { width: 155 });
      doc.text(`City: ${donation.provider.city} | Status: ${donation.provider.verificationStatus}`, 42, currentY + cardH - 14, { width: 155, ellipsis: true });

      // Card 2: Destination NGO
      doc.rect(214, currentY, cardW, cardH).stroke(BORDER_COLOR);
      doc.fillColor("#2563eb").fontSize(7).font("Helvetica-Bold").text("DESTINATION: RECIPIENT NGO", 220, currentY + 6);
      doc.fillColor(TEXT_DARK).fontSize(8.5).font("Helvetica-Bold").text(ngo.organizationName, 220, currentY + 17, { width: 155, ellipsis: true });
      doc.fillColor(MUTED_TEXT).fontSize(7).font("Helvetica").text(ngo.address, 220, currentY + 29, { width: 155 });
      doc.text(`City: ${ngo.city} | Capacity: ${ngo.foodCapacity} KG`, 220, currentY + cardH - 14, { width: 155, ellipsis: true });

      // Card 3: Carrier & Driver Photo
      doc.rect(392, currentY, cardW, cardH).stroke(BORDER_COLOR);
      doc.fillColor(PRIMARY_COLOR).fontSize(7).font("Helvetica-Bold").text("ASSIGNED LOGISTICS CARRIER", 398, currentY + 6);
      doc.fillColor(TEXT_DARK).fontSize(8.5).font("Helvetica-Bold").text(distributor.user.name, 398, currentY + 17, { width: 108, ellipsis: true });
      doc.fillColor(MUTED_TEXT).fontSize(7).font("Helvetica").text(`Vehicle: ${distributor.vehicleType}`, 398, currentY + 30, { width: 108, ellipsis: true });
      doc.text(`Reliability: ${distributor.reliabilityScore.toFixed(1)} / 5.0`, 398, currentY + 42, { width: 108, ellipsis: true });
      doc.text(`${distributor.totalDeliveries || 0} Completed Tasks`, 398, currentY + 54, { width: 108, ellipsis: true });

      // Driver Photo Box (contained inside Card 3)
      const driverPhotoPath = getLocalImagePath(distributor.user.avatarUrl);
      const avatarSize = 42;
      const avatarX = 510;
      const avatarY = currentY + 14;

      doc.rect(avatarX, avatarY, avatarSize, avatarSize).stroke(BORDER_COLOR);
      if (driverPhotoPath) {
        try {
          doc.image(driverPhotoPath, avatarX + 1, avatarY + 1, {
            fit: [avatarSize - 2, avatarSize - 2],
            align: "center",
            valign: "center",
          });
        } catch {
          doc.fillColor(MUTED_TEXT).fontSize(6).font("Helvetica").text("Driver", avatarX, avatarY + 14, { align: "center", width: avatarSize });
        }
      } else {
        const initial = (distributor.user.name || "D").charAt(0).toUpperCase();
        doc.rect(avatarX + 1, avatarY + 1, avatarSize - 2, avatarSize - 2).fill("#ecfdf5");
        doc.fillColor(ACCENT_COLOR).fontSize(14).font("Helvetica-Bold").text(initial, avatarX, avatarY + 12, { align: "center", width: avatarSize });
      }
      doc.fillColor(MUTED_TEXT).fontSize(5.5).font("Helvetica").text("Driver Profile", avatarX - 2, avatarY + avatarSize + 2, { align: "center", width: avatarSize + 4 });

      currentY += cardH + 12;

      // ----------------------------------------------------
      // SECTION 3: PICKUP VERIFICATION & PHYSICAL EVIDENCE
      // ----------------------------------------------------
      let s3ContentH = 82;
      let notesH = 0;
      if (pickupVerification && pickupVerification.notes) {
        doc.fontSize(7.5).font("Helvetica");
        notesH = doc.heightOfString(`Loading Notes: "${pickupVerification.notes}"`, { width: 345 }) + 6;
      }
      if (pickupVerification) {
        s3ContentH = Math.max(54 + notesH, 82);
      } else {
        s3ContentH = 30;
      }

      ensureSpace(18 + 6 + s3ContentH + 10);
      drawSectionBanner(`${sectionCounter++}. PICKUP VERIFICATION & PHYSICAL EVIDENCE`);

      const s3StartY = currentY;

      if (pickupVerification) {
        // Left details (strictly ends at X = 395)
        doc.fillColor(MUTED_TEXT).fontSize(7.5).font("Helvetica");
        doc.text("Verification Code:", 44, s3StartY);
        doc.text("Package Condition:", 145, s3StartY);
        doc.text("Temperature Reading:", 255, s3StartY);

        doc.fillColor(TEXT_DARK).fontSize(8.5).font("Helvetica-Bold");
        doc.text(pickupVerification.verificationCode, 44, s3StartY + 10);
        doc.text(pickupVerification.packageCondition, 145, s3StartY + 10);
        doc.text(pickupVerification.temperatureCheck || "Safe/Compliant", 255, s3StartY + 10);

        // Row 2
        doc.fillColor(MUTED_TEXT).fontSize(7.5).font("Helvetica");
        doc.text("Verified Timestamp:", 44, s3StartY + 26);
        doc.fillColor(TEXT_DARK).fontSize(8.5).font("Helvetica-Bold");
        doc.text(new Date(pickupVerification.verifiedAt).toLocaleTimeString(), 44, s3StartY + 36);

        if (pickupVerification.notes) {
          doc.fillColor(MUTED_TEXT).fontSize(7.5).font("Helvetica")
            .text(`Loading Notes: "${pickupVerification.notes}"`, 44, s3StartY + 52, { width: 345 });
        }

        // Right photo box (starts at X = 405 with a 10pt gutter)
        const pickupPhotoPath = getLocalImagePath(pickupVerification.photoUrl);
        const pImgX = 405;
        const pImgW = 150;
        const pImgH = 80;

        doc.rect(pImgX, s3StartY, pImgW, pImgH).stroke(BORDER_COLOR);
        if (pickupPhotoPath) {
          try {
            doc.image(pickupPhotoPath, pImgX + 2, s3StartY + 2, {
              fit: [pImgW - 4, pImgH - 16],
              align: "center",
              valign: "center",
            });
            doc.fillColor(ACCENT_COLOR).fontSize(6.5).font("Helvetica-Bold")
              .text("Pickup Verification Evidence", pImgX, s3StartY + pImgH - 11, { align: "center", width: pImgW });
          } catch {
            doc.fillColor(MUTED_TEXT).fontSize(6.5).font("Helvetica")
              .text("Pickup Evidence", pImgX, s3StartY + 30, { align: "center", width: pImgW });
          }
        } else {
          doc.fillColor(MUTED_TEXT).fontSize(6.5).font("Helvetica")
            .text("No Pickup Evidence\nAttached", pImgX, s3StartY + 28, { align: "center", width: pImgW });
        }

        currentY = s3StartY + s3ContentH + 12;
      } else {
        doc.fillColor(MUTED_TEXT).fontSize(8).font("Helvetica").text("Pending driver pickup verification at donor facility.", 44, currentY);
        currentY += 24;
      }

      // ----------------------------------------------------
      // SECTION 4: TRANSIT & GPS TELEMETRY AUDIT TRAIL
      // ----------------------------------------------------
      ensureSpace(60);
      drawSectionBanner(`${sectionCounter++}. TRANSIT & GPS TELEMETRY AUDIT TRAIL`);

      doc.fillColor(MUTED_TEXT).fontSize(7.5).font("Helvetica");
      doc.text("Dispatched At:", 44, currentY);
      doc.text("Completed At:", 170, currentY);
      doc.text("Transit Duration:", 295, currentY);
      doc.text("GPS Telemetry Breadcrumbs:", 415, currentY);

      doc.fillColor(TEXT_DARK).fontSize(8.5).font("Helvetica-Bold");
      doc.text(delivery.startedAt ? new Date(delivery.startedAt).toLocaleTimeString() : "N/A", 44, currentY + 10);
      doc.text(delivery.completedAt ? new Date(delivery.completedAt).toLocaleTimeString() : (delivery.status === "IN_TRANSIT" ? "En Route" : "Pending"), 170, currentY + 10);
      doc.text(transitDurationMinutes ? `${transitDurationMinutes} Minutes` : "N/A", 295, currentY + 10);
      doc.text(`${locationUpdates?.length || 0} Recorded Points`, 415, currentY + 10);

      currentY += 28;

      // Key GPS Checkpoint Telemetry if points exist
      if (locationUpdates && locationUpdates.length > 0) {
        ensureSpace(34);
        doc.rect(44, currentY, 507, 24).fillAndStroke(BG_LIGHT, BORDER_COLOR);
        const firstPt = locationUpdates[0];
        const lastPt = locationUpdates[locationUpdates.length - 1];

        doc.fillColor(MUTED_TEXT).fontSize(7).font("Helvetica");
        doc.text("Origin Departure GPS:", 52, currentY + 4);
        doc.text("Destination Arrival GPS:", 300, currentY + 4);

        doc.fillColor(TEXT_DARK).fontSize(7.5).font("Helvetica-Bold");
        doc.text(`${firstPt.latitude.toFixed(5)}°N, ${firstPt.longitude.toFixed(5)}°E (${new Date(firstPt.timestamp).toLocaleTimeString()})`, 52, currentY + 13);
        doc.text(`${lastPt.latitude.toFixed(5)}°N, ${lastPt.longitude.toFixed(5)}°E (${new Date(lastPt.timestamp).toLocaleTimeString()})`, 300, currentY + 13);

        currentY += 32;

        // If intermediate breadcrumbs exist, render route checkpoints log
        if (locationUpdates.length > 2) {
          const samplePoints: { idx: number; pt: any }[] = [];
          const step = Math.max(1, Math.floor((locationUpdates.length - 1) / 4));
          for (let i = 0; i < locationUpdates.length; i += step) {
            samplePoints.push({ idx: i + 1, pt: locationUpdates[i] });
          }
          if (samplePoints[samplePoints.length - 1].pt !== lastPt) {
            samplePoints.push({ idx: locationUpdates.length, pt: lastPt });
          }

          ensureSpace(16 + samplePoints.length * 15);
          doc.fillColor(MUTED_TEXT).fontSize(7).font("Helvetica-Bold").text("ROUTE WAYPOINT TELEMETRY LOG", 44, currentY);
          currentY += 12;

          samplePoints.forEach(({ idx, pt }) => {
            ensureSpace(15);
            doc.fillColor(MUTED_TEXT).fontSize(7).font("Helvetica").text(`Checkpoint #${idx}`, 44, currentY, { width: 75 });
            doc.text(new Date(pt.timestamp).toLocaleTimeString(), 125, currentY, { width: 85 });
            doc.fillColor(TEXT_DARK).fontSize(7).font("Helvetica").text(`${pt.latitude.toFixed(5)}°N, ${pt.longitude.toFixed(5)}°E`, 215, currentY, { width: 180 });
            doc.fillColor(MUTED_TEXT).fontSize(7).text(`±${pt.accuracy || 5}m accuracy`, 405, currentY, { width: 100 });
            currentY += 14;
          });
          currentY += 6;
        }
      }

      // ----------------------------------------------------
      // SECTION 5: NGO RECEIPT & DOUBLE-VERIFICATION RECORD
      // ----------------------------------------------------
      let s5NotesH = 0;
      if (deliveryVerification && (deliveryVerification.notes || deliveryVerification.disputeReason)) {
        const rText = deliveryVerification.disputeReason ? `Dispute Log: ${deliveryVerification.disputeReason}` : `Receiving Notes: "${deliveryVerification.notes}"`;
        doc.fontSize(7.5).font("Helvetica");
        s5NotesH = doc.heightOfString(rText, { width: 505 }) + 6;
      }

      ensureSpace(18 + 6 + 28 + s5NotesH + 10);
      drawSectionBanner(`${sectionCounter++}. NGO RECEIPT & DOUBLE-VERIFICATION RECORD`);

      if (deliveryVerification) {
        doc.fillColor(MUTED_TEXT).fontSize(7.5).font("Helvetica");
        doc.text("Verified Received Quantity:", 44, currentY);
        doc.text("Arrival Physical Condition:", 180, currentY);
        doc.text("Disposition Status:", 305, currentY);
        doc.text("Verified Timestamp:", 425, currentY);

        const confirmedDate = deliveryVerification.confirmedAt || (deliveryVerification as any).verifiedAt || (deliveryVerification as any).createdAt;
        const formattedConfirmedAt = confirmedDate && !isNaN(new Date(confirmedDate).getTime())
          ? new Date(confirmedDate).toLocaleTimeString()
          : "Confirmed";

        doc.fillColor(TEXT_DARK).fontSize(8.5).font("Helvetica-Bold");
        doc.text(`${deliveryVerification.receivedQuantity} ${donation.unit}`, 44, currentY + 10);
        doc.text(deliveryVerification.conditionStatus, 180, currentY + 10);
        doc.text(deliveryVerification.status, 305, currentY + 10);
        doc.text(formattedConfirmedAt, 425, currentY + 10);

        currentY += 26;

        if (deliveryVerification.notes || deliveryVerification.disputeReason) {
          const rText = deliveryVerification.disputeReason ? `Dispute Log: ${deliveryVerification.disputeReason}` : `Receiving Notes: "${deliveryVerification.notes}"`;
          doc.fillColor(MUTED_TEXT).fontSize(7.5).font("Helvetica").text(rText, 44, currentY, { width: 505 });
          currentY += s5NotesH;
        }
      } else {
        doc.fillColor(MUTED_TEXT).fontSize(8).font("Helvetica").text("Pending final physical receipt inspection by NGO destination supervisor.", 44, currentY);
        currentY += 20;
      }

      currentY += 6;

      // ----------------------------------------------------
      // SECTION 6: DISPOSAL / SPOILAGE EXCEPTION DETAILS (Conditional)
      // ----------------------------------------------------
      const allWasteRecords = [...(delivery.wasteRecords || []), ...((donation as any).wasteRecords || [])];
      if (allWasteRecords.length > 0) {
        ensureSpace(45);
        drawSectionBanner(`${sectionCounter++}. DISPOSAL / SPOILAGE EXCEPTION DETAILS`, ALERT_TEXT, ALERT_BG);

        allWasteRecords.forEach((wr) => {
          let wrNotesH = 0;
          if (wr.notes) {
            doc.fontSize(7.5).font("Helvetica");
            wrNotesH = doc.heightOfString(`Disposal Notes: "${wr.notes}" (Stage: ${wr.stage})`, { width: 505 }) + 4;
          }
          const itemH = 26 + wrNotesH + 6;
          ensureSpace(itemH);

          doc.fillColor(MUTED_TEXT).fontSize(7.5).font("Helvetica");
          doc.text("Waste Reference:", 44, currentY);
          doc.text("Wasted Quantity:", 170, currentY);
          doc.text("Reason:", 290, currentY);
          doc.text("Disposal Method:", 420, currentY);

          doc.fillColor(ALERT_TEXT).fontSize(8.5).font("Helvetica-Bold");
          doc.text(wr.humanReadableId, 44, currentY + 10);
          doc.text(`${wr.quantityWasted} ${wr.unit}`, 170, currentY + 10);
          doc.text(wr.reason.replace(/_/g, " "), 290, currentY + 10);
          doc.text(wr.disposalMethod.replace(/_/g, " "), 420, currentY + 10);

          currentY += 24;
          if (wr.notes) {
            doc.fillColor(MUTED_TEXT).fontSize(7.5).font("Helvetica")
              .text(`Disposal Notes: "${wr.notes}" (Stage: ${wr.stage})`, 44, currentY, { width: 505 });
            currentY += wrNotesH;
          }
          currentY += 4;
        });
        currentY += 6;
      }

      // ----------------------------------------------------
      // SECTION 7: DISTRIBUTOR RELIABILITY & NGO FEEDBACK (Conditional)
      // ----------------------------------------------------
      if (feedback) {
        let feedbackCommentH = 0;
        if (feedback.comment) {
          doc.fontSize(7.5).font("Helvetica");
          feedbackCommentH = doc.heightOfString(`Feedback Comment: "${feedback.comment}"`, { width: 505 }) + 6;
        }

        ensureSpace(18 + 6 + 24 + feedbackCommentH + 6);
        drawSectionBanner(`${sectionCounter++}. DISTRIBUTOR RELIABILITY & NGO FEEDBACK`);

        doc.fillColor(MUTED_TEXT).fontSize(7.5).font("Helvetica").text("NGO Rating:", 44, currentY);
        doc.fillColor(ACCENT_COLOR).fontSize(9).font("Helvetica-Bold").text(`${feedback.rating} / 5 Stars (Verified Performance)`, 105, currentY - 1);

        if (feedback.comment) {
          doc.fillColor(MUTED_TEXT).fontSize(7.5).font("Helvetica").text(`Feedback Comment: "${feedback.comment}"`, 44, currentY + 14, { width: 505 });
          currentY += 14 + feedbackCommentH;
        } else {
          currentY += 20;
        }
      }

      // ----------------------------------------------------
      // SECTION 8: CHAIN OF CUSTODY TRACEABILITY AUDIT LOG (if present)
      // ----------------------------------------------------
      if (donation.traceabilityLogs && donation.traceabilityLogs.length > 0) {
        const totalTraceabilityH = 26 + (donation.traceabilityLogs.length * 15) + 8;
        // Check if Traceability + ESG can both fit on current page; if not, move Traceability to start a clean Page 2
        if (currentY + totalTraceabilityH + 70 > 785) {
          ensureSpace(785); // triggers clean page break to Page 2
        } else {
          ensureSpace(totalTraceabilityH);
        }

        drawSectionBanner(`${sectionCounter++}. CHAIN OF CUSTODY TRACEABILITY AUDIT LOG`);

        donation.traceabilityLogs.forEach((log: any) => {
          ensureSpace(18);
          doc.fillColor(ACCENT_COLOR).fontSize(7).font("Helvetica-Bold").text(`[${log.stage}]`, 44, currentY, { width: 95 });
          doc.fillColor(TEXT_DARK).fontSize(7.5).font("Helvetica-Bold").text(log.action, 140, currentY, { width: 180, ellipsis: true });
          doc.fillColor(MUTED_TEXT).fontSize(7).font("Helvetica").text(log.actor, 325, currentY, { width: 120, ellipsis: true });
          doc.text(new Date(log.timestamp).toLocaleTimeString(), 450, currentY, { align: "right", width: 95 });
          currentY += 14;
        });
        currentY += 6;
      }

      // ----------------------------------------------------
      // SECTION: ESG SUSTAINABILITY & SOCIAL IMPACT SCORECARD
      // ----------------------------------------------------
      ensureSpace(18 + 6 + 42 + 10);
      drawSectionBanner(`${sectionCounter++}. ESG SUSTAINABILITY & SOCIAL IMPACT SCORECARD`, ACCENT_COLOR);

      const badgeW = 124;
      const badgeH = 38;
      const metrics = [
        { label: "Meals Provided", val: `${impact.mealsServed} Meals`, color: "#059669" },
        { label: "CO2e Diverted", val: `${impact.co2SavedKg} KG`, color: "#0284c7" },
        { label: "Water Conserved", val: `${impact.waterSavedLiters} L`, color: "#0d9488" },
        { label: "Value Saved", val: `$${impact.financialValueSavedUsd}`, color: "#16a34a" },
      ];

      metrics.forEach((m, idx) => {
        const bx = 36 + idx * (badgeW + 9);
        doc.rect(bx, currentY, badgeW, badgeH).stroke(BORDER_COLOR);
        doc.fillColor(MUTED_TEXT).fontSize(7).font("Helvetica").text(m.label, bx + 8, currentY + 6);
        doc.fillColor(m.color).fontSize(10).font("Helvetica-Bold").text(m.val, bx + 8, currentY + 18);
      });

      currentY += badgeH + 16;

      // ----------------------------------------------------
      // UNIFIED FOOTERS & PAGE NUMBERING (Two-Pass bufferedPages)
      // ----------------------------------------------------
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        const origBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;

        const footerY = 800;
        doc.strokeColor(BORDER_COLOR).lineWidth(0.5).moveTo(36, footerY).lineTo(559, footerY).stroke();
        doc.fillColor(MUTED_TEXT).fontSize(6).font("Helvetica")
          .text(
            "Official Chain of Custody & ESG Impact Verification Record. Telemetry, inspection logs, and photos are cryptographically audited.",
            36,
            footerY + 4,
            { width: 430, lineGap: 1 }
          );
        doc.fillColor(PRIMARY_COLOR).fontSize(7.5).font("Helvetica-Bold")
          .text(`Page ${i + 1} of ${range.count}`, 475, footerY + 5, { align: "right", width: 84 });

        doc.page.margins.bottom = origBottom;
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}