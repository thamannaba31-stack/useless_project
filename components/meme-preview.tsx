"use client";

import { useState, useCallback } from "react";
import { Download, RefreshCw, ImagePlus, ZoomIn, ZoomOut, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import { CaptionEditor } from "./caption-editor";
import type { MemeMetadata } from "@/lib/meme-selector";

interface MemePreviewProps {
  memeUrl: string;
  caption: string;
  photoFile: File;
  selectedMeme: MemeMetadata;
  onTryAnother: () => void;
  onCreateAnother: () => void;
  onRecompose: (overrides: {
    caption?: string;
    photoOffsetX?: number;
    photoOffsetY?: number;
    photoZoom?: number;
    reactionImagePath?: string;
  }) => Promise<void>;
  isRecomposing: boolean;
  photoOffsetX: number;
  photoOffsetY: number;
  photoZoom: number;
}

const PAN_STEP = 60;
const ZOOM_STEP = 0.15;

export function MemePreview({
  memeUrl,
  caption,
  photoFile,
  selectedMeme,
  onTryAnother,
  onCreateAnother,
  onRecompose,
  isRecomposing,
  photoOffsetX,
  photoOffsetY,
  photoZoom,
}: MemePreviewProps) {
  const [localOffsetX, setLocalOffsetX] = useState(photoOffsetX);
  const [localOffsetY, setLocalOffsetY] = useState(photoOffsetY);
  const [localZoom, setLocalZoom] = useState(photoZoom);

  const handleCaptionUpdate = useCallback(
    (newCaption: string) => {
      onRecompose({
        caption: newCaption,
        photoOffsetX: localOffsetX,
        photoOffsetY: localOffsetY,
        photoZoom: localZoom,
      });
    },
    [onRecompose, localOffsetX, localOffsetY, localZoom]
  );

  const pan = (dx: number, dy: number) => {
    const newX = localOffsetX + dx;
    const newY = localOffsetY + dy;
    setLocalOffsetX(newX);
    setLocalOffsetY(newY);
    onRecompose({
      caption,
      photoOffsetX: newX,
      photoOffsetY: newY,
      photoZoom: localZoom,
    });
  };

  const zoom = (factor: number) => {
    const newZoom = Math.max(0.5, Math.min(3.0, localZoom + factor));
    setLocalZoom(newZoom);
    onRecompose({
      caption,
      photoOffsetX: localOffsetX,
      photoOffsetY: localOffsetY,
      photoZoom: newZoom,
    });
  };

  const downloadAs = (format: "png" | "jpg") => {
    const link = document.createElement("a");
    link.href = memeUrl;
    link.download = `malayalam-meme-${Date.now()}.${format}`;
    link.click();
  };

  return (
    <div className="preview-wrapper">
      {/* Meme Image */}
      <div className="meme-canvas-wrapper">
        {isRecomposing && (
          <div className="meme-recomposing-overlay">
            <div className="spinner-lg" />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={memeUrl}
          alt="Generated Malayalam meme"
          className="meme-canvas"
          id="generated-meme-image"
        />
      </div>

      {/* Caption Editor */}
      <CaptionEditor
        caption={caption}
        onUpdate={handleCaptionUpdate}
        isUpdating={isRecomposing}
      />

      {/* Photo Controls */}
      <div className="photo-controls">
        <span className="photo-controls-label">📸 Adjust Photo</span>
        <div className="photo-controls-grid">
          <button
            className="ctrl-btn"
            onClick={() => zoom(ZOOM_STEP)}
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <button
            className="ctrl-btn"
            onClick={() => pan(0, -PAN_STEP)}
            title="Pan up"
          >
            <ArrowUp size={16} />
          </button>
          <button
            className="ctrl-btn"
            onClick={() => zoom(-ZOOM_STEP)}
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            className="ctrl-btn"
            onClick={() => pan(-PAN_STEP, 0)}
            title="Pan left"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            className="ctrl-btn"
            onClick={() => pan(0, PAN_STEP)}
            title="Pan down"
          >
            <ArrowDown size={16} />
          </button>
          <button
            className="ctrl-btn"
            onClick={() => pan(PAN_STEP, 0)}
            title="Pan right"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="preview-actions">
        <button
          className="btn-primary btn-download"
          onClick={() => downloadAs("png")}
          id="download-png-btn"
        >
          <Download size={18} />
          Download PNG
        </button>
        <button
          className="btn-secondary btn-download-jpg"
          onClick={() => downloadAs("jpg")}
          id="download-jpg-btn"
        >
          <Download size={18} />
          Download JPG
        </button>
        <button
          className="btn-secondary"
          onClick={onTryAnother}
          disabled={isRecomposing}
          id="try-another-btn"
        >
          <RefreshCw size={18} />
          Try Another Reaction
        </button>
        <button
          className="btn-ghost"
          onClick={onCreateAnother}
          id="create-another-btn"
        >
          <ImagePlus size={18} />
          Create Another Meme
        </button>
      </div>

      <div className="meme-meta">
        <span className="meme-meta-tag">
          🎭 {selectedMeme.description}
        </span>
      </div>
    </div>
  );
}
