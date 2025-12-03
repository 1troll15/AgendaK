const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// Diretório configurável para armazenar o arquivo DB (via variável de ambiente)
const DB_DIR = process.env.DB_DIR || path.join(__dirname, "data"); // ou outro diretório configurável
const DB_FILE = process.env.DB_PATH || path.join(DB_DIR, "agenda.db");

// Garante que o diretório exista
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  console.log(`Criado diretório para DB: ${DB_DIR}`);
}

// Abre (ou cria) o arquivo agenda.db no caminho configurado
const db = new sqlite3.Database(DB_FILE);

// Garante que as chaves estrangeiras funcionem e cria as tabelas
db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

  // TABELA DE ALUNOS
  db.run(`
    CREATE TABLE IF NOT EXISTS alunos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      faz_ingles INTEGER DEFAULT 0,
      faz_portugues INTEGER DEFAULT 0,
      faz_matematica INTEGER DEFAULT 0,
      responsavel TEXT,
      observacoes TEXT
    )
  `);

  // TABELA DE HORÁRIOS SEMANAIS (AGENDA FIXA)
  db.run(`
    CREATE TABLE IF NOT EXISTS horarios_semanais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aluno_id INTEGER NOT NULL,
      dia_semana TEXT NOT NULL,
      hora_inicio TEXT NOT NULL,
      hora_fim TEXT NOT NULL,
      FOREIGN KEY (aluno_id) REFERENCES alunos(id)
    )
  `);

  // TABELA DE PRESENÇAS (O QUE ACONTECEU NO DIA)
  db.run(`
    CREATE TABLE IF NOT EXISTS presencas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aluno_id INTEGER NOT NULL,
      data TEXT NOT NULL,
      hora_entrada TEXT,
      hora_saida TEXT,
      status TEXT,
      observacao_dia TEXT,
      FOREIGN KEY (aluno_id) REFERENCES alunos(id)
    )
  `);

  // Seed seguro: só insere dados exemplo se não houver alunos
  db.get("SELECT COUNT(*) AS n FROM alunos", (err, row) => {
    if (err) {
      console.error("Erro ao checar seed:", err);
      return;
    }
    if (row && row.n === 0) {
      const stmt = db.prepare("INSERT INTO alunos (nome, responsavel) VALUES (?, ?)");
      stmt.run("Aluno Exemplo", "Responsável Exemplo");
      stmt.finalize();
      console.log("Seed inicial aplicada (1 aluno de exemplo).");
    }
  });
});

module.exports = db;
