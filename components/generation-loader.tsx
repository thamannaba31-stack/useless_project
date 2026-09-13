"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { icon: "👀", text: "Checking the vibe..." },
  { icon: "🧠", text: "Reading the room..." },
  { icon: "😂", text: "Finding the perfect Malayalam reaction..." },
  { icon: "✨", text: "Creating your meme..." },
];

interface GenerationLoaderProps {
  photoPreview: string;
  step?: number; // 0-3 override
}

export function GenerationLoader({ photoPreview, step: stepProp }: GenerationLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (stepProp !== undefined) {
      setCurrentStep(stepProp);
      return;
    }
    // Auto-cycle through steps
    const timers = [
      setTimeout(() => setCurrentStep(1), 1200),
      setTimeout(() => setCurrentStep(2), 2800),
      setTimeout(() => setCurrentStep(3), 4500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [stepProp]);

  const step = STEPS[currentStep];

  return (
    <div className="loader-wrapper">
      <div className="loader-photo-frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoPreview}
          alt="Your uploaded photo"
          className="loader-photo"
        />
        <div className="loader-overlay" />
        <div className="loader-pulse-ring" />
      </div>

      <div className="loader-status">
        <span className="loader-emoji">{step.icon}</span>
        <p className="loader-text">{step.text}</p>
      </div>

      <div className="loader-dots">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`loader-dot ${i === currentStep ? "active" : i < currentStep ? "done" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
