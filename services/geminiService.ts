
import { GoogleGenAI } from "@google/genai";
import { InjectionMold } from "../types";

export const analyzeMoldCondition = async (mold: InjectionMold): Promise<string> => {
  // Винаги създаваме нов екземпляр точно преди повикването, за да използваме най-актуалния ключ от средата
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Анализирай състоянието на следната матрица за шприцформа:
    Име: ${mold.name}
    Сериен номер: ${mold.serialNumber}
    Общ брой удари: ${mold.totalShots}
    Статус: ${mold.status}
    История на ремонтите (JSON): ${JSON.stringify(mold.repairHistory)}

    Моля, дай кратка професионална препоръка на български език (до 150 думи) относно:
    1. Вероятни рискове от повреда въз основа на броя удари и производителя.
    2. Оценка на критичността на текущото състояние.
    3. Препоръка за следваща профилактика.
    
    Използвай технически език, подходящ за инженер по поддръжката.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Не може да се генерира анализ в момента.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Грешка при генериране на AI анализ. Моля, опитайте по-късно.";
  }
};
