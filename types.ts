
export interface WordAlternative {
  hindi: string;
  meaning: string;
  isDefault: boolean;
}

export interface WordMetadata {
  original: string;
  alternatives: WordAlternative[];
  selectedHindi: string; // The currently chosen transliteration word
}

export interface HindiResult {
  hindi: string;
  context: string;
}

export interface AdvancedTransliterationResult {
  results: HindiResult[];
  words: WordMetadata[];
}

export interface HistoryItem {
  id: string;
  input: string;
  results: HindiResult[];
  words?: WordMetadata[]; // Word alternatives for advanced rendering
  timestamp: number;
}

export interface DrawingCandidate {
  hinglish: string;
  hindi: string;
  english: string;
}

export interface DrawingRecognitionResult {
  primaryHinglish: string;
  primaryHindi: string;
  candidates: DrawingCandidate[];
  description?: string;
}
