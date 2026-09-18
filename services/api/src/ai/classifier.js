import { z } from 'zod';
import { CLASSIFIER_PROMPT } from './prompts/classifierPrompt.js';
import { FailureCause } from '../../../../packages/shared/causeTaxonomy.js';

// The schema matching exactly the requirements
const outputSchema = z.object({
  cause: z.nativeEnum(FailureCause).default(FailureCause.UNKNOWN),
  attempts: z.number().int().min(0).default(0),
  ageBand: z.enum(['UNKNOWN', 'BELOW_65', '65_PLUS']).default('UNKNOWN'),
  confidence: z.number().min(0).max(1).default(0),
});

export const classifier = {
  async classifyTranscript(transcript) {
    const defaultReturn = {
      cause: FailureCause.UNKNOWN,
      attempts: 0,
      ageBand: 'UNKNOWN',
      confidence: 0
    };

  if (!process.env.GEMINI_API_KEY) {
    return defaultReturn;
  }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: `${CLASSIFIER_PROMPT}\n\nTranscript:\n${transcript}` }]
          }
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json"
        }
      };

      const result = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!result.ok) {
        return defaultReturn;
      }

      const response = await result.json();

      if (
        !response.candidates ||
        !response.candidates[0] ||
        !response.candidates[0].content ||
        !response.candidates[0].content.parts ||
        !response.candidates[0].content.parts[0] ||
        typeof response.candidates[0].content.parts[0].text !== 'string'
      ) {
        return defaultReturn;
      }

      const text = response.candidates[0].content.parts[0].text;
      
      let parsedJson;
      try {
        parsedJson = JSON.parse(text);
      } catch (e) {
        return defaultReturn;
      }

    const validation = outputSchema.safeParse(parsedJson);
    if (!validation.success) {
      return defaultReturn;
    }

    return validation.data;
  } catch (err) {
    // Gemini unavailable or network error
    return defaultReturn;
  }
}
};
