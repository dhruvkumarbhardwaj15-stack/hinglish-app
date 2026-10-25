import { GoogleGenAI } from "@google/genai";

export interface SpeechController {
  stop: () => void;
}

export function isWebSpeechAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

// Convert ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Transcribe audio using Gemini 3.5 Transcribe
export async function transcribeAudioBlob(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const base64Data = bufferToBase64(arrayBuffer);

  const ai = new GoogleGenAI({ 
    apiKey: process.env.API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.5-transcribe",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: blob.type || "audio/webm",
            data: base64Data,
          },
        },
        {
          text: "Transcribe the spoken audio into Romanized Hinglish (e.g. 'namaste bhai kya haal hai'). Output only the verbatim transcription text, no preamble or quotes.",
        },
      ],
    },
  });

  return (response.text || "").trim();
}
