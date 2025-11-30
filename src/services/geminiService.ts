import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ASOData } from '../types';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Debug function to list available models
const listAvailableModels = async (apiKey: string) => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            console.error("Failed to list models:", await response.text());
            return;
        }
        const data = await response.json();
        console.log("Available Models for this key:", data.models?.map((m: any) => m.name));
    } catch (e) {
        console.error("Error listing models:", e);
    }
};

export const processASOWithGemini = async (apiKey: string, file: File): Promise<ASOData> => {
    const cleanKey = apiKey.trim();
    console.log(`Using API Key: ${cleanKey.substring(0, 5)}...${cleanKey.substring(cleanKey.length - 3)}`);

    // Check what models are actually visible to this key
    await listAvailableModels(cleanKey);

    const genAI = new GoogleGenerativeAI(cleanKey);
    const base64Data = await fileToBase64(file);

    const prompt = `
    Analyze this ASO (Occupational Health Certificate) document and extract the following information in JSON format:
    - nome: Employee name
    - cpf: Employee CPF
    - cargo: Job role/title
    - aptidoes: Object with boolean flags for:
      - funcao: Is fit for function?
      - altura: Is fit for working at heights?
      - espacoConfinado: Is fit for confined spaces?
      - eletricidade: Is fit for electrical work?
      (If not explicitly mentioned as unfit, assume fit or look for specific checkboxes)
    - assinaturas: Object with:
      - medico: Boolean (is physician signature present?)
      - tecnico: Boolean (is employee signature present?)
      - data: String (date of the document, preferably DD/MM/YYYY)

    Return ONLY the JSON object, no markdown formatting.
  `;

    // List of models to try in order of preference
    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-002",
        "gemini-1.5-pro",
        "gemini-1.5-pro-001",
        "gemini-1.5-pro-002",
        "gemini-pro", // Fallback to 1.0 Pro
        "gemini-1.0-pro"
    ];

    let lastError: any;

    for (const modelName of modelsToTry) {
        try {
            console.log(`Attempting to generate content with model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: file.type
                    }
                }
            ]);

            const response = await result.response;
            const textResponse = response.text();

            // Clean up markdown code blocks if present
            const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(jsonString) as ASOData;

        } catch (e: any) {
            console.warn(`Model ${modelName} failed:`, e.message);
            lastError = e;
            // Continue to next model
        }
    }

    // If we get here, all models failed
    console.error("All models failed. Last error:", lastError);
    throw new Error(`Failed to process document with any Gemini model. Last error: ${lastError?.message || "Unknown error"}`);
};
