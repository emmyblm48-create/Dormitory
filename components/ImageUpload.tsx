"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ImageUploadProps {
  bucket: string;
  pathPrefix?: string;
  value?: string | null;
  onChange: (publicUrl: string | null) => void;
  cameraCapture?: boolean;
  label?: string;
}

export function ImageUpload({
  bucket,
  pathPrefix = "",
  value,
  onChange,
  cameraCapture = true,
  label = "แตะเพื่อถ่ายรูป / เลือกรูปภาพ",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setPreview(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${pathPrefix ? pathPrefix.replace(/\/+$/, "") + "/" : ""}${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err: any) {
      setError(err.message || "อัปโหลดรูปไม่สำเร็จ");
      setPreview(value ?? null);
      onChange(null);
    } finally {
      setIsUploading(false);
    }
  };

  const clear = () => {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        {...(cameraCapture ? { capture: "environment" as const } : {})}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {preview ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden glass-panel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
          {isUploading && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="animate-spin text-white" size={28} />
            </div>
          )}
          {!isUploading && (
            <button
              type="button"
              onClick={clear}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full aspect-video rounded-xl border-2 border-dashed border-brand-300/60 bg-white/40 backdrop-blur-md hover:bg-white/60 flex flex-col items-center justify-center gap-2 text-brand-500 transition-colors"
        >
          <Camera size={28} />
          <span className="text-sm font-medium">{label}</span>
        </button>
      )}

      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
}
