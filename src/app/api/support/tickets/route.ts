import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storePrivateObject } from "@/lib/object-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const issueTypeValues = [
  "Product problem",
  "Order problem",
  "Delivery problem",
  "Warranty issue",
  "Payment issue",
  "Account issue",
  "Other",
] as const;

const MAX_ATTACHMENTS = 5;

const ticketSchema = z.object({
  issueType: z.enum(issueTypeValues),
  subject: z
    .string()
    .trim()
    .min(1, "Please add a subject for this support request.")
    .max(160, "Subject must be shorter than 160 characters."),
  description: z
    .string()
    .trim()
    .min(20, "Please provide more detail about the issue.")
    .max(4000, "Description is too long."),
  productTrackingNumber: z.string().trim().optional().or(z.literal("")),
  serialNumber: z.string().trim().optional().or(z.literal("")),
  orderNumber: z.string().trim().optional().or(z.literal("")),
  attachmentNotes: z.string().trim().optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Please sign in to report an issue." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Please sign in to report an issue." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const rawValues = {
      issueType: formData.get("issueType"),
      subject: formData.get("subject"),
      description: formData.get("description"),
      productTrackingNumber: formData.get("productTrackingNumber"),
      serialNumber: formData.get("serialNumber"),
      orderNumber: formData.get("orderNumber"),
      attachmentNotes: formData.get("attachmentNotes"),
    };

    const parsed = ticketSchema.safeParse(rawValues);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid support request." },
        { status: 400 }
      );
    }

    const files = Array.from(formData.getAll("files")).filter(
      (value): value is File => value instanceof File && value.size > 0
    );

    if (files.length > MAX_ATTACHMENTS) {
      return NextResponse.json(
        { error: `Please upload no more than ${MAX_ATTACHMENTS} files.` },
        { status: 400 }
      );
    }

    const {
      issueType,
      subject,
      description,
      productTrackingNumber,
      serialNumber,
      orderNumber,
      attachmentNotes,
    } = parsed.data;

    const order = orderNumber
      ? await prisma.order.findFirst({
          where: {
            orderNumber: orderNumber.trim(),
            userId: user.id,
          },
          select: { id: true },
        })
      : null;

    const details = [
      description.trim(),
      productTrackingNumber?.trim()
        ? `Product tracking number: ${productTrackingNumber.trim()}`
        : null,
      serialNumber?.trim() ? `Serial number: ${serialNumber.trim()}` : null,
      orderNumber?.trim() ? `Order number: ${orderNumber.trim()}` : null,
      attachmentNotes?.trim()
        ? `Attachment / evidence: ${attachmentNotes.trim()}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const ticketNumber = `EY-TKT-${Date.now().toString().slice(-8)}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        id: crypto.randomUUID(),
        ticketNumber,
        userId: user.id,
        orderId: order?.id ?? null,
        issueType,
        subject: subject.trim(),
        description: details,
        status: "OPEN",
        updatedAt: new Date(),
      },
      select: {
        id: true,
        ticketNumber: true,
        status: true,
      },
    });

    await prisma.supportStatusHistory.create({
      data: {
        id: crypto.randomUUID(),
        ticketId: ticket.id,
        toStatus: "OPEN",
        note: "Ticket created by customer from the Support & Care page.",
      },
    });

    for (const file of files) {
      const extension = file.name.includes(".")
        ? file.name.slice(file.name.lastIndexOf("."))
        : "";
      const key = `support-attachments/${ticket.id}/${crypto.randomUUID()}${extension}`;
      const fileBuffer = Buffer.from(await file.arrayBuffer());

      await storePrivateObject(
        key,
        fileBuffer,
        file.type || "application/octet-stream"
      );

      await prisma.supportAttachment.create({
        data: {
          id: crypto.randomUUID(),
          ticketId: ticket.id,
          fileUrl: key,
          fileName: file.name,
          fileType: file.type || null,
          fileSize: file.size || null,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          status: ticket.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[SUPPORT_TICKET_CREATE]", error);

    return NextResponse.json(
      { error: "Unable to submit your support request right now." },
      { status: 500 }
    );
  }
}
