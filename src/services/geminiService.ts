import type { ASOData } from '../types';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g., "data:application/pdf;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const processASOWithGemini = async (apiKey: string, file: File): Promise<ASOData> => {
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: file.type,
                            data: base64Data
                        }
                    }
                ]
            }]
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;

    // Clean up markdown code blocks if present
    const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
        return JSON.parse(jsonString) as ASOData;
    } catch (e) {
        console.error("Failed to parse Gemini response", textResponse);
        throw new Error("Failed to parse AI response");
    }
};
