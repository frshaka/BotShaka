const OpenAI = require("openai");


// Inicialize a classe OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Certifique-se de que a chave está no .env
});

/**
 * Gera um resumo analítico das mensagens do grupo
 * @param {Array} messages - Array de strings com as mensagens do grupo
 * @returns {Promise<string>} - Resumo gerado pela IA
 */
async function generateSummary(messages) {
    const formattedMessages = messages.map((msg) => `- ${msg}`).join("\n");

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "Você é um assistente que gera resumos úteis de discussões a respeito do jogo Saint Seiya Lendas da Justiça em grupo." },
                { role: "user", content: `Resuma as principais discussões do grupo em tópicos com os horarios aproximados que a discussão ocorreu e sempre especifique o nome dos personagens mencionados:\n${formattedMessages}` },
            ],
            max_tokens: 4000,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error("Erro ao gerar resumo:", error.response ? error.response.data : error.message);
        throw new Error("Não foi possível gerar o resumo.");
    }
}

module.exports = { generateSummary };
