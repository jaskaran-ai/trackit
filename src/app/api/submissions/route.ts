import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  const isAdmin = session.user.role === "admin";

  const submissions = await prisma.submission.findMany({
    where: {
      ...(isAdmin ? {} : { userId: session.user.id }),
      ...(type ? { type: type as any } : {}),
      ...(status ? { status: status as any } : {}),
      ...(priority ? { priority: priority as any } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      attachments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(submissions);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, title, description, priority, project, attachments } = body;

  if (!type || !title || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const submission = await prisma.submission.create({
    data: {
      type,
      title,
      description,
      priority: priority ?? "MEDIUM",
      project: project ?? "OTHER",
      userId: session.user.id,
      attachments: {
        create:
          attachments?.map((a: any) => ({
            fileName: a.fileName,
            fileUrl: a.fileUrl,
            fileSize: a.fileSize,
            mimeType: a.mimeType,
          })) ?? [],
      },
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      attachments: true,
    },
  });

  return NextResponse.json(submission, { status: 201 });
}
