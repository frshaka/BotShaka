const { google } = require('googleapis');
const mime = require('mime-types');
const fs = require('fs');

// Função para criar subdiretório no Google Drive
async function createSubdirectory(auth, parentFolderId, subdirectoryName) {
  const driveService = google.drive({ version: 'v3', auth });

  // Verificar se o subdiretório já existe
  const existingFolderResponse = await driveService.files.list({
    q: `'${parentFolderId}' in parents and name='${subdirectoryName}' and mimeType='application/vnd.google-apps.folder'`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (existingFolderResponse.data.files.length > 0) {
    // Subdiretório já existe
    console.log('Subdiretório já existe:', existingFolderResponse.data.files[0].id);
    return existingFolderResponse.data.files[0].id;
  } else {
    // Criar novo subdiretório
    const fileMetadata = {
      'name': subdirectoryName,
      'mimeType': 'application/vnd.google-apps.folder',
      'parents': [parentFolderId]
    };

    const folder = await driveService.files.create({
      resource: fileMetadata,
      fields: 'id'
    });

    console.log('Subdiretório criado com sucesso:', folder.data.id);
    return folder.data.id;
  }
}

// Função para fazer upload no Google Drive
async function uploadToGoogleDrive(auth, fileName, filePath, parentFolderId) {
  const driveService = google.drive({ version: 'v3', auth });

  const fileMetadata = {
    'name': fileName,
    'parents': [parentFolderId]
  };

  const media = {
    mimeType: mime.lookup(filePath),
    body: fs.createReadStream(filePath)
  };

  const response = await driveService.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id'
  });

  return response.data;
}

module.exports = {
  createSubdirectory,
  uploadToGoogleDrive,
};
