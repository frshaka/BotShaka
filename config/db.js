const { Pool } = require('pg');

// Configurações da conexão inicial com o banco de dados padrão 'postgres'
const poolAdmin = new Pool({
  user: 'postgres',            // Substitua pelo seu usuário do PostgreSQL
  host: 'localhost',           // Host do banco de dados
  database: 'postgres',        // Banco de dados padrão onde você pode criar outros bancos
  password: 'postgres',        // Senha do usuário
  port: 5432,                  // Porta padrão do PostgreSQL
});

// Função para verificar e criar o banco de dados se não existir
async function createDatabaseIfNotExists() {
  const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = 'eneasredpill'`;
  const createDbQuery = `CREATE DATABASE eneasredpill`;

  try {
    const res = await poolAdmin.query(checkDbQuery);
    if (res.rowCount === 0) {
      console.log("Banco de dados 'eneasredpill' não encontrado. Criando...");
      await poolAdmin.query(createDbQuery);
      console.log("Banco de dados 'eneasredpill' criado com sucesso.");
    } else {
      console.log("Banco de dados 'eneasredpill' já existe.");
    }
  } catch (err) {
    console.error('Erro ao verificar/criar o banco de dados:', err.stack);
  } finally {
    poolAdmin.end(); // Fecha a conexão com o banco de dados postgres
  }
}

// Conexão ao banco de dados 'eneasredpill'
const pool = new Pool({
  user: 'postgres',            // Substitua pelo seu usuário do PostgreSQL
  host: 'localhost',           // Host do banco de dados
  database: 'eneasredpill',    // Nome do banco de dados a ser usado
  password: 'postgres',        // Senha do usuário
  port: 5432,                  // Porta padrão do PostgreSQL
});

// Função assíncrona para criar tabelas em ordem
async function createTables() {
  // Criar tabela 'erp_players' se não existir
  const createPlayersTableQuery = `
    CREATE TABLE IF NOT EXISTS erp_players (
      id INTEGER PRIMARY KEY,
      nick VARCHAR(50) NOT NULL,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(15) UNIQUE NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      is_adm BOOLEAN DEFAULT FALSE
    );
  `;

  const createGvgTableQuery = `
    CREATE TABLE IF NOT EXISTS erp_gvg (
      id UUID PRIMARY KEY,
      fk_id_erp_players INTEGER REFERENCES erp_players(id) ON DELETE CASCADE,
      is_gvg BOOLEAN DEFAULT FALSE,
      fixed BOOLEAN DEFAULT FALSE,
      rotation BOOLEAN DEFAULT FALSE
    );
  `;

  const createRelicsTeamTableQuery = `
    CREATE TABLE IF NOT EXISTS erp_relics_team (
      id UUID PRIMARY KEY,
      team VARCHAR(255) NOT NULL
    );
  `;

  const createRelicsPlayersTeamTableQuery = `
    CREATE TABLE IF NOT EXISTS erp_relics_players_team (
      id UUID PRIMARY KEY,
      fk_id_erp_relics_team UUID REFERENCES erp_relics_team(id) ON DELETE CASCADE,
      fk_id_erp_players INTEGER REFERENCES erp_players(id) ON DELETE CASCADE
    );
  `;

  const createRelicsDmgTableQuery = `
    CREATE TABLE IF NOT EXISTS erp_relics_dmg (
      id UUID PRIMARY KEY,
      fk_id_erp_players INTEGER REFERENCES erp_players(id) ON DELETE CASCADE,
      fk_id_erp_relics_players_team UUID REFERENCES erp_relics_players_team(id) ON DELETE CASCADE,
      session VARCHAR(255) NOT NULL,
      boss VARCHAR(255) NOT NULL,
      damage VARCHAR(50) NOT NULL
    );
  `;

  try {
    console.log('Criando tabela erp_players...');
    await pool.query(createPlayersTableQuery);
    console.log('Tabela erp_players criada ou já existente.');

    console.log('Criando tabela erp_gvg...');
    await pool.query(createGvgTableQuery);
    console.log('Tabela erp_gvg criada ou já existente.');

    console.log('Criando tabela erp_relics_team...');
    await pool.query(createRelicsTeamTableQuery);
    console.log('Tabela erp_relics_team criada ou já existente.');

    console.log('Criando tabela erp_relics_players_team...');
    await pool.query(createRelicsPlayersTeamTableQuery);
    console.log('Tabela erp_relics_players_team criada ou já existente.');

    console.log('Criando tabela erp_relics_dmg...');
    await pool.query(createRelicsDmgTableQuery);
    console.log('Tabela erp_relics_dmg criada ou já existente.');
  } catch (err) {
    console.error('Erro ao criar tabelas:', err.stack);
  }
}

// Funções CRUD para os jogadores

// Função para adicionar um novo jogador
async function addPlayer(id, nick, name, phone) {
  const query = `INSERT INTO erp_players (id, nick, name, phone) VALUES ($1, $2, $3, $4) RETURNING *`;
  const values = [id, nick, name, phone];

  try {
    const res = await pool.query(query, values);
    console.log('Jogador adicionado:', res.rows[0]);
    return res.rows[0]; // Retorna o jogador adicionado
  } catch (err) {
    console.error('Erro ao adicionar jogador:', err.stack);
    return null; // Retorna null em caso de erro
  }
}

// Função para buscar jogador pelo telefone, com LIKE '%telefone'
async function getPlayerByPhone(phone) {
  const query = `SELECT * FROM erp_players WHERE phone LIKE $1`;  // Utilizando LIKE na consulta
  const values = [`%${phone}`];

  try {
    const res = await pool.query(query, values);
    return res.rows[0];
  } catch (err) {
    console.error('Erro ao buscar jogador por telefone:', err.stack);
    return null;
  }
}

// Função para inativar um jogador pelo ID
async function deactivatePlayerByID(id) {
  const query = `UPDATE erp_players SET is_active = FALSE WHERE id = $1 RETURNING *`;
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
async function deactivatePlayerByPhone(phone) {
  const query = `UPDATE erp_players SET is_active = FALSE WHERE phone = $1 RETURNING *`;
  const values = [phone];

  try {
    const res = await pool.query(query, values);
    if (res.rowCount > 0) {
      console.log('Jogador inativado:', res.rows[0]);
      return res.rows[0];
    } else {
      console.log('Nenhum jogador encontrado com o telefone fornecido.');
      return null;
    }
  } catch (err) {
    console.error('Erro ao inativar jogador:', err.stack);
    return null;
  }
}

// Função para ativar um jogador pelo ID
async function activatePlayerByID(id) {
  const query = `UPDATE erp_players SET is_active = TRUE WHERE id = $1 RETURNING *`;
  const values = [id];

  try {
    const res = await pool.query(query, values);
    if (res.rowCount > 0) {
      console.log('Jogador ativado:', res.rows[0]);
      return res.rows[0];
    } else {
      console.log('Nenhum jogador encontrado com o ID fornecido.');
      return null;
    }
  } catch (err) {
    console.error('Erro ao ativar jogador:', err.stack);
    return null;
  }
}

// Função para ativar um jogador pelo Telefone
async function activatePlayerByPhone(phone) {
  const query = `UPDATE erp_players SET is_active = TRUE WHERE phone = $1 RETURNING *`;
  const values = [phone];

  try {
    const res = await pool.query(query, values);
    if (res.rowCount > 0) {
      console.log('Jogador ativado:', res.rows[0]);
      return res.rows[0];
    } else {
      console.log('Nenhum jogador encontrado com o telefone fornecido.');
      return null;
    }
  } catch (err) {
    console.error('Erro ao ativar jogador:', err.stack);
    return null;
  }
}

// Função para inicializar o banco de dados e as tabelas
async function initializeDatabase() {
  await createDatabaseIfNotExists(); // Certifique-se de que o banco foi criado
  await createTables();              // Crie as tabelas em sequência
}

// Inicializa o banco de dados e as tabelas
initializeDatabase()
  .then(() => console.log('Inicialização completa.'))
  .catch((err) => console.error('Erro na inicialização do banco de dados:', err.stack))
  //.finally(() => pool.end()); // Fecha a conexão com o banco de dados 'eneasredpill'

// Exporta as funções CRUD
module.exports = {
  addPlayer,
  getPlayerByPhone,
  deactivatePlayerByID,
  deactivatePlayerByPhone,
  activatePlayerByID,
  activatePlayerByPhone,
};
