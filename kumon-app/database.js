const { Client } = require('pg');

// Configurações do banco PostgreSQL
const db = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar no banco PostgreSQL:', err);
  } else {
    console.log('Conectado ao banco de dados PostgreSQL');
  }
});

// Criar as tabelas se não existirem
db.query(`
  CREATE TABLE IF NOT EXISTS alunos (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    faz_ingles INTEGER DEFAULT 0,
    faz_portugues INTEGER DEFAULT 0,
    faz_matematica INTEGER DEFAULT 0,
    responsavel TEXT,
    observacoes TEXT
  );
  
  CREATE TABLE IF NOT EXISTS horarios_semanais (
    id SERIAL PRIMARY KEY,
    aluno_id INTEGER NOT NULL,
    dia_semana TEXT NOT NULL,          
    hora_inicio TEXT NOT NULL,         
    hora_fim TEXT NOT NULL,            
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS presencas (
    id SERIAL PRIMARY KEY,
    aluno_id INTEGER NOT NULL,
    data TEXT NOT NULL,                
    hora_entrada TEXT,                 
    hora_saida TEXT,                   
    status TEXT,                       
    observacao_dia TEXT,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
  );
`);

module.exports = db;
