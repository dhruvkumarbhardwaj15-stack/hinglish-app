import { AdvancedTransliterationResult, DrawingRecognitionResult, WordAlternative, WordMetadata } from "../types.ts";
import { 
  canBeFullyTransliteratedLocally, 
  fastLocalTransliterate, 
  generateSmartVariants, 
  getFromCache, 
  isPureHindi, 
  localTransliterateToken,
  saveToCache 
} from "./fastDictionary.ts";

const normalizeToken = (token: string) => token.toLowerCase().replace(/[^a-z0-9ऀ-ॿ]/g, '');

// Clean one AI word entry into pure Devanagari alternatives, falling back to local transliteration
function sanitizeWord(token: string, aiWord?: { alternatives?: { hindi?: string; isDefault?: boolean }[] }): WordMetadata {
  let validAlts: WordAlternative[] = (aiWord?.alternatives || [])
    .filter(a => a && a.hindi && isPureHindi(a.hindi.trim()))
    .map(a => ({
      hindi: a.hindi!.trim(),
      meaning: token,
      isDefault: Boolean(a.isDefault)
    }))
    .filter((a, idx, arr) => arr.findIndex(b => b.hindi === a.hindi) === idx);

  // No usable AI output for this token: use dictionary / phonetic transliteration
  if (validAlts.length === 0) {
    return localTransliterateToken(token);
  }

  // Guarantee at least 2 distinct Devanagari alternatives per word
  if (validAlts.length === 1) {
    generateSmartVariants(token, validAlts[0].hindi).forEach(eh => {
      if (!validAlts.some(va => va.hindi === eh)) {
        validAlts.push({ hindi: eh, meaning: token, isDefault: false });
      }
    });
  }

  // Ensure exactly one isDefault: true
  const defaultAlt = validAlts.find(a => a.isDefault) || validAlts[0];
  validAlts = validAlts.map(a => ({ ...a, isDefault: a === defaultAlt }));

  return {
    original: token,
    alternatives: validAlts,
    selectedHindi: defaultAlt.hindi
  };
}

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
    saveToCache(trimmed, localResult);
    return localResult;
  }

  // 3. AI translation & transliteration (server-side), aligned back to every input token
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  let aiWords: { original?: string; alternatives?: { hindi?: string; isDefault?: boolean }[] }[] = [];
  let aiAvailable = false;

  try {
    const res = await fetch("/api/transliterate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed })
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.words)) {
        aiWords = data.words;
        aiAvailable = aiWords.length > 0;
      }
    }
  } catch (error) {
    console.error("AI transliteration request failed:", error);
  }

  // Match AI words to input tokens in order; any unmatched token is converted locally
  const sameCount = aiWords.length === tokens.length;
  let cursor = 0;
  const words = tokens.map((token, idx) => {
    if (sameCount) {
      return sanitizeWord(token, aiWords[idx]);
    }
    const key = normalizeToken(token);
    for (let j = cursor; j < aiWords.length; j++) {
      if (normalizeToken(aiWords[j]?.original || '') === key) {
        cursor = j + 1;
        return sanitizeWord(token, aiWords[j]);
      }
    }
    return sanitizeWord(token);
  });

  const result: AdvancedTransliterationResult = {
    results: [{ hindi: words.map(w => w.selectedHindi).join(' '), context: "Standard transliteration" }],
    words
  };

  // Only cache AI-backed results so a temporary outage doesn't stick
  if (aiAvailable) {
    saveToCache(trimmed, result);
  }
  return result;
};

export const recognizeDrawing = async (base64Image: string): Promise<DrawingRecognitionResult> => {
  const res = await fetch("/api/recognize-drawing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64Image })
  });

  if (!res.ok) {
    throw new Error(`Drawing recognition failed (${res.status})`);
  }

  const data = (await res.json()) as DrawingRecognitionResult;
  return {
    primaryHinglish: data.primaryHinglish || "",
    primaryHindi: data.primaryHindi || "",
    description: data.description || "Recognized drawing",
    candidates: data.candidates || []
  };
};
