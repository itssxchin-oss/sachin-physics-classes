"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ImageUploadInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  helperText?: string;
  folder?: string;
}

export default function ImageUploadInput({
  label,
  value,
  onChange,
  placeholder = "https://example.com/thumbnail.jpg",
  helperText = "Upload an image file (PNG, JPG, WEBP) or paste an image URL.",
  folder = "thumbnails",
}: ImageUploadInputProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mode, setMode] = useState<"file" | "url">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size should be less than 5MB.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // 1. Try uploading to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { data: uploadData, error: storageError } = await supabase.storage
        .from("thumbnails")
        .upload(filePath, file, { upsert: true });

      if (!storageError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from("thumbnails")
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          onChange(publicUrlData.publicUrl);
          setUploading(false);
          return;
        }
      }

      // 2. Fallback: Convert to Base64 data URL if storage bucket fails or isn't set up
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onChange(result);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      // Fallback to base64 reader
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onChange(result);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-200">
          {label}
        </label>
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              mode === "file"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              mode === "url"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Image URL
          </button>
        </div>
      </div>

      {value ? (
        /* Image Preview State */
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/20 bg-slate-900 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Thumbnail preview"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRemove}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all"
            >
              <X className="w-4 h-4" /> Remove Thumbnail
            </button>
          </div>
        </div>
      ) : mode === "file" ? (
        /* Dropzone / File Picker */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative border-2 border-dashed border-white/20 hover:border-blue-500/50 bg-white/5 hover:bg-white/[0.07] rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              {uploading ? (
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                {uploading ? "Uploading thumbnail..." : "Click to select or drag thumbnail image"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                PNG, JPG, WEBP up to 5MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Image URL input */
        <div className="relative">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-red-400">{uploadError}</p>
      )}

      {helperText && (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      )}
    </div>
  );
}
