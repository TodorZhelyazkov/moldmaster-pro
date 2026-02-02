
import { GoogleGenAI } from "@google/genai";
import { InjectionMold } from "../types";

export const analyzeMoldCondition = async (mold: InjectionMold): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `
    Анализирай състоянието на следната матрица за шприцформа:
    Име: ${mold.name}
    Общ брой удари: ${mold.totalShots}
    Статус: ${mold.status}
    История на ремонтите: ${JSON.stringify(mold.repairHistory)}

    Моля, дай кратка професионална препоръка на български език относно:
    1. Вероятни рискове от повреда въз основа на броя удари.
    2. Оценка на общото състояние.
    3. Анализ на честотата на ремонтите досега.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Не може да се генерира анализ в момента.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Грешка при комуникация с AI асистента.";
  }
};
