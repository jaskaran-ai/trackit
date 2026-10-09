import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILES,
  MAX_FILE_SIZE,
} from "@/lib/utils";

/*
 * The limits and the accepted types come from the shared constants the dropzone
 * reads, so a file type added to the picker cannot be rejected here. They used
 * to be written out again in this file, which is how a client's "12MB allowed"
 * promise and the server's 10MB ceiling drifted apart.
 */
const ALLOWED_MIME_TYPES = new Set(Object.keys(ACCEPTED_FILE_TYPES));

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `At most ${MAX_FILES} files per submission` },
      { status: 400 },
    );
  }

  if (files.length > 5) {
    return NextResponse.json({ error: "Max 5 files allowed" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const uploaded = [];

  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} not allowed` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File ${file.name} exceeds 10MB limit` },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name);
    const uniqueName = `${randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    uploaded.push({
      fileName: file.name,
      fileUrl: `/uploads/${uniqueName}`,
      fileSize: file.size,
      mimeType: file.type,
    });
  }

  return NextResponse.json({ files: uploaded }, { status: 201 });
}
