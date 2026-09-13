import { GoogleGenAI } from "@google/genai";
import { ANALYSIS_PROMPT } from "./prompts";

export interface AnalysisResult {
  mood: string;
  tags: string[];
  caption: string;
}

const FALLBACK_REACTIONS: AnalysisResult[] = [
  {
    mood: "confused",
    tags: ["confused", "what", "bewildered", "lost"],
    caption: "എന്താ ഇപ്പൊ ഇവിടെ ഉണ്ടായേ?! 🤔",
  },
  {
    mood: "shocked",
    tags: ["shocked", "surprised", "omg", "disbelief"],
    caption: "ഇത് ഞാൻ സ്വപ്നത്തിൽ പോലും വിചാരിച്ചില്ല! 😱",
  },
  {
    mood: "laughing",
    tags: ["laughing", "happy", "funny", "amused", "hilarious"],
    caption: "ചിരിച്ചു ചിരിച്ചു വയറു വേദനിക്കുന്നു! 😂",
  },
  {
    mood: "tired",
    tags: ["tired", "exhausted", "sleepy", "done", "drained"],
    caption: "ഇനി എന്നെക്കൊണ്ട് വയ്യ... എന്നെ വിട്ടേക്ക്! 😴",
  },
  {
    mood: "angry",
    tags: ["angry", "frustrated", "annoyed", "mad"],
    caption: "ഇതൊക്കെ സഹിക്കാൻ ഒരു പരിധിയുണ്ട്! 😡",
  },
  {
    mood: "smug",
    tags: ["smug", "confident", "proud", "winner"],
    caption: "ഞാൻ അന്നേ പറഞ്ഞതല്ലേ കേട്ടില്ലല്ലോ! 😏",
  },
  {
    mood: "sad",
    tags: ["sad", "crying", "upset", "emotional"],
    caption: "ഇത് ഞാൻ ഒട്ടും പ്രതീക്ഷിച്ചില്ല... 😭",
  },
];

/**
 * Analyzes photo using Gemini 2.5 Flash Lite (with fallback model chain and offline demo safety).
 */
export async function analyzePhotoWithGemini(
  imageBase64: string,
  mimeType: string
): Promise<AnalysisResult> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  const isPlaceholder =
    !apiKey ||
    apiKey.trim() === "" ||
    apiKey.includes("your_") ||
    apiKey.includes("placeholder");

  if (!isPlaceholder && apiKey) {
    // Primary model is gemini-2.5-flash-lite, with resilient fallbacks
    const modelsToTry = [
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash-lite",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ];

    const ai = new GoogleGenAI({ apiKey });

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: imageBase64,
                  },
                },
                {
                  text: `${ANALYSIS_PROMPT}\n\nAnalyze this photo and respond with valid JSON containing { "mood": string, "tags": string[], "caption": string }.`,
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
          },
        });

        const text = response.text;
        if (text) {
          const cleanJson = text
            .replace(/^```json\s*/i, "")
            .replace(/```\s*$/i, "")
            .trim();
          const parsed = JSON.parse(cleanJson) as AnalysisResult;
          if (parsed.mood && parsed.tags && parsed.caption) {
            console.log(
              `[Malayalam Meme AI] Successfully analyzed using ${modelName}`
            );
            return parsed;
          }
        }
      } catch (err) {
        console.warn(
          `[Malayalam Meme AI] Gemini model ${modelName} call failed:`,
          err instanceof Error ? err.message : err
        );
        // continue to next model in list
      }
    }
  }

  // Fallback demo reaction for hackathon/presentation reliability
  console.log(
    "[Malayalam Meme AI] Using demo meme reaction engine (Gemini key not configured or unavailable)"
  );
  const index = Math.floor(Math.random() * FALLBACK_REACTIONS.length);
  return FALLBACK_REACTIONS[index];
}
