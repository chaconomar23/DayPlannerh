import { GoogleGenAI } from "@google/genai";
import { ScheduleBlock, ActivityTemplate } from '../types';

export const analyzeDayWithGemini = async (
  schedule: ScheduleBlock[],
  activities: ActivityTemplate[],
  currentScore: number
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return "⚠️ API Key no configurada. Por favor configura tu API Key de Google para usar el asistente.";
    }

    const ai = new GoogleGenAI({ apiKey });

    // Prepare context
    const scheduleSummary = schedule.map(block => {
      const activity = activities.find(a => a.id === block.activityId);
      const startHour = Math.floor(block.startTime / 60);
      const startMin = block.startTime % 60;
      return `- ${startHour}:${startMin.toString().padStart(2, '0')} (${block.duration}min): ${activity?.name} [${activity?.category}] (Puntos: ${activity?.score})`;
    }).join('\n');

    const prompt = `
      Actúa como un coach de productividad de clase mundial. 
      Analiza mi día planeado. 
      
      Datos del día:
      Puntaje Total: ${currentScore} (El objetivo es maximizar puntos positivos sin agotarse).
      
      Agenda:
      ${scheduleSummary || "No hay actividades planeadas aún."}
      
      Dame un feedback corto, elegante y motivador (máximo 3 oraciones).
      Si el puntaje es bajo, sugiere un cambio específico. 
      Usa un tono sofisticado pero directo.
      Responde en texto plano, sin markdown complejo.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No pude generar un análisis en este momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error al conectar con el oráculo de productividad.";
  }
};