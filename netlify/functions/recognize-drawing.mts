import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const ai = new GoogleGenAI({});

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { image } = await req.json().catch(() => ({ image: "" }));
  const cleanBase64 = typeof image === "string" ? image.replace(/^data:image\/[a-z]+;base64,/, "") : "";
  if (!cleanBase64) {
    return Response.json({ error: "Missing image" }, { status: 400 });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: [
      {
        inlineData: {
          mimeType: "image/png",
          data: cleanBase64
        }
      },
      {
        text: "Analyze this drawing or handwritten sketch. Output pure Devanagari Hindi for Hindi fields."
      }
    ],
    config: {
      systemInstruction: `You are an AI handwriting and sketch recognition assistant. Every Hindi text MUST be in 100% pure Devanagari script without English letters.`,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          primaryHinglish: { type: Type.STRING },
          primaryHindi: { type: Type.STRING },
          description: { type: Type.STRING },
          candidates: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                hinglish: { type: Type.STRING },
                hindi: { type: Type.STRING },
                english: { type: Type.STRING }
              },
              required: ["hinglish", "hindi", "english"]
            }
          }
        },
        required: ["primaryHinglish", "primaryHindi", "candidates"]
      }
    }
  });

  try {
    return Response.json(JSON.parse(response.text || "{}"));
  } catch {
    return Response.json({ primaryHinglish: "", primaryHindi: "", candidates: [] });
  }
};

export const config = {
  path: "/api/recognize-drawing",
};
