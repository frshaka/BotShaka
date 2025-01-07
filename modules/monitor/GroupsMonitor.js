const Sentiment = require('sentiment'); // Análise de Sentimentos
const sentiment = new Sentiment();
const db = require('../../config/db');
const { generateSummary } = require("../utils/generateSummary");

// Funções do Monitor
const GroupsMonitor = {
    // Salva mensagens no banco de dados
    salvarMensagem: async (message) => {
        try {
            const links = message.body.match(/https?:\/\/[^\s]+/g) || [];

            const resultado = sentiment.analyze(message.body);
            const sentimento = resultado.score > 0 ? 'positivo' : resultado.score < 0 ? 'negativo' : 'neutro';

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
            console.error('[ERRO] Falha ao salvar mensagem:', err);
        }
    },

    // Obtém os 5 participantes mais ativos em um período
    getTopParticipantes: async (grupoId, dataInicio, dataFim, client) => {
        try {
            const query = `
                SELECT usuario_id, COUNT(*) AS mensagens
                FROM mensagens
                WHERE grupo_id = $1 AND horario BETWEEN $2 AND $3
                GROUP BY usuario_id
                ORDER BY mensagens DESC
                LIMIT 5;
            `;
            const { rows } = await db.query(query, [grupoId, dataInicio, dataFim]);
    
            const topParticipantes = [];
            for (const row of rows) {
                try {
                    // Busca o contato pelo ID do usuário
                    const contato = await client.getContactById(row.usuario_id);
                    const nome = contato.pushname || contato.verifiedName || contato.name || row.usuario_id;
    
                    topParticipantes.push({
                        usuario: nome,
                        mensagens: row.mensagens,
                    });
                } catch (err) {
                    console.error(`Erro ao obter informações do contato ${row.usuario_id}:`, err);
                    topParticipantes.push({
                        usuario: row.usuario_id, // Fallback para o ID, caso não consiga buscar o nome
                        mensagens: row.mensagens,
                    });
                }
            }
    
            return topParticipantes;
        } catch (err) {
            console.error('Erro ao buscar top participantes:', err);
            return [];
        }
    },

    // Obtém os horários de maior movimento
    getHorariosMovimento: async (grupoId, dataInicio, dataFim) => {
        try {
            const query = `
                SELECT DATE_PART('hour', horario) AS hora, COUNT(*) as mensagens
                FROM mensagens
                WHERE grupo_id = $1 AND horario BETWEEN $2 AND $3
                GROUP BY hora
                ORDER BY mensagens DESC;
            `;
            const { rows } = await db.query(query, [grupoId, dataInicio, dataFim]);
            return rows;
        } catch (err) {
            console.error('Erro ao buscar horários de maior movimento:', err);
            return [];
        }
    },

    // Obtém discussões e links importantes
    getDiscussõesElinks: async (grupoId, dataInicio, dataFim) => {
        try {
            const query = `
                SELECT conteudo, links
                FROM mensagens
                WHERE grupo_id = $1 AND horario BETWEEN $2 AND $3
                  AND (CHAR_LENGTH(conteudo) > 100 OR links IS NOT NULL)
                ORDER BY horario ASC;
            `;
            const { rows } = await db.query(query, [grupoId, dataInicio, dataFim]);
            return rows;
        } catch (err) {
            console.error('Erro ao buscar discussões e links importantes:', err);
            return [];
        }
    },

    // Gera o resumo diário de um grupo
    gerarResumoDiario: async (grupoId, client) => {
        try {
            const hoje = new Date();
            const inicioDoDia = new Date(hoje.setHours(0, 0, 0, 0));
            const fimDoDia = new Date(hoje.setHours(23, 59, 59, 999));
    
            const topParticipantes = await GroupsMonitor.getTopParticipantes(grupoId, inicioDoDia, fimDoDia, client);
            const horarios = await GroupsMonitor.getHorariosMovimento(grupoId, inicioDoDia, fimDoDia);
            const discussoes = await GroupsMonitor.getDiscussõesElinks(grupoId, inicioDoDia, fimDoDia);
    
            if (topParticipantes.length === 0 && horarios.length === 0 && discussoes.length === 0) {
                return null;
            }
    
            // Preparar dados para o Resumo Gerado por IA
            const mensagensParaResumo = [
                ...topParticipantes.map((u) => `Usuário: ${u.usuario}, Mensagens: ${u.mensagens}`),
                ...horarios.map((h) => `Horário: ${h.hora}h, Mensagens: ${h.mensagens}`),
                ...discussoes.map((d) => `Discussão às ${new Date(d.horario).toLocaleTimeString()}: ${d.conteudo}`),
            ];
    
            const resumoIA = await generateSummary(mensagensParaResumo);
    
            const resumoFinal = `
📊 **Top 5 Participantes Ativos**:
    ${topParticipantes.map((u) => `- ${u.usuario}: ${u.mensagens} mensagens`).join("\n")}
    
⏰ **Horários de Maior Movimento**:
    ${horarios.map((h) => `- ${h.hora}h: ${h.mensagens} mensagens`).join("\n")}
    
🤖 **Resumo Gerado por IA**:
    ${resumoIA}
            `;
    
            // Log resumido
            console.log(`[LOG] Resumo gerado com sucesso para o grupo ${grupoId}.`);
    
            return resumoFinal;
        } catch (error) {
            console.error(`[ERRO] Falha ao gerar resumo para o grupo ${grupoId}:`, error);
            return null;
        }
    },
    
    
}

module.exports = GroupsMonitor;
