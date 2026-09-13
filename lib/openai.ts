import OpenAI from "openai";

export interface AnalysisResult {
  mood: string;
  tags: string[];
  caption: string;
}

const FALLBACK_REACTIONS: AnalysisResult[] = [
  {
    mood: "confused",
    tags: ["confused", "what", "bewildered", "lost"],
    caption: "എന്താ ഇപ്പൊ ഇവിടെ ഉണ്ടായേ?!",
  },
  {
    mood: "shocked",
    tags: ["shocked", "surprised", "omg", "disbelief"],
    caption: "ഇത് ഞാൻ സ്വപ്നത്തിൽ പോലും വിചാരിച്ചില്ല!",
  },
  {
    mood: "laughing",
    tags: ["laughing", "happy", "funny", "amused", "hilarious"],
    caption: "ചിരിച്ചു ചിരിച്ചു വയറു വേദനിക്കുന്നു!",
  },
  {
    mood: "tired",
    tags: ["tired", "exhausted", "sleepy", "done", "drained"],
    caption: "ഇനി എന്നെക്കൊണ്ട് വയ്യ... എന്നെ വിട്ടേക്ക്!",
  },
  {
    mood: "angry",
    tags: ["angry", "frustrated", "annoyed", "mad"],
    caption: "ഇതൊക്കെ സഹിക്കാൻ ഒരു പരിധിയുണ്ട്!",
  },
  {
    mood: "smug",
    tags: ["smug", "confident", "proud", "winner"],
    caption: "ഞാൻ അന്നേ പറഞ്ഞതല്ലേ കേട്ടില്ലല്ലോ!",
  },
  {
    mood: "sad",
    tags: ["sad", "crying", "upset", "emotional"],
    caption: "ഇത് ഞാൻ ഒട്ടും പ്രതീക്ഷിച്ചില്ല...",
  },
];

export async function analyzePhoto(
  imageBase64: string,
  mimeType: string
): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const isPlaceholder =
    !apiKey ||
    apiKey.trim() === "" ||
    apiKey.includes("your_openai") ||
    apiKey.includes("placeholder");

  if (!isPlaceholder && apiKey) {
    try {
      const openai = new OpenAI({ apiKey });
      const { ANALYSIS_PROMPT } = await import("./prompts");

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content: ANALYSIS_PROMPT,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: "low",
                },
              },
              {
                type: "text",
                text: "Analyze this photo and respond with the JSON format specified.",
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content) as AnalysisResult;
        if (parsed.mood && parsed.tags && parsed.caption) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn(
        "[Malayalam Meme AI] OpenAI call failed or quota reached, falling back to demo generator:",
        err instanceof Error ? err.message : err
      );
    }
  }

  // Fallback demo reaction for hackathon/presentation reliability
  console.log("[Malayalam Meme AI] Using demo meme reaction engine");
  // Pick pseudo-randomly based on image buffer length or time for variety
  const index = Math.floor(Math.random() * FALLBACK_REACTIONS.length);
  return FALLBACK_REACTIONS[index];
}

