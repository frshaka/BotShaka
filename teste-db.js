const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',             // Substitua pelos valores corretos
  host: 'localhost',
  database: 'eneasredpill',
  password: 'postgres',
  port: 5432,
});

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Conexão bem-sucedida:', res.rows[0]);
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } finally {
    pool.end();
  }
})();
