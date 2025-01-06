const { HfInference } = require('@huggingface/inference');

// Substitua pelo seu token de API da Hugging Face
const hf = new HfInference('API AQUI');

// Função para pontuar palavras com Hugging Face
const pontuarPalavraComHuggingFace = async (palavra) => {
    try {
        const resposta = await hf.textClassification({
            inputs: palavra,
            model: 'finiteautomata/bertweet-base-sentiment-analysis', // Modelo de análise de sentimento
        });

        const sentimento = resposta[0].label; // 'POSITIVE', 'NEGATIVE', ou 'NEUTRAL'
        const pontuacao = sentimento === 'POSITIVE' ? 3 : sentimento === 'NEGATIVE' ? -3 : 0;

        return { pontuacao, explicacao: `Classificado como ${sentimento}` };
    } catch (err) {
        console.error('Erro ao consultar Hugging Face:', err.message);
        return { pontuacao: 0, explicacao: 'Erro ao classificar palavra' };
    }
};

module.exports = { pontuarPalavraComHuggingFace };
