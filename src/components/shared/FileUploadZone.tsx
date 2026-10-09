"use client";

import { FileDropzone, type FileDropzoneItem } from "@/components/arc/file-dropzone/file-dropzone";
import { useUploadThing } from "@/lib/uploadthing-client";
import { ACCEPTED_FILE_TYPES, MAX_FILES, MAX_FILE_SIZE } from "@/lib/utils";

const USE_UPLOADTHING = process.env.NEXT_PUBLIC_USE_UPLOADTHING === "true";

/** What the upload endpoint hands back, stored alongside a picked file. */
export interface UploadedAttachment {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  uploaded?: UploadedAttachment;
}

/** The `accept` map flattened to the comma-separated string the dropzone takes. */
const ACCEPT = Object.values(ACCEPTED_FILE_TYPES)
  .flat()
  .join(",");

const MAX_MB = Math.round(MAX_FILE_SIZE / 1024 / 1024);

export default function FileUploadZone({
  onFilesChange,
  files,
}: {
  onFilesChange: (files: UploadedFile[]) => void;
  files: UploadedFile[];
}) {
  // Always call the hook (React rules). Only reached when USE_UPLOADTHING is on.
  const { startUpload } = useUploadThing("submissionAttachments", {
    onUploadError: (err) => console.error("UploadThing error:", err),
  });

  /* Arc owns the file list and the drag target, and reports progress per file.
     Each file is uploaded on its own so its row can show real progress; the
     endpoint takes one file under the same `files` field either way. */
  async function upload(
    item: FileDropzoneItem,
    options: { onProgress: (percent: number) => void; signal: AbortSignal },
  ) {
    const file = item.file;
    if (!file) return;

    const settle = (percent: number) => options.onProgress(percent);

    if (USE_UPLOADTHING) {
      const results = await startUpload([file]);
      const match = results?.find((r) => r.name === file.name);
      if (!match) throw new Error("Upload failed");

      const serverData = match.serverData as
        | { fileName: string; fileUrl: string; fileSize: number }
        | null;

      onFilesChange(
        files.map((f) =>
          f.id === item.id
            ? {
                ...f,
                uploaded: {
                  fileName: serverData?.fileName ?? match.name,
                  fileUrl: serverData?.fileUrl ?? match.ufsUrl,
                  fileSize: serverData?.fileSize ?? match.size,
                  mimeType: file.type,
                },
              }
            : f,
        ),
      );
      return;
    }

    const formData = new FormData();
    formData.append("files", file);

    settle(10);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      signal: options.signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Upload failed");

    const match = data.files.find(
      (uploaded: UploadedAttachment) => uploaded.fileName === file.name,
    );
    if (!match) throw new Error("Upload did not return the file");

    settle(100);
    onFilesChange(
      files.map((f) => (f.id === item.id ? { ...f, uploaded: match } : f)),
    );
  }

  /* Arc tracks its own rows; the page only needs the settled attachments, so
     the two are reconciled here rather than the page holding a parallel list. */
  function handleFilesChange(picked: File[]) {
    const previous = new Map(files.map((f) => [f.file.name, f]));
    onFilesChange(
      picked.map(
        (file) =>
          previous.get(file.name) ?? {
            id: `${file.name}-${file.size}-${file.lastModified}`,
            file,
            ...(file.type.startsWith("image/")
              ? { preview: URL.createObjectURL(file) }
              : {}),
          },
      ),
    );
  }

  return (
    <FileDropzone
      accept={ACCEPT}
      maxFiles={MAX_FILES}
      maxSize={MAX_FILE_SIZE}
      note={`PNG, JPG, GIF, PDF, TXT, MP4 · ${MAX_MB}MB each · ${MAX_FILES} files`}
      onUpload={upload}
      onFilesChange={handleFilesChange}
    />
  );
}