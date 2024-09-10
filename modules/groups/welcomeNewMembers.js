module.exports = (client) => {
  client.on('group_join', async (notification) => {

      const groupId = notification.id.remote;
      if (groupId === '120363260286196627@g.us'){
          for (const newParticipantId of notification.recipientIds) {
              try {
                  const txtMensagem = `Aeeeewww! Bem-vindo ao grupo da EneasRedpill. Para facilitar tanto a sua quanto a nossa vida, estou enviando algumas informações úteis e importantes.

*****ANTES DE QUALQUER COISA, NÃO ADIANTA ME RESPONDER OU ME ENVIAR MENSAGEM PRIVADA PORQUE EU SOU SÓ UM BOT!!!!!******

ID da Guilda: 37901102

Tag (Obrigatória): 气
      
Web: https://eneasredpill.com/
      
Comunidade: https://chat.whatsapp.com/HcuJY3SX6pR6zSHLwQIDKn
      
PDF:  https://rb.gy/i3fgtl
      
Contatos: https://docs.google.com/spreadsheets/d/1tGi5dqonfvdZarWHwLgNq8fAmUBH9Ce6SCrYVeaAMfU/edit?usp=sharing
      
Drive: https://drive.google.com/drive/folders/1we42S3Q6wRFrI0hJfttt04lkRzDo4Unx?usp=sharing
      
      
Finalidade dos grupos:
* Deepweb: Nenhuma;
* GvG: Organização da temporada de GvG;
* GvG SS: Organização da temporada de GvG da guild Soul Society;
* Alpha/Bravo: Eram para organização da temporada de Relics. Mas a próxima temporada teremos uma organização mais elaborada.
      

Se tiver alguma dúvida manda um salve pra qualquer membro da Adm da guilda que a gente te ajuda!!!

Contatos de suporte da EneasRedpill:
admin@eneasredpill.com
      
Contatos de suporte da Wanda no SSLOJ:
seiyaloj@gmail.com
https://instagram.com/saintseiyaloj.global?igshid=MzRlODBiNWFlZA==`;

                  // Envia uma mensagem de boas-vindas no privado do novo membro
                  await client.sendMessage(newParticipantId,  txtMensagem);
                  console.log(`Mensagem de boas-vindas enviada para: ${newParticipantId}`);
              } catch (error) {
                  console.error(`Erro ao enviar mensagem para ${newParticipantId}:`, error);
              }
          }
      }
  });
};
