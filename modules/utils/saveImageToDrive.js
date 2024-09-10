const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { createSubdirectory, uploadToGoogleDrive } = require('./googleDriveHelpers');
const db = require('../../config/db'); // Importe o db.js da pasta config

module.exports = (client) => {
    client.on('message', async msg => {
        if (!msg.from.endsWith('@g.us')) {
            if (msg.hasMedia) {
                try {
                    const media = await msg.downloadMedia();
                    if (media && media.mimetype && media.mimetype.startsWith('image/')) {
                        const fileName = `image_${Date.now()}.jpg`;
                        const filePath = path.join(__dirname, '../../uploads', fileName);

                        // Salva a imagem localmente
                        fs.writeFileSync(filePath, media.data, { encoding: 'base64' });

                        // Busca o jogador pelo telefone
                        const telefone = msg.from.replace('@c.us', ''); // Ajuste conforme necessário para o formato do telefone
                        const player = await db.getPlayerByPhone(telefone);

                        if (player) {
                            const folderName = `${player.nick}_${player.id}`;

                            // Configuração da autenticação Google
                            const auth = new google.auth.JWT({
                                keyFile: path.join(__dirname, '../../config/credentials.json'),
                                scopes: ['https://www.googleapis.com/auth/drive.file']
                            });

                            // Verifica se o subdiretório existe ou precisa ser criado, de maneira assíncrona
                            try {
                                const userSubdirectoryId = await createSubdirectory(auth, '1jncuW7XyFpcgPpTWOR0Llh_kPekoisa3', folderName);

                                // Array para acumular as promessas de upload e os arquivos
                                const uploadPromises = [];
                                const filesToDelete = []; // Array para acumular os caminhos dos arquivos a serem excluídos

                                // Faz upload para o subdiretório do Google Drive
                                const uploadPromise = uploadToGoogleDrive(auth, fileName, filePath, userSubdirectoryId);
                                uploadPromises.push(uploadPromise); // Acumula a promessa de upload
                                filesToDelete.push(filePath); // Acumula o arquivo para exclusão após o upload

                                // Aguarda que todos os uploads sejam concluídos
                                await Promise.all(uploadPromises);
                                console.log('Todos os arquivos foram enviados para o Google Drive com sucesso.');

                                // Exclui todos os arquivos locais após o upload
                                filesToDelete.forEach(file => {
                                    fs.unlinkSync(file);
                                    console.log('Arquivo local excluído:', file);
                                });

                            } catch (error) {
                                console.error('Erro ao criar ou verificar a pasta no Google Drive:', error);
                            }
                        } else {
                            console.log('Jogador não encontrado para o telefone:', telefone);
                        }
                    }
                } catch (error) {
                    console.error('Erro ao baixar a mídia:', error);
                }
            }
        }
    });
};
