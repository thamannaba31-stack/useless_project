"use client";

import { useState } from "react";
import { Edit3, Check, X } from "lucide-react";

interface CaptionEditorProps {
  caption: string;
  onUpdate: (newCaption: string) => void;
  isUpdating?: boolean;
}

export function CaptionEditor({
  caption,
  onUpdate,
  isUpdating,
}: CaptionEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(caption);

  const handleEdit = () => {
    setDraft(caption);
    setEditing(true);
  };

  const handleConfirm = () => {
    setEditing(false);
    onUpdate(draft);
  };

  const handleCancel = () => {
    setDraft(caption);
    setEditing(false);
  };

  return (
    <div className="caption-editor">
      <label className="caption-label">📝 Caption</label>
      {editing ? (
        <div className="caption-input-row">
          <textarea
            className="caption-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            maxLength={200}
            placeholder="Type Malayalam caption here..."
            dir="auto"
            autoFocus
          />
          <div className="caption-btn-row">
            <button
              className="btn-icon btn-confirm"
              onClick={handleConfirm}
              disabled={isUpdating}
              title="Update meme"
            >
              {isUpdating ? (
                <span className="spinner-sm" />
              ) : (
                <Check size={18} />
              )}
            </button>
            <button
              className="btn-icon btn-cancel"
              onClick={handleCancel}
              title="Cancel"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="caption-display-row">
          <p className="caption-display" dir="auto">
            {caption || <span className="caption-empty">No caption</span>}
          </p>
          <button
            className="btn-icon btn-edit"
            onClick={handleEdit}
            title="Edit caption"
          >
            <Edit3 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
