const Sentiment = require('sentiment'); // Análise de Sentimentos
const sentiment = new Sentiment();
const db = require('../../config/db');
const { carregarDicionarioPersonalizado, adicionarPalavraAoDicionario } = require('./dictionary');

// Funções do Monitor
const GroupsMonitor = {
    salvarMensagem: async (message) => {
        try {
            const links = message.body.match(/https?:\/\/[^\s]+/g) || [];
            const dicionario = await carregarDicionarioPersonalizado();

            const resultado = sentiment.analyze(message.body, { extras: dicionario });
            const sentimento = resultado.score > 0 ? 'positivo' : resultado.score < 0 ? 'negativo' : 'neutro';

            // Detecta palavras não reconhecidas
            const palavrasDesconhecidas = resultado.tokens.filter(token => !(token in dicionario));

            // Adiciona automaticamente palavras desconhecidas com pontuação via Hugging Face
            for (const palavra of palavrasDesconhecidas) {
                await adicionarPalavraAoDicionario(palavra);
            }

            const query = `
                INSERT INTO mensagens (grupo_id, usuario_id, horario, conteudo, links, sentimento)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;
            const values = [
                message.from,
                message.author || message.from,
                new Date(message.timestamp * 1000),
                message.body,
                links,
                sentimento,
            ];

            await db.query(query, values);
        } catch (err) {
            console.error('Erro ao salvar mensagem:', err);
        }
    },
};

module.exports = GroupsMonitor;