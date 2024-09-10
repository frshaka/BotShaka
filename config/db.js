const { Pool } = require('pg');

// Configurações da conexão com o banco de dados PostgreSQL
const pool = new Pool({
  user: 'postgres',            // Substitua pelo seu usuário do PostgreSQL
  host: 'localhost',           // Host do banco de dados
  database: 'eneasredpill',        // Nome do banco de dados
  password: 'postgres',        // Senha do usuário
  port: 5432,                  // Porta padrão do PostgreSQLß
});

// Conectar ao banco de dados
pool.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados PostgreSQL:', err.stack);
  } else {
    console.log('Conectado ao banco de dados PostgreSQL.');
  }
});

// Criar tabela 'players' se não existir
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY,  -- ou INTEGER se o ID for numérico
    nick VARCHAR(50) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(15) UNIQUE NOT NULL
  );
`;

pool.query(createTableQuery, (err, res) => {
  if (err) {
    console.error('Erro ao criar a tabela players:', err.stack);
  } else {
    console.log('Tabela players criada com sucesso ou já existe.');
  }
});

// Função para adicionar um novo jogador com ID fornecido externamente
async function addPlayer(id, nick, nome, telefone) {
  const query = `INSERT INTO players (id, nick, nome, telefone) VALUES ($1, $2, $3, $4) RETURNING *`;
  const values = [id, nick, nome, telefone];

  try {
    const res = await pool.query(query, values);
    console.log('Jogador adicionado:', res.rows[0]);
    return res.rows[0]; // Retorna o jogador adicionado
  } catch (err) {
    console.error('Erro ao adicionar jogador:', err.stack);
    return null; // Retorna null em caso de erro
  }
}

// Função para verificar se o jogador existe
async function getPlayerByPhone(telefone) {
  const query = `SELECT * FROM players WHERE telefone = $1`;
  const values = [telefone];

  try {
    const res = await pool.query(query, values);
    return res.rows[0];
  } catch (err) {
    console.error('Erro ao buscar jogador por telefone:', err.stack);
    return null;
  }
}

// Função para inativar um jogador pelo ID
async function inativarPlayerID(id) {
  const query = `UPDATE players SET ativo = 'N' WHERE id = $1 RETURNING *`;
  const values = [id];

  try {
    const res = await pool.query(query, values);
    if (res.rowCount > 0) {
      console.log('Jogador inativado:', res.rows[0]);
      return res.rows[0];
    } else {
      console.log('Nenhum jogador encontrado com o ID fornecido.');
      return null;
    }
  } catch (err) {
    console.error('Erro ao inativar jogador:', err.stack);
    return null;
  }
}

// Função para inativar um jogador pelo Telefone
async function inativarPlayerTelefone(telefone) {
  const query = `UPDATE players SET ativo = 'N' WHERE telefone = $1 RETURNING *`;
  const values = [telefone];

  try {
    const res = await pool.query(query, values);
    if (res.rowCount > 0) {
      console.log('Jogador inativado:', res.rows[0]);
      return res.rows[0];
    } else {
      console.log('Nenhum jogador encontrado com o Telefone fornecido.');
      return null;
    }
  } catch (err) {
    console.error('Erro ao inativar jogador:', err.stack);
    return null;
  }
}

// Função para inativar um jogador pelo ID
async function ativarPlayerID(id) {
  const query = `UPDATE players SET ativo = 'S' WHERE id = $1 RETURNING *`;
  const values = [id];

  try {
    const res = await pool.query(query, values);
    if (res.rowCount > 0) {
      console.log('Jogador inativado:', res.rows[0]);
      return res.rows[0];
    } else {
      console.log('Nenhum jogador encontrado com o ID fornecido.');
      return null;
    }
  } catch (err) {
    console.error('Erro ao inativar jogador:', err.stack);
    return null;
  }
}

// Função para inativar um jogador pelo Telefone
async function ativarPlayerTelefone(telefone) {
  const query = `UPDATE players SET ativo = 'S' WHERE telefone = $1 RETURNING *`;
  const values = [telefone];

  try {
    const res = await pool.query(query, values);
    if (res.rowCount > 0) {
      console.log('Jogador inativado:', res.rows[0]);
      return res.rows[0];
    } else {
      console.log('Nenhum jogador encontrado com o Telefone fornecido.');
      return null;
    }
  } catch (err) {
    console.error('Erro ao inativar jogador:', err.stack);
    return null;
  }
}

module.exports = {
  addPlayer,
  getPlayerByPhone,
  inativarPlayerID,
  inativarPlayerTelefone,
  ativarPlayerID,
  ativarPlayerTelefone,
};
