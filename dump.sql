PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

CREATE TABLE alunos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  faz_ingles INTEGER DEFAULT 0,
  faz_portugues INTEGER DEFAULT 0,
  faz_matematica INTEGER DEFAULT 0,
  responsavel TEXT,
  observacoes TEXT
);

INSERT INTO alunos VALUES(1,'João Silva',1,0,1,'Ana Paula','Aluno novo, dificuldade em matemática.');
INSERT INTO alunos VALUES(2,'Lucas Mendes',1,1,0,'Carla Mendes','Aluno muito dedicado.');
INSERT INTO alunos VALUES(3,'André Carvalho',0,1,0,'Júlia Carvalho','KC, Aluno novo');
INSERT INTO alunos VALUES(4,'Fulaninho da Silva',1,1,1,'Mãe do fulaninho','Aluno KC, não faz final de semana.');
INSERT INTO alunos VALUES(5,'João Pedro',0,1,1,'Joaninha M.','Aluno KC e Papel');
INSERT INTO alunos VALUES(7,'Luíz Augusto',0,1,0,'Fernanda','Kc');
INSERT INTO alunos VALUES(8,'Jonas Melo',1,1,0,'Mariana','KC');
INSERT INTO alunos VALUES(9,'Beatriz Castro',0,0,1,'Jane Castro','Risco de sair!');
INSERT INTO alunos VALUES(10,'Alice Mendes',0,1,1,'Maria M','KC');
INSERT INTO alunos VALUES(11,'Luan Moroni',1,0,1,'Sheilla','Melhorzin que ta teno');

CREATE TABLE horarios_semanais (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  aluno_id INTEGER NOT NULL,
  dia_semana TEXT NOT NULL,          -- "SEGUNDA", "TERCA" etc.
  hora_inicio TEXT NOT NULL,         -- "14:00"
  hora_fim TEXT NOT NULL,            -- "15:00"
  FOREIGN KEY (aluno_id) REFERENCES alunos(id)
);

INSERT INTO horarios_semanais VALUES(1,1,'SEGUNDA','14:00','15:00');
INSERT INTO horarios_semanais VALUES(2,1,'TERCA','15:00','16:30');
INSERT INTO horarios_semanais VALUES(4,2,'SEXTA','09:30','10:15');
INSERT INTO horarios_semanais VALUES(7,4,'SEGUNDA','08:30','10:45');
INSERT INTO horarios_semanais VALUES(8,4,'SEXTA','09:00','11:15');
INSERT INTO horarios_semanais VALUES(9,2,'SEGUNDA','16:30','17:15');
INSERT INTO horarios_semanais VALUES(12,3,'SEGUNDA','09:30','10:15');
INSERT INTO horarios_semanais VALUES(13,3,'QUINTA','10:00','10:45');
INSERT INTO horarios_semanais VALUES(14,7,'TERCA','09:00','09:45');
INSERT INTO horarios_semanais VALUES(15,7,'QUINTA','09:00','09:45');
INSERT INTO horarios_semanais VALUES(16,9,'SEGUNDA','17:15','18:00');
INSERT INTO horarios_semanais VALUES(17,9,'SEXTA','17:15','18:00');
INSERT INTO horarios_semanais VALUES(18,11,'SEGUNDA','10:00','11:30');
INSERT INTO horarios_semanais VALUES(19,11,'QUINTA','10:00','11:30');

CREATE TABLE presencas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  aluno_id INTEGER NOT NULL,
  data TEXT NOT NULL,                -- "2025-11-21"
  hora_entrada TEXT,                 -- "14:07"
  hora_saida TEXT,                   -- "15:02"
  status TEXT,                       -- "PRESENTE" ou "FALTA"
  observacao_dia TEXT,
  FOREIGN KEY (aluno_id) REFERENCES alunos(id)
);

INSERT INTO presencas VALUES(1,2,'2025-11-22','22:39',NULL,'PRESENTE',NULL);
INSERT INTO presencas VALUES(3,7,'2025-12-02','09:02','09:50','PRESENTE','Não trouxe as tarefas de casa. sentiu dificuldade em conectores.');

PRAGMA foreign_keys=ON;
COMMIT;
