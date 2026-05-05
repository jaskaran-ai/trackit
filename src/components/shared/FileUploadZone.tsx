"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, Image, Film, File, Cloud, HardDrive } from "lucide-react";
import { cn, formatBytes, ACCEPTED_FILE_TYPES, MAX_FILE_SIZE, MAX_FILES } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing-client";

const USE_UPLOADTHING = process.env.NEXT_PUBLIC_USE_UPLOADTHING === "true";

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  uploaded?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  };
}

interface FileUploadZoneProps {
  onFilesChange: (files: UploadedFile[]) => void;
  files: UploadedFile[];
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <Image size={18} className="text-blue-400" />;
  if (mimeType.startsWith("video/")) return <Film size={18} className="text-violet-400" />;
  if (mimeType === "application/pdf") return <FileText size={18} className="text-red-400" />;
  return <File size={18} className="text-zinc-400" />;
}

export default function FileUploadZone({ onFilesChange, files }: FileUploadZoneProps) {
  const [uploading, setUploading] = useState(false);

  // Always call the hook (React rules) — only used when USE_UPLOADTHING is true
  const { startUpload } = useUploadThing("submissionAttachments", {
    onUploadError: (err) => console.error("UploadThing error:", err),
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const remaining = MAX_FILES - files.length;
      const toAdd = acceptedFiles.slice(0, remaining);
      if (toAdd.length === 0) return;

      const newFiles: UploadedFile[] = toAdd.map((file) => ({
        id: Math.random().toString(36).slice(2),
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      }));

      const combined = [...files, ...newFiles];
      onFilesChange(combined);
      setUploading(true);

      try {
        if (USE_UPLOADTHING) {
          // UploadThing upload
          const results = await startUpload(toAdd);
          if (!results) throw new Error("Upload failed");

          const updated = combined.map((f) => {
            const match = results.find((r) => r.name === f.file.name);
            if (!match) return f;
            const serverData = match.serverData as { fileName: string; fileUrl: string; fileSize: number } | null;
            return {
              ...f,
              uploaded: {
                fileName: serverData?.fileName ?? match.name,
                fileUrl: serverData?.fileUrl ?? match.ufsUrl,
                fileSize: serverData?.fileSize ?? match.size,
                mimeType: f.file.type,
              },
            };
          });
          onFilesChange(updated);
        } else {
          // Local upload
          const formData = new FormData();
          toAdd.forEach((f) => formData.append("files", f));

          const res = await fetch("/api/upload", { method: "POST", body: formData });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          const updated = combined.map((f) => {
            const match = data.files.find((u: any) => u.fileName === f.file.name);
            return match ? { ...f, uploaded: match } : f;
          });
          onFilesChange(updated);
        }
      } catch (err) {
        console.error("Upload failed:", err);
      } finally {
        setUploading(false);
      }
    },
    [files, onFilesChange, startUpload]
  );

  const removeFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES - files.length,
    disabled: files.length >= MAX_FILES || uploading,
  });

  return (
    <div className="space-y-3">
      {/* Provider indicator */}
      {USE_UPLOADTHING && (
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
          <Cloud size={10} className="text-violet-500" />
          Uploads via UploadThing
        </div>
      )}

      {/* Drop zone */}
      {files.length < MAX_FILES && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl px-6 py-8 text-center cursor-pointer transition-all",
            isDragActive
              ? "border-indigo-500 bg-indigo-500/5"
              : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50",
            (files.length >= MAX_FILES || uploading) && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
              <Upload size={18} className={isDragActive ? "text-indigo-400" : "text-zinc-500"} />
            </div>
            {uploading ? (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <div className="w-3 h-3 border border-zinc-600 border-t-indigo-400 rounded-full animate-spin" />
                Uploading…
              </div>
            ) : isDragActive ? (
              <div className="text-sm text-indigo-400 font-500">Drop files here</div>
            ) : (
              <>
                <div className="text-sm text-zinc-300 font-500">
                  Drop files or <span className="text-indigo-400">click to browse</span>
                </div>
                <div className="text-xs text-zinc-600">
                  PNG, JPG, GIF, PDF, TXT, MP4 · Max {MAX_FILE_SIZE / 1024 / 1024}MB ·{" "}
                  {MAX_FILES - files.length} remaining
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Rejections */}
      {fileRejections.length > 0 && (
        <div className="text-xs text-red-400 px-1">
          {fileRejections[0].errors[0].message}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5"
            >
              {f.preview ? (
                <img
                  src={f.preview}
                  alt={f.file.name}
                  className="w-9 h-9 rounded-md object-cover shrink-0"
                />
              ) : (
                <div className="w-9 h-9 bg-zinc-800 rounded-md flex items-center justify-center shrink-0">
                  <FileIcon mimeType={f.file.type} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">{f.file.name}</p>
                <p className="text-xs text-zinc-500">
                  {formatBytes(f.file.size)}
                  {f.uploaded ? (
                    <span className="ml-1.5 text-emerald-500">✓ Uploaded</span>
                  ) : uploading ? (
                    <span className="ml-1.5 text-zinc-600">Uploading…</span>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(f.id)}
                className="p-1 text-zinc-600 hover:text-red-400 transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
