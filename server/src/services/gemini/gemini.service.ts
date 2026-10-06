import { GoogleGenerativeAI } from '@google/generative-ai';
import { config, hasGeminiKey } from '../../config/env.config';

class GeminiService {
  private client: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor() {
    this.modelName = config.geminiModel || 'gemini-1.5-flash';
    if (hasGeminiKey()) {
      try {
        this.client = new GoogleGenerativeAI(config.geminiApiKey);
      } catch (err) {
        console.warn('[GeminiService] Failed to initialize GoogleGenerativeAI client:', err);
      }
    }
  }

  private getModel(overrideModel?: string) {
    if (!this.client) {
      if (hasGeminiKey()) {
        this.client = new GoogleGenerativeAI(config.geminiApiKey);
      } else {
        throw new Error(
          'GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your .env file or server environment.'
        );
      }
    }
    const modelToUse = overrideModel || this.modelName;
    return this.client.getGenerativeModel({
      model: modelToUse,
      generationConfig: {
        temperature: 0.1, // low temperature for deterministic, factual extraction
        topP: 0.95,
      },
    });
  }

  /**
   * Safely extracts JSON from an LLM response string
   */
  public safeParseJson<T>(rawText: string, fallback?: T): T {
    try {
      // First try direct JSON.parse
      return JSON.parse(rawText.trim());
    } catch {
      // Look for ```json ... ``` or ``` ... ``` code blocks
      const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        try {
          return JSON.parse(codeBlockMatch[1].trim());
        } catch {
          // fall through to bracket search
        }
      }

      // Try finding the first '{' and matching '}' or '[' and ']'
      const firstCurly = rawText.indexOf('{');
      const lastCurly = rawText.lastIndexOf('}');
      if (firstCurly !== -1 && lastCurly > firstCurly) {
        const potentialJson = rawText.substring(firstCurly, lastCurly + 1);
        try {
          return JSON.parse(potentialJson);
        } catch {
          // fall through
        }
      }

      const firstBracket = rawText.indexOf('[');
      const lastBracket = rawText.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        const potentialJson = rawText.substring(firstBracket, lastBracket + 1);
        try {
          return JSON.parse(potentialJson);
        } catch {
          // fall through
        }
      }

      if (fallback !== undefined) {
        return fallback;
      }
      throw new Error(`Failed to parse structured JSON from model output:\n${rawText.slice(0, 300)}...`);
    }
  }

  /**
   * Calls Gemini with prompt and returns structured JSON
   */
  public async generateStructuredJson<T>(
    systemInstruction: string,
    userPrompt: string,
    fallback?: T
  ): Promise<T> {
    if (!hasGeminiKey()) {
      if (fallback !== undefined) {
        return fallback;
      }
      throw new Error('GEMINI_API_KEY is required to generate AI analysis.');
    }

    // Try configured model first, with seamless fallback to supported Gemini generation model
    const candidateModels = [this.modelName, 'gemini-2.5-flash', 'gemini-flash-latest'].filter(
      (m, idx, arr) => arr.indexOf(m) === idx
    );

    for (const modelToTry of candidateModels) {
      try {
        const model = this.getModel(modelToTry);
        const combinedPrompt = `${systemInstruction}\n\nCRITICAL INSTRUCTION: You must respond ONLY with a valid JSON object matching the requested schema. Do not enclose in markdown explanation or conversational filler.\n\nUSER TASK:\n${userPrompt}`;

        const result = await model.generateContent(combinedPrompt);
        const text = result.response.text();
        return this.safeParseJson<T>(text, fallback);
      } catch (error: any) {
        // If model not found (e.g. 404 for deprecated model name), try next candidate
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          continue;
        }
        if (fallback !== undefined) {
          return fallback;
        }
        throw error;
      }
    }

    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error('All candidate Gemini generation models failed.');
  }

  /**
   * Generates embedding for text using supported Gemini embedding models:
   * 'gemini-embedding-001' (primary) or 'gemini-embedding-2'
   * Outputs 768 dimensions matching MongoDB Atlas Vector Search index requirements.
   */
  public async getEmbedding(text: string): Promise<number[]> {
    if (!hasGeminiKey()) {
      return this.generateSimulatedEmbedding(text, 768);
    }

    const candidateEmbeddingModels = ['gemini-embedding-001', 'gemini-embedding-2'];

    for (const modelName of candidateEmbeddingModels) {
      try {
        if (!this.client) {
          this.client = new GoogleGenerativeAI(config.geminiApiKey);
        }
        const embeddingModel = this.client.getGenerativeModel({ model: modelName });
        const embedReq: any = {
          content: { role: 'user', parts: [{ text: text.slice(0, 2048) }] },
          outputDimensionality: 768,
        };
        const result = await embeddingModel.embedContent(embedReq);

        if (result?.embedding?.values && result.embedding.values.length > 0) {
          return result.embedding.values;
        }
      } catch {
        // Silently proceed to next candidate without spamming startup logs
      }
    }

    // Genuine fallback if external Gemini API is unreachable or rate limited
    return this.generateSimulatedEmbedding(text, 768);
  }

  /**
   * Resilient local 768-dimension normalized vector based on semantic terms.
   * Kept strictly as a genuine fallback if external Gemini API is unreachable.
   */
  public generateSimulatedEmbedding(text: string, dim = 768): number[] {
    const vec = new Array(dim).fill(0);
    const clean = text.toLowerCase();

    const keywords = [
      'coverage', 'exclusion', 'waiting', 'period', 'pre-existing', 'ped',
      'room', 'rent', 'icu', 'surgery', 'hospital', 'doctor', 'treatment',
      'knee', 'cardiac', 'cancer', 'maternity', 'cosmetic', 'investigation',
      'limit', 'copay', 'deductible', 'sub-limit', 'fraud', 'admission',
      'discharge', 'prescription', 'pharmacy', 'diagnosis', 'bill', 'claim'
    ];

    keywords.forEach((kw, i) => {
      const idx = i % dim;
      const count = (clean.match(new RegExp(kw, 'g')) || []).length;
      vec[idx] += count * 2.0;
    });

    // Hash words across dimensions
    const words = clean.split(/\s+/);
    for (const w of words) {
      let hash = 0;
      for (let i = 0; i < w.length; i++) {
        hash = (hash << 5) - hash + w.charCodeAt(i);
        hash |= 0;
      }
      const pos = Math.abs(hash) % dim;
      vec[pos] += 0.1;
    }

    // Normalize vector
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }
}

export const geminiService = new GeminiService();
