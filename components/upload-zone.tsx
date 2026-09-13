"use client";

import { useCallback, useState } from "react";
import { Upload, ImageIcon } from "lucide-react";

interface UploadZoneProps {
  onFileSelected: (file: File, preview: string) => void;
}

export function UploadZone({ onFileSelected }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndProcess = (file: File) => {
    setError(null);
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Please upload a PNG, JPG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      onFileSelected(file, e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndProcess(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndProcess(file);
  };

  return (
    <div className="upload-zone-wrapper">
      <label
        htmlFor="photo-upload"
        className={`upload-zone ${isDragging ? "dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="upload-icon-ring">
          {isDragging ? (
            <ImageIcon size={40} className="upload-icon" />
          ) : (
            <Upload size={40} className="upload-icon" />
          )}
        </div>
        <p className="upload-title">
          {isDragging ? "Drop it here! 🎯" : "Drop your photo here"}
        </p>
        <p className="upload-sub">or click to browse</p>
        <span className="upload-hint">PNG, JPG, WebP · Max 10 MB</span>
        <input
          id="photo-upload"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="sr-only"
          onChange={handleFileInput}
        />
      </label>
      {error && <p className="upload-error">{error}</p>}
    </div>
  );
}
