import { MemeGenerator } from "@/components/meme-generator";

export default function HomePage() {
  return (
    <main className="app-main">
      {/* Background effects */}
      <div className="bg-glow bg-glow-1" aria-hidden="true" />
      <div className="bg-glow bg-glow-2" aria-hidden="true" />
      <div className="bg-glow bg-glow-3" aria-hidden="true" />
      <div className="bg-grid" aria-hidden="true" />

      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <div className="logo-badge">AI</div>
          <div className="header-text">
            <h1 className="app-title">
              Malayalam Meme AI{" "}
              <span className="emoji-animate" aria-label="laughing emoji">
                😂
              </span>
            </h1>
            <p className="app-subtitle">
              Upload a photo. Let AI find the reaction.
            </p>
          </div>
          <div className="header-tag">Powered by Gemini 2.5 Flash Lite ✨</div>
        </header>

        {/* Main generator */}
        <section className="generator-section" aria-label="Meme Generator">
          <MemeGenerator />
        </section>

        {/* Footer */}
        <footer className="app-footer">
          <p>
            Built for the demo 🚀 · Photos are never stored · Made with ❤️ in
            Kerala
          </p>
        </footer>
      </div>
    </main>
  );
}
