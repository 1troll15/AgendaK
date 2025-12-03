const sqlite3 = require("sqlite3").verbose();

// cria (ou abre) o arquivo agenda.db
const db = new sqlite3.Database("./agenda.db");

// garante que foreign keys funcionem
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
      dia_semana TEXT NOT NULL,          -- "SEGUNDA", "TERCA" etc.
      hora_inicio TEXT NOT NULL,         -- "14:00"
      hora_fim TEXT NOT NULL,            -- "15:00"
      FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
    )
  `);

  // TABELA DE PRESENÇAS (O QUE ACONTECEU NO DIA)
  db.run(`
    CREATE TABLE IF NOT EXISTS presencas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aluno_id INTEGER NOT NULL,
      data TEXT NOT NULL,                -- "2025-11-21"
      hora_entrada TEXT,                 -- "14:07"
      hora_saida TEXT,                   -- "15:02"
      status TEXT,                       -- "PRESENTE" ou "FALTA"
      observacao_dia TEXT,
      FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
    )
  `);
});

module.exports = db;
