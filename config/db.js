const { Pool } = require('pg');

// URL de conexão fornecida pelo Coolify
const databaseUrl = 'postgres://postgres:postgres@s04g8ckw0sgokkw0kwcc0048:5432/postgres';

// Função para obter uma nova conexão com o banco eneasredpill
function getEneasDBPool() {
    return new Pool({
        user: 'postgres',
        password: 'postgres',
        host: 's04g8ckw0sgokkw0kwcc0048',
        port: 5432,
        database: 'eneasredpill'
    });
}

// Pool para administração inicial
const poolAdmin = new Pool({
    user: 'postgres',
    password: 'postgres',
    host: 's04g8ckw0sgokkw0kwcc0048',
    port: 5432,
    database: 'postgres'
});

// Pool para o banco eneasredpill
let pool;

// Função para verificar e criar o banco de dados, se necessário
async function createDatabaseIfNotExists() {
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = 'eneasredpill'`;
    const createDbQuery = `CREATE DATABASE eneasredpill WITH OWNER postgres`;

    try {
        const res = await poolAdmin.query(checkDbQuery);
        if (res.rowCount === 0) {
            console.log("Banco de dados 'eneasredpill' não encontrado. Criando...");
            await poolAdmin.query(createDbQuery);
            await poolAdmin.query(`GRANT ALL PRIVILEGES ON DATABASE eneasredpill TO postgres`);
            console.log("Banco de dados 'eneasredpill' criado com sucesso.");
        } else {
            console.log("Banco de dados 'eneasredpill' já existe.");
        }
    } catch (err) {
        console.error('Erro ao verificar/criar o banco de dados:', err.stack);
        throw err;
    } finally {
        await poolAdmin.end();
    }

    // Inicializa o pool para o banco eneasredpill
    pool = getEneasDBPool();
}

// Função para criar tabelas no banco de dados
async function createTables() {
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

    const createMessagesTableQuery = `
        CREATE TABLE IF NOT EXISTS mensagens (
            id SERIAL PRIMARY KEY,
            grupo_id VARCHAR(255) NOT NULL,
            usuario_id VARCHAR(255) NOT NULL,
            horario TIMESTAMP NOT NULL,
            conteudo TEXT,
            links TEXT[],
            sentimento VARCHAR(50)
        );
    `;

    const createSentimentosTableQuery = `
        CREATE TABLE IF NOT EXISTS sentimentos (
            palavra TEXT PRIMARY KEY,
            pontuacao INT NOT NULL
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

        console.log('Criando tabela mensagens...');
        await pool.query(createMessagesTableQuery);
        console.log('Tabela mensagens criada ou já existente.');

        console.log('Criando tabela sentimentos...');
        await pool.query(createSentimentosTableQuery);
        console.log('Tabela sentimentos criada ou já existente.');
    } catch (err) {
        console.error('Erro ao criar tabelas:', err.stack);
        throw err;
    }
}

// Funções CRUD para os jogadores
async function addPlayer(id, nick, name, phone) {
    const query = `INSERT INTO erp_players (id, nick, name, phone) VALUES ($1, $2, $3, $4) RETURNING *`;
    const values = [id, nick, name, phone];

    try {
        const res = await pool.query(query, values);
        console.log('Jogador adicionado:', res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error('Erro ao adicionar jogador:', err.stack);
        return null;
    }
}

async function getPlayerByPhone(phone) {
    const query = `SELECT * FROM erp_players WHERE phone LIKE $1`;
    const values = [`%${phone}`];

    try {
        const res = await pool.query(query, values);
        return res.rows[0];
    } catch (err) {
        console.error('Erro ao buscar jogador por telefone:', err.stack);
        return null;
    }
}

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

// Inicializa o banco de dados ao carregar o módulo
async function initializeDatabase() {
    try {
        await createDatabaseIfNotExists();
        await createTables();
        console.log('Inicialização completa.');
    } catch (err) {
        console.error('Erro na inicialização do banco de dados:', err.stack);
        throw err;
    }
}

// Inicializa o banco de dados
initializeDatabase()
    .then(() => console.log('Inicialização completa.'))
    .catch((err) => console.error('Erro na inicialização do banco de dados:', err.stack));

// Exporta funções e a função query
module.exports = {
    query: (text, params) => pool.query(text, params),
    addPlayer,
    getPlayerByPhone,
    deactivatePlayerByID,
    deactivatePlayerByPhone,
    activatePlayerByID,
    activatePlayerByPhone,
};