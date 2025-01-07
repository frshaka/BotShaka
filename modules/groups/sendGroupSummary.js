const schedule = require('node-schedule');
const GroupsMonitor = require('../monitor/GroupsMonitor'); // Importa o módulo do monitor de grupos

const SEU_NUMERO = '5515991236228'; // Substitua pelo seu número no formato internacional

const sendGroupSummary = (client) => {
    schedule.scheduleJob('59 11 * * *', async () => {
        try {
            console.log('Iniciando envio de resumo diário...');
            const grupos = await client.getChats();

            for (const grupo of grupos) {
                if (grupo.isGroup) {
                    console.log(`Gerando resumo para o grupo: ${grupo.name}`);
                    const resumo = await GroupsMonitor.gerarResumoDiario(grupo.id._serialized, client);
                    await client.sendMessage(`${SEU_NUMERO}@c.us`, `📂 **Grupo: ${grupo.name}**\n${resumo}`);
                    console.log(`Resumo enviado para o grupo: ${grupo.name}`);
                }
            }
        } catch (err) {
            console.error('Erro ao gerar ou enviar resumo diário:', err);
        }
    });

    console.log('Agendamento de envio de resumo diário configurado.');
};

module.exports = sendGroupSummary;
