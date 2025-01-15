const schedule = require('node-schedule');
const GroupsMonitor = require('../monitor/GroupsMonitor'); // Importa o módulo do monitor de grupos

// Lista de números para envio do resumo (no formato internacional)
const NUMEROS_DESTINATARIOS = [
    '5515991236228', // Substitua pelos números desejados
    '5516982274243',
    '5521981389149',
];

const sendGroupSummary = (client) => {
    schedule.scheduleJob('0 23 * * *', async () => {
        try {
            console.log('Iniciando envio de resumo diário...');
            const grupos = await client.getChats();

            for (const grupo of grupos) {
                if (grupo.isGroup) {
                    console.log(`Gerando resumo para o grupo: ${grupo.name}`);
                    const resumo = await GroupsMonitor.gerarResumoDiario(grupo.id._serialized, client);

                    if (resumo) {
                        // Envia para cada número da lista
                        for (const numero of NUMEROS_DESTINATARIOS) {
                            await client.sendMessage(`${numero}@c.us`, `📂 **Grupo: ${grupo.name}**\n${resumo}`);
                            console.log(`Resumo enviado para o número ${numero} referente ao grupo: ${grupo.name}`);
                        }
                    } else {
                        console.log(`Nenhuma movimentação no grupo ${grupo.name}, resumo não enviado.`);
                    }
                }
            }
        } catch (err) {
            console.error('Erro ao gerar ou enviar resumo diário:', err);
        }
    });

    console.log('Agendamento de envio de resumo diário configurado.');
};

module.exports = sendGroupSummary;
