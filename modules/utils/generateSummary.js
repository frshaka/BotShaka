const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * Gera um resumo analítico das mensagens do grupo
 * @param {Array} messages - Array de strings com as mensagens do grupo
 * @returns {Promise<string>} - Resumo gerado pela IA
 */
async function generateSummary(messages) {
    const prompt = `
    Resuma as principais discussões do grupo com base nas mensagens abaixo:
    ${messages.map((msg) => `- ${msg}`).join("\n")}
    `;

    try {
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: prompt,
            max_tokens: 200,
        });

        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error("Erro ao gerar resumo: ", error);
        throw new Error("Não foi possível gerar o resumo.");
    }
}

module.exports = { generateSummary };