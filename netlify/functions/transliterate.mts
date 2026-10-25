import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const ai = new GoogleGenAI({});

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { text } = await req.json().catch(() => ({ text: "" }));
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) {
    return Response.json({ results: [], words: [] });
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: `Hinglish text: "${trimmed}"
Input tokens (${tokens.length}): ${JSON.stringify(tokens)}
Return exactly ${tokens.length} entries in 'words', one per input token, in the same order, with 'original' set to the exact input token.`,
    config: {
      systemInstruction: `You are an expert Hinglish (Romanized Hindi) to Devanagari Hindi transliterator and translator.
CRITICAL RULES:
1. Convert EVERY input token. Never skip, merge, or split tokens: 'words' must contain exactly one entry per input token, in input order.
2. Every word and every alternative in 'words' MUST be written 100% in pure Devanagari script (देवनागरी). Keep any punctuation attached to the token.
3. NEVER output any English or Latin letters (a-z, A-Z). Never output hybrid words mixing English and Hindi.
4. For English loanwords (e.g. school, office, bus, doctor, phone, sorry, please, thanks), transliterate them completely into Devanagari (e.g. स्कूल, ऑफ़िस, बस, डॉक्टर, फ़ोन, सॉरी, प्लीज, थैंक्स).
5. For names, slang, typos or unknown words, write them phonetically in Devanagari.
6. For EVERY token, give 2 to 4 distinct Devanagari spelling / contextual variants in 'alternatives' (e.g. 'main' -> ['मैं', 'में']; 'hai' -> ['है', 'हैं']). Mark isDefault: true for exactly one best alternative.
7. In 'results', provide the full sentence in Devanagari.`,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          results: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                hindi: { type: Type.STRING },
                context: { type: Type.STRING }
              },
              required: ["hindi", "context"]
            }
          },
          words: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                original: { type: Type.STRING },
                alternatives: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      hindi: { type: Type.STRING },
                      isDefault: { type: Type.BOOLEAN }
                    },
                    required: ["hindi", "isDefault"]
                  }
                }
              },
              required: ["original", "alternatives"]
            }
          }
        },
        required: ["results", "words"]
      }
    }
  });

  try {
    return Response.json(JSON.parse(response.text || "{}"));
  } catch {
    return Response.json({ results: [], words: [] });
  }
};

export const config = {
  path: "/api/transliterate",
};
