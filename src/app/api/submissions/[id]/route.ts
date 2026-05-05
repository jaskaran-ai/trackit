import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import path from "path";
import fs from "fs/promises";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      attachments: true,
    },
  });

  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "admin";
  const isOwner = submission.userId === session.user.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(submission);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "admin";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { status, priority } = body;

  const submission = await prisma.submission.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      attachments: true,
    },
  });

  return NextResponse.json(submission);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "admin";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // Delete local attachments from disk
  const attachments = await prisma.attachment.findMany({ where: { submissionId: id } });
  for (const att of attachments) {
    try {
      const filePath = path.join(process.cwd(), "public", att.fileUrl);
      await fs.unlink(filePath);
    } catch {
      // ignore missing files
    }
  }

  await prisma.submission.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
