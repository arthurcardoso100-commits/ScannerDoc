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

export const processASOWithGemini = async (apiKey: string, file: File): Promise<ASOData> => {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Trying gemini-1.5-pro as flash seems to be 404ing for this key
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const base64Data = await fileToBase64(file);

    // Debug: List models if possible to see what's available
    try {
        // This is just for debugging in the console
        const modelList = await genAI.getGenerativeModel({ model: "gemini-1.5-pro" }).countTokens("test");
        console.log("API Connection OK, token count test:", modelList);
    } catch (e) {
        console.warn("API Check failed", e);
    }

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

    try {
        return JSON.parse(jsonString) as ASOData;
    } catch (e) {
        console.error("Failed to parse Gemini response", textResponse);
        throw new Error("Failed to parse AI response");
    }
};
