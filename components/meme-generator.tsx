"use client";

import { useState, useCallback } from "react";
import { UploadZone } from "./upload-zone";
import { GenerationLoader } from "./generation-loader";
import { MemePreview } from "./meme-preview";
import {
  selectBestMeme,
  selectNextMeme,
  type MemeMetadata,
} from "@/lib/meme-selector";
import memesData from "@/data/memes.json";

type Screen = "upload" | "generating" | "result";

interface AnalysisResult {
  mood: string;
  tags: string[];
  caption: string;
}

const memes = memesData as MemeMetadata[];

export function MemeGenerator() {
  const [screen, setScreen] = useState<Screen>("upload");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedMeme, setSelectedMeme] = useState<MemeMetadata | null>(null);
  const [memeUrl, setMemeUrl] = useState<string>("");
  const [caption, setCaption] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isRecomposing, setIsRecomposing] = useState(false);
  const [photoOffsetX, setPhotoOffsetX] = useState(0);
  const [photoOffsetY, setPhotoOffsetY] = useState(0);
  const [photoZoom, setPhotoZoom] = useState(1.0);

  const handleFileSelected = useCallback(
    (file: File, preview: string) => {
      setPhotoFile(file);
      setPhotoPreview(preview);
    },
    []
  );

  const handleMakeMeme = useCallback(async () => {
    if (!photoFile) return;
    setError(null);
    setScreen("generating");

    try {
      // Step 1: Analyze photo with OpenAI
      const analyzeForm = new FormData();
      analyzeForm.append("image", photoFile);

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        body: analyzeForm,
      });

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json();
        throw new Error(err.error || "Analysis failed");
      }

      const analysis: AnalysisResult = await analyzeRes.json();
      setAnalysisResult(analysis);

      // Step 2: Select best meme from local library
      const best = selectBestMeme(analysis.tags, memes);
      setSelectedMeme(best);
      setCaption(analysis.caption);

      // Step 3: Compose the meme
      await compose(photoFile, best, analysis.caption, 0, 0, 1.0);

      setScreen("result");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      setScreen("upload");
    }
  }, [photoFile]);

  const compose = async (
    file: File,
    meme: MemeMetadata,
    cap: string,
    offsetX: number,
    offsetY: number,
    zoom: number
  ) => {
    const composeForm = new FormData();
    composeForm.append("originalImage", file);
    composeForm.append("reactionImagePath", meme.file);
    composeForm.append("caption", cap);
    composeForm.append("photoOffsetX", String(offsetX));
    composeForm.append("photoOffsetY", String(offsetY));
    composeForm.append("photoZoom", String(zoom));

    const composeRes = await fetch("/api/compose", {
      method: "POST",
      body: composeForm,
    });

    if (!composeRes.ok) {
      const err = await composeRes.json();
      throw new Error(err.error || "Composition failed");
    }

    const blob = await composeRes.blob();
    const url = URL.createObjectURL(blob);
    setMemeUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const handleTryAnother = useCallback(async () => {
    if (!photoFile || !selectedMeme || !analysisResult) return;
    setIsRecomposing(true);
    try {
      const next = selectNextMeme(analysisResult.tags, memes, selectedMeme.id);
      setSelectedMeme(next);
      await compose(photoFile, next, caption, photoOffsetX, photoOffsetY, photoZoom);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to try another reaction");
    } finally {
      setIsRecomposing(false);
    }
  }, [photoFile, selectedMeme, analysisResult, caption, photoOffsetX, photoOffsetY, photoZoom]);

  const handleRecompose = useCallback(
    async (overrides: {
      caption?: string;
      photoOffsetX?: number;
      photoOffsetY?: number;
      photoZoom?: number;
      reactionImagePath?: string;
    }) => {
      if (!photoFile || !selectedMeme) return;
      setIsRecomposing(true);
      try {
        const newCaption = overrides.caption ?? caption;
        const newOffsetX = overrides.photoOffsetX ?? photoOffsetX;
        const newOffsetY = overrides.photoOffsetY ?? photoOffsetY;
        const newZoom = overrides.photoZoom ?? photoZoom;

        // Update state
        if (overrides.caption !== undefined) setCaption(overrides.caption);
        if (overrides.photoOffsetX !== undefined) setPhotoOffsetX(overrides.photoOffsetX);
        if (overrides.photoOffsetY !== undefined) setPhotoOffsetY(overrides.photoOffsetY);
        if (overrides.photoZoom !== undefined) setPhotoZoom(overrides.photoZoom);

        const memeToUse = overrides.reactionImagePath
          ? memes.find((m) => m.file === overrides.reactionImagePath) ?? selectedMeme
          : selectedMeme;

        await compose(photoFile, memeToUse, newCaption, newOffsetX, newOffsetY, newZoom);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Re-compose failed");
      } finally {
        setIsRecomposing(false);
      }
    },
    [photoFile, selectedMeme, caption, photoOffsetX, photoOffsetY, photoZoom]
  );

  const handleCreateAnother = useCallback(() => {
    setScreen("upload");
    setPhotoFile(null);
    setPhotoPreview("");
    setAnalysisResult(null);
    setSelectedMeme(null);
    setCaption("");
    setMemeUrl("");
    setError(null);
    setPhotoOffsetX(0);
    setPhotoOffsetY(0);
    setPhotoZoom(1.0);
  }, []);

  // ── Render ─────────────────────────────────────────────────
  if (screen === "generating") {
    return <GenerationLoader photoPreview={photoPreview} />;
  }

  if (screen === "result" && memeUrl && selectedMeme && photoFile) {
    return (
      <MemePreview
        memeUrl={memeUrl}
        caption={caption}
        photoFile={photoFile}
        selectedMeme={selectedMeme}
        onTryAnother={handleTryAnother}
        onCreateAnother={handleCreateAnother}
        onRecompose={handleRecompose}
        isRecomposing={isRecomposing}
        photoOffsetX={photoOffsetX}
        photoOffsetY={photoOffsetY}
        photoZoom={photoZoom}
      />
    );
  }

  const handleSelectSample = async (imagePath: string, sampleName: string) => {
    try {
      const res = await fetch(imagePath);
      const blob = await res.blob();
      const file = new File([blob], sampleName, { type: "image/jpeg" });
      handleFileSelected(file, imagePath);
    } catch (e) {
      console.error("Failed to load sample image:", e);
    }
  };

  // Upload screen
  return (
    <div className="upload-screen">
      <UploadZone onFileSelected={handleFileSelected} />

      {/* Quick Try Samples */}
      <div className="quick-samples-container">
        <p className="quick-samples-title">Or click a sample to try instantly:</p>
        <div className="quick-samples-list">
          <button
            type="button"
            className="sample-chip"
            onClick={() => handleSelectSample("/memes/meme01.jpg", "sample-confused.jpg")}
          >
            😲 Confused Look
          </button>
          <button
            type="button"
            className="sample-chip"
            onClick={() => handleSelectSample("/memes/meme02.jpg", "sample-angry.jpg")}
          >
            😠 Frustrated Reaction
          </button>
          <button
            type="button"
            className="sample-chip"
            onClick={() => handleSelectSample("/memes/meme03.jpg", "sample-laughing.jpg")}
          >
            😂 Pure Laughter
          </button>
          <button
            type="button"
            className="sample-chip"
            onClick={() => handleSelectSample("/memes/meme05.jpg", "sample-tired.jpg")}
          >
            😴 Exhausted Mood
          </button>
        </div>
      </div>

      {photoPreview && (
        <div className="photo-selected-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoPreview}
            alt="Selected photo preview"
            className="preview-thumb"
          />
          <div className="preview-info">
            <p className="preview-filename">{photoFile?.name}</p>
            <p className="preview-size">
              {photoFile ? (photoFile.size / 1024 / 1024).toFixed(2) : 0} MB
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      <button
        className="btn-make-meme"
        onClick={handleMakeMeme}
        disabled={!photoFile}
        id="make-meme-btn"
      >
        <span className="btn-emoji">😂</span>
        Make Meme
      </button>
    </div>
  );
}
