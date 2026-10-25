import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { AdvancedTransliterationResult, DrawingRecognitionResult } from "../types.ts";
import { 
  canBeFullyTransliteratedLocally, 
  fastLocalTransliterate, 
  generateSmartVariants, 
  getFromCache, 
  isPureHindi, 
  saveToCache 
} from "./fastDictionary.ts";

export const transliterateHinglish = async (input: string): Promise<AdvancedTransliterationResult> => {
  const trimmed = input.trim();
  if (!trimmed) {
    return { results: [], words: [] };
  }

  // 1. Check validated pure-Devanagari cache
  const cached = getFromCache(trimmed);
  if (cached && cached.words && cached.words.length > 0) {
    return cached;
  }

  // 2. If entire sentence is composed of verified dictionary words, use instant dictionary
  if (canBeFullyTransliteratedLocally(trimmed)) {
    const localResult = fastLocalTransliterate(trimmed);
    if (localResult.words.length > 0 && localResult.words.every(w => isPureHindi(w.selectedHindi))) {
      saveToCache(trimmed, localResult);
      return localResult;
    }
  }

  // 3. Robust Gemini Translation & Transliteration
  const ai = new GoogleGenAI({ 
    apiKey: process.env.API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite", 
    contents: `Transliterate and translate this Hinglish text into 100% pure Devanagari Hindi (देवनागरी): "${trimmed}".
Provide each word token with 2 to 4 spelling/contextual variants in 'alternatives'.`,
    config: {
      systemInstruction: `You are an expert Hinglish (Romanized Hindi) to Devanagari Hindi transliterator and translator.
CRITICAL RULES:
1. Translate and transliterate every word completely and accurately.
2. Every word and every alternative in 'words' MUST be written 100% in pure Devanagari script (देवनागरी).
3. NEVER output any English or Latin letters (a-z, A-Z) in any transliterated word or alternative. Never output hybrid words mixing English and Hindi.
4. For English loanwords (e.g. school, office, bus, doctor, phone, sorry, please, thanks), transliterate them completely into Devanagari (e.g. स्कूल, ऑफ़िस, बस, डॉक्टर, फ़ोन, सॉरी, प्लीज, थैंक्स).
5. For EVERY word token, ALWAYS generate 2 to 4 distinct Devanagari spelling / contextual word variants in 'alternatives' (e.g. 'main' -> ['मैं', 'में', 'मैल']; 'hai' -> ['है', 'हैं']; 'kal' -> ['कल', 'काल']; 'aap' -> ['आप', 'आपा', 'आपसे']). Mark isDefault: true for exactly one best alternative.
6. In 'results', provide a full sentence Devanagari translation.`,
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
    const rawText = response.text || "{}";
    const data = JSON.parse(rawText) as AdvancedTransliterationResult;

    if (data.words && Array.isArray(data.words) && data.words.length > 0) {
      const sanitizedWords = data.words.map((w) => {
        // Clean and filter alternatives to ensure 100% pure Devanagari
        let validAlts = (w.alternatives || [])
          .filter(a => a && a.hindi && isPureHindi(a.hindi.trim()))
          .map(a => ({
            hindi: a.hindi.trim(),
            meaning: w.original,
            isDefault: Boolean(a.isDefault)
          }));

        // If no valid pure Hindi alternatives, generate them
        if (validAlts.length === 0) {
          const dictLookup = fastLocalTransliterate(w.original);
          if (dictLookup.words[0] && isPureHindi(dictLookup.words[0].selectedHindi)) {
            validAlts = dictLookup.words[0].alternatives;
          }
        }

        // Guarantee at least 2 distinct Devanagari alternatives per word
        if (validAlts.length === 1) {
          const extra = generateSmartVariants(w.original, validAlts[0].hindi);
          extra.forEach(eh => {
            if (!validAlts.some(va => va.hindi === eh)) {
              validAlts.push({
                hindi: eh,
                meaning: w.original,
                isDefault: false
              });
            }
          });
        }

        // Ensure exactly one isDefault: true
        const defaultAlt = validAlts.find(a => a.isDefault) || validAlts[0];
        if (defaultAlt) {
          defaultAlt.isDefault = true;
        }

        return {
          original: w.original,
          alternatives: validAlts,
          selectedHindi: defaultAlt ? defaultAlt.hindi : ""
        };
      });

      // Filter out any word that couldn't be resolved
      const finalWords = sanitizedWords.filter(w => isPureHindi(w.selectedHindi));

      const finalResult: AdvancedTransliterationResult = {
        results: (data.results && data.results.length > 0 && isPureHindi(data.results[0].hindi))
          ? data.results
          : [{ hindi: finalWords.map(w => w.selectedHindi).join(' '), context: "Standard transliteration" }],
        words: finalWords
      };

      if (finalResult.words.length > 0) {
        saveToCache(trimmed, finalResult);
        return finalResult;
      }
    }
  } catch (parseError) {
    console.error("Gemini transliteration response parsing error:", parseError);
  }

  // Safe fallback: try dictionary only for pure verified words
  if (canBeFullyTransliteratedLocally(trimmed)) {
    return fastLocalTransliterate(trimmed);
  }

  throw new Error("Transliteration failed to produce pure Devanagari output.");
};

export const recognizeDrawing = async (base64Image: string): Promise<DrawingRecognitionResult> => {
  const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");

  const ai = new GoogleGenAI({ 
    apiKey: process.env.API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

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
    const data = JSON.parse(response.text || "{}") as DrawingRecognitionResult;
    return {
      primaryHinglish: data.primaryHinglish || "",
      primaryHindi: data.primaryHindi || "",
      description: data.description || "Recognized drawing",
      candidates: data.candidates || []
    };
  } catch (error) {
    console.error("Failed to parse drawing recognition:", error);
    return {
      primaryHinglish: "",
      primaryHindi: "",
      candidates: []
    };
  }
};
