export interface MemeMetadata {
  id: string;
  file: string;
  tags: string[];
  description: string;
  fallback?: boolean;
}

export interface ScoredMeme extends MemeMetadata {
  score: number;
}

/**
 * Select the best matching meme based on tags from AI analysis.
 * Uses a simple tag intersection scoring system.
 */
export function selectBestMeme(
  tags: string[],
  memes: MemeMetadata[]
): MemeMetadata {
  const scored = scoreMemes(tags, memes);

  // Get top scoring memes
  const maxScore = scored[0]?.score ?? 0;

  if (maxScore === 0) {
    // No matches — pick a random fallback meme
    const fallbacks = memes.filter((m) => m.fallback);
    const pool = fallbacks.length > 0 ? fallbacks : memes;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Among top scorers, pick randomly
  const topMemes = scored.filter((m) => m.score === maxScore);
  return topMemes[Math.floor(Math.random() * topMemes.length)];
}

/**
 * Select the next best meme (for "Try Another Reaction").
 * Excludes the currently displayed meme.
 */
export function selectNextMeme(
  tags: string[],
  memes: MemeMetadata[],
  currentMemeId: string
): MemeMetadata {
  const remaining = memes.filter((m) => m.id !== currentMemeId);

  if (remaining.length === 0) return memes[0]; // only one meme, return it

  return selectBestMeme(tags, remaining);
}

/**
 * Score all memes by tag intersection with the AI-generated tags.
 * Returns sorted by score descending.
 */
function scoreMemes(tags: string[], memes: MemeMetadata[]): ScoredMeme[] {
  const normalizedTags = tags.map((t) => t.toLowerCase().trim());

  const scored: ScoredMeme[] = memes.map((meme) => {
    const memeTagsNorm = meme.tags.map((t) => t.toLowerCase().trim());
    const matches = normalizedTags.filter((tag) => memeTagsNorm.includes(tag));
    return { ...meme, score: matches.length };
  });

  return scored.sort((a, b) => b.score - a.score);
}
