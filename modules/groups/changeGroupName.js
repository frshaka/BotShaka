const schedule = require('node-schedule');

module.exports = (client, groupId, groupNameChangeTime) => {
    // Função para alterar o nome do grupo
    const changeGroupName = async () => {
        try {
            const chat = await client.getChatById(groupId);
            if (chat.isGroup) {
                const novoNome = '气 GvG - ???';
                await chat.setSubject(novoNome);
                console.log(`Nome do grupo alterado para: ${novoNome}`);
            }
        } catch (error) {
            console.error(`Erro ao alterar o nome do grupo ${groupId}:`, error);
        }
    };

    // Agenda a alteração do nome do grupo
    const [changeHour, changeMinute] = groupNameChangeTime.split(':');
    schedule.scheduleJob({ hour: parseInt(changeHour), minute: parseInt(changeMinute), dayOfWeek: [new schedule.Range(1, 6)] }, changeGroupName);
};
