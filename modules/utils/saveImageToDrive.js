const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { google } = require('googleapis');
const { createSubdirectory, uploadToGoogleDrive } = require('./googleDriveHelpers');
const db = require('../../config/db'); // Importe o db.js da pasta config

module.exports = (client) => {
    client.on('message', async msg => {
        if (!msg.from.endsWith('@g.us')) {
            console.log('Mensagem não é de um grupo:', msg.from);

            if (msg.hasMedia) {
                console.log('Mensagem contém mídia.');

                try {
                    const media = await msg.downloadMedia();
                    console.log('Mídia baixada:', media);

                    if (media && media.mimetype && media.mimetype.startsWith('image/')) {
                        console.log('A mídia é uma imagem.');

                        const fileName = `image_${Date.now()}.jpg`;
                        const filePath = path.join(__dirname, '../../uploads', fileName);

                        // Salva a imagem localmente
                        fs.writeFileSync(filePath, media.data, { encoding: 'base64' });
                        console.log('Arquivo salvo localmente em:', filePath);

                        // Busca o jogador pelo telefone
                        const telefone = msg.from.replace('@c.us', ''); // Ajuste conforme necessário para o formato do telefone
                        const player = await db.getPlayerByPhone(telefone);

                        if (player) {
                            const folderName = `${player.id}_${player.nick}`;

                            // Configuração da autenticação Google
                            const auth = new google.auth.GoogleAuth({
                                keyFile: path.join(__dirname, '../../config/credentials.json'), // Caminho atualizado para o arquivo credentials.json
                                scopes: ['https://www.googleapis.com/auth/drive.file']
                            });

                            // Criar ou obter ID do subdiretório com o nome no formato ID_NICK
                            const userSubdirectoryId = await createSubdirectory(auth, '1aWwRvo8t3cgZ_RVywhw90K0n1AMj_cMm', folderName);

                            // Faz upload para o subdiretório do Google Drive
                            try {
                                const driveResponse = await uploadToGoogleDrive(auth, fileName, filePath, userSubdirectoryId);
                                console.log('Arquivo enviado para o Google Drive com sucesso:', driveResponse.id);
                            } catch (error) {
                                console.error('Erro ao enviar arquivo para o Google Drive:', error);
                            }
                        } else {
                            console.log('Jogador não encontrado para o telefone:', telefone);
                        }
                    } else {
                        console.log('A mídia não é uma imagem.');
                    }
                } catch (error) {
                    console.error('Erro ao baixar a mídia:', error);
                }
            } else {
                console.log('A mensagem não contém mídia. Valor de msg.hasMedia:', msg.hasMedia);
            }
        }
    });
};
