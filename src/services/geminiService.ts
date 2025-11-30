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

// Helper to fetch actual available models from the API
const getValidModelName = async (apiKey: string): Promise<string> => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            console.warn("Failed to list models, defaulting to gemini-1.5-flash");
            return "gemini-1.5-flash";
        }

        const data = await response.json();
        const models = data.models || [];

        // Log available models for debugging
        console.log("Available models from API:", models.map((m: any) => m.name));

        // Filter for models that support generateContent
        const generateModels = models.filter((m: any) =>
            m.supportedGenerationMethods?.includes("generateContent")
        );

        // Strategy: Prefer Flash 1.5 -> Pro 1.5 -> Pro 1.0 -> Any
        const preferences = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-1.0-pro",
            "gemini-pro"
        ];

        for (const pref of preferences) {
            const match = generateModels.find((m: any) =>
                m.name === `models/${pref}` || m.name === pref
            );
            if (match) {
                console.log(`Selected preferred model: ${match.name}`);
                // Remove 'models/' prefix if present, although SDK handles it, it's safer to be clean
                return match.name.replace("models/", "");
            }
        }

        // If no preference found, take the first one that looks like a gemini model
        const fallback = generateModels.find((m: any) => m.name.includes("gemini"));
        if (fallback) {
            console.log(`Selected fallback model: ${fallback.name}`);
            return fallback.name.replace("models/", "");
        }

        return "gemini-1.5-flash"; // Ultimate fallback
    } catch (e) {
        console.error("Error selecting model:", e);
        return "gemini-1.5-flash";
    }
};

export const processASOWithGemini = async (apiKey: string, file: File): Promise<ASOData> => {
    const cleanKey = apiKey.trim();
    const genAI = new GoogleGenerativeAI(cleanKey);
    const base64Data = await fileToBase64(file);

    // Dynamically select the best available model
    const modelName = await getValidModelName(cleanKey);
    console.log(`Initializing SDK with model: ${modelName}`);

    const model = genAI.getGenerativeModel({ model: modelName });

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

    try {
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

        const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonString) as ASOData;

    } catch (e: any) {
        console.error("Gemini API Error:", e);
        throw new Error(`Failed to process document. Model: ${modelName}. Error: ${e.message}`);
    }
};
