import { db } from "@/lib/db";
import { NotificationType } from "@/types";

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = "INFO",
  link?: string
) {
  try {
    return await db.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    });
  } catch (err) {
    console.error("Failed to send notification:", err);
  }
}

export async function notifyAdmins(
  title: string,
  message: string,
  type: NotificationType = "INFO",
  link?: string
) {
  try {
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    for (const admin of admins) {
      await sendNotification(admin.id, title, message, type, link);
    }
  } catch (err) {
    console.error("Failed to notify admins:", err);
  }
}