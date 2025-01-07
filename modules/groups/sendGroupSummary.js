const schedule = require('node-schedule');
const GroupsMonitor = require('../monitor/GroupsMonitor'); // Importa o módulo do monitor de grupos

const SEU_NUMERO = '5515991236228'; // Substitua pelo seu número no formato internacional

const sendGroupSummary = (client) => {
    // Agendar envio diário às 15:49 (exemplo de horário)
    schedule.scheduleJob('55 15 * * *', async () => {
        console.log(`[LOG] Iniciando envio de resumo diário às ${new Date().toISOString()}`);

        try {
            // Obter a lista de chats
            console.log(`[LOG] Tentando obter chats do cliente...`);
            const grupos = await client.getChats();

            if (!grupos || grupos.length === 0) {
                console.log(`[LOG] Nenhum grupo foi encontrado.`);
                return;
            }

            console.log(`[LOG] Total de chats encontrados: ${grupos.length}`);

            // Processar cada grupo
            for (const grupo of grupos) {
                if (grupo.isGroup) {
                    console.log(`[LOG] Gerando resumo para o grupo: ${grupo.name}`);

                    try {
                        // Gerar resumo
                        const resumo = await GroupsMonitor.gerarResumoDiario(grupo.id._serialized, client);

                        if (resumo) {
                            console.log(`[LOG] Resumo gerado com sucesso para o grupo: ${grupo.name}`);
                            
                            // Enviar resumo para o número configurado
                            await client.sendMessage(
                                `${SEU_NUMERO}@c.us`,
                                `📂 **Grupo: ${grupo.name}**\n${resumo}`
                            );

                            console.log(`[LOG] Resumo enviado com sucesso para o grupo: ${grupo.name}`);
                        } else {
                            console.log(`[LOG] Nenhum resumo foi gerado para o grupo: ${grupo.name}`);
                        }
                    } catch (grupoErr) {
                        console.error(`[ERRO] Falha ao processar o grupo ${grupo.name}:`, grupoErr);
                    }
                } else {
                    console.log(`[LOG] Ignorando chat que não é grupo: ${grupo.name || grupo.id._serialized}`);
                }
            }
        } catch (err) {
            console.error(`[ERRO] Falha geral no envio de resumos diários:`, err);
        }
    });

    console.log(`[LOG] Agendamento de envio de resumo diário configurado.`);
};

module.exports = sendGroupSummary;
