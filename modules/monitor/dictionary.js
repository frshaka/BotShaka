const db = require('../../config/db');
const { pontuarPalavraComHuggingFace } = require('../utils/huggingface');

// Dicionário base para palavras e emojis
const baseDictionary = {
    "ótimo": 3,
    "bom": 2,
    "excelente": 5,
    "maravilhoso": 5,
    "feliz": 3,
    "adorei": 3,
    "amei": 4,
    "empolgado": 3,
    "alegria": 4,
    "incrível": 4,
    "horrível": -3,
    "ruim": -2,
    "péssimo": -5,
    "triste": -3,
    "detestei": -4,
    "chateado": -2,
    "raiva": -3,
    "medo": -2,
    "frustrado": -3,
    "desanimado": -3,
    "😀": 3,
    "😭": -3,
    "😍": 4,
    "😡": -3,
    "👍": 2,
    "👎": -2,
    "🎉": 3,
    "💔": -4,
    "😢": -2,
};

// Função para carregar palavras personalizadas do banco de dados
const carregarDicionarioPersonalizado = async () => {
    const query = `SELECT palavra, pontuacao FROM sentimentos`;
    const { rows } = await db.query(query);

    // Constrói o dicionário com base nas palavras do banco
    const customDictionary = {};
    rows.forEach(row => {
        customDictionary[row.palavra] = row.pontuacao;
    });

    return { ...baseDictionary, ...customDictionary }; // Combina base com personalizado
};

// Função para adicionar uma nova palavra ao banco de dados com pontuação automática
const adicionarPalavraAoDicionario = async (palavra) => {
    try {
        const { pontuacao, explicacao } = await pontuarPalavraComHuggingFace(palavra); // Usa Hugging Face
        const query = `
            INSERT INTO sentimentos (palavra, pontuacao)
            VALUES ($1, $2)
            ON CONFLICT (palavra) DO NOTHING
        `;
        await db.query(query, [palavra, pontuacao]);
    } catch (err) {
        console.error('Erro ao adicionar palavra ao dicionário:', err);
    }
};

module.exports = {
    carregarDicionarioPersonalizado,
    adicionarPalavraAoDicionario,
};
