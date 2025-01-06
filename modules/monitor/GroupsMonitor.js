const { Client } = require('pg'); // Banco de Dados
const Sentiment = require('sentiment'); // Análise de Sentimentos
const sentiment = new Sentiment();
const clientDB = new Client({
    connectionString: process.env.DATABASE_URL,
});

clientDB.connect();

// Funções do Monitor
const GroupsMonitor = {
    salvarMensagem: async (message) => {
        // Função para salvar mensagem no banco
        GroupsMonitor.salvarMensagem = async (message) => {
          const links = message.body.match(/https?:\/\/[^\s]+/g) || [];
          const sentimento = sentiment.analyze(message.body).score > 0
              ? 'positivo'
              : sentiment.analyze(message.body).score < 0
              ? 'negativo'
              : 'neutro';
      
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
          await clientDB.query(query, values);
      };
      
    },

    getMensagensGrupo: async (grupoId, dataInicio, dataFim) => {
        // Função para buscar mensagens de um grupo
        GroupsMonitor.getMensagensGrupo = async (grupoId, dataInicio, dataFim) => {
          const query = `
              SELECT usuario_id, COUNT(*) as mensagens
              FROM mensagens
              WHERE grupo_id = $1 AND horario BETWEEN $2 AND $3
              GROUP BY usuario_id
              ORDER BY mensagens DESC
              LIMIT 5
          `;
          const { rows } = await clientDB.query(query, [grupoId, dataInicio, dataFim]);
          return rows;
      };
      
    },

    getTopParticipantes: async (grupoId, dataInicio, dataFim) => {
        // Função para calcular os top participantes
        GroupsMonitor.getTopParticipantes = async (grupoId, dataInicio, dataFim) => {
          const query = `
              SELECT usuario_id, COUNT(*) AS mensagens
              FROM mensagens
              WHERE grupo_id = $1 AND horario BETWEEN $2 AND $3
              GROUP BY usuario_id
              ORDER BY mensagens DESC
              LIMIT 5;
          `;
          const { rows } = await clientDB.query(query, [grupoId, dataInicio, dataFim]);
          return rows.map(row => ({
              usuario: row.usuario_id,
              mensagens: row.mensagens,
          }));
      };
      
    },

    getHorariosMovimento: async (grupoId, dataInicio, dataFim) => {
        // Função para calcular os horários de maior movimento
        GroupsMonitor.getHorariosMovimento = async (grupoId, dataInicio, dataFim) => {
          const query = `
              SELECT DATE_PART('hour', horario) AS hora, COUNT(*) as mensagens
              FROM mensagens
              WHERE grupo_id = $1 AND horario BETWEEN $2 AND $3
              GROUP BY hora
              ORDER BY mensagens DESC;
          `;
          const { rows } = await clientDB.query(query, [grupoId, dataInicio, dataFim]);
          return rows;
      };
      
    },

    getDiscussõesElinks: async (grupoId, dataInicio, dataFim) => {
        // Função para buscar discussões e links importantes
        GroupsMonitor.getDiscussõesElinks = async (grupoId, dataInicio, dataFim) => {
          const query = `
              SELECT conteudo, links
              FROM mensagens
              WHERE grupo_id = $1 AND horario BETWEEN $2 AND $3 AND 
                    (CHAR_LENGTH(conteudo) > 100 OR links IS NOT NULL)
              ORDER BY horario ASC;
          `;
          const { rows } = await clientDB.query(query, [grupoId, dataInicio, dataFim]);
          return rows;
      };
      
    },

    gerarResumoDiario: async (grupoId) => {
        // Função principal para gerar resumo
        GroupsMonitor.gerarResumoDiario = async (grupoId) => {
          const hoje = new Date();
          const inicioDoDia = new Date(hoje.setHours(0, 0, 0, 0));
          const fimDoDia = new Date(hoje.setHours(23, 59, 59, 999));
      
          const topParticipantes = await GroupsMonitor.getTopParticipantes(grupoId, inicioDoDia, fimDoDia);
          const horarios = await GroupsMonitor.getHorariosMovimento(grupoId, inicioDoDia, fimDoDia);
          const discussoes = await GroupsMonitor.getDiscussõesElinks(grupoId, inicioDoDia, fimDoDia);
      
          return `
      Resumo Diário do Grupo:
      📊 **Top 5 Participantes Ativos**:
      ${topParticipantes.map(u => `- ${u.usuario}: ${u.mensagens} mensagens`).join('\n')}
      
      ⏰ **Horários de Maior Movimento**:
      ${horarios.map(h => `- ${h.hora}h: ${h.mensagens} mensagens`).join('\n')}
      
      📌 **Discussões e Links Importantes**:
      ${discussoes.map(d => `- ${d.conteudo} ${d.links?.join(', ')}`).join('\n')}
          `;
      };
    },
};

module.exports = GroupsMonitor;
