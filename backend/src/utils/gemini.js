const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL });

const generarSugerencias = async (configuracion) => {
  const { paquete, numPersonas, tipoEvento, colores } = configuracion;
  const prompt = `Eres el asistente de eventos de la Quinta Inés María en Chambo, Ecuador. Un cliente está planificando un ${tipoEvento} para ${numPersonas} personas con el paquete ${paquete}. Colores seleccionados: ${colores.join(", ")}. Genera 3 sugerencias creativas y específicas para personalizar su evento. Considera las instalaciones disponibles: jardines, glorieta, puente, pileta y áreas verdes. Responde en español, de forma cálida y profesional. Formato: lista numerada, máximo 50 palabras por sugerencia.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

module.exports = { generarSugerencias };
