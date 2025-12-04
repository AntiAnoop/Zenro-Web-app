import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
  if (!aiClient) {
    // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }
  return aiClient;
};

export const generateClassSummary = async (transcript: string): Promise<string> => {
  const client = getAiClient();

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are an expert educational assistant. 
      Summarize the following live class transcript into a concise "Class Summary PDF" format.
      
      Structure the output with:
      1. Key Topics Covered (Bullet points)
      2. Important Dates mentioned
      3. Homework/Action Items
      
      Transcript:
      "${transcript}"
    `;

    const response = await client.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: "Format the output using Markdown.",
        temperature: 0.3, 
      }
    });

    return response.text || "No summary generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate summary at this time.";
  }
};

export const analyzeProctoringImage = async (base64Image: string): Promise<{ suspicious: boolean; reason: string }> => {
  const client = getAiClient();

  try {
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: base64Image
                    }
                },
                {
                    text: "Analyze this webcam frame for an online exam proctoring system. Return JSON. Is the user suspicious (looking away, multiple people, no person)? { \"suspicious\": boolean, \"reason\": string }"
                }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suspicious: { type: Type.BOOLEAN },
                    reason: { type: Type.STRING }
                }
            }
        }
    });

    const text = response.text;
    if (!text) return { suspicious: false, reason: "Analysis failed" };
    return JSON.parse(text);

  } catch (error) {
    console.error("Proctoring Analysis Error", error);
    return { suspicious: false, reason: "Error during analysis" };
  }
}
