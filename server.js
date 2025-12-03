const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // serve index.html, script.js, style.css, etc.

// Log simples de todas as requisições para ajudar a diagnosticar 404/rotas
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} -> ${req.method} ${req.url}`);
  next();
});


// ======================== ALUNOS ========================

// Criar aluno
app.post("/alunos", (req, res) => {
  const { nome, faz_ingles, faz_portugues, faz_matematica, responsavel, observacoes } = req.body;

  if (!nome) {
    return res.status(400).json({ erro: "Nome é obrigatório" });
  }

  const sql = `
    INSERT INTO alunos (nome, faz_ingles, faz_portugues, faz_matematica, responsavel, observacoes)
    VALUES (?,?,?,?,?,?)
  `;

  db.run(
    sql,
    [
      nome,
      faz_ingles ? 1 : 0,
      faz_portugues ? 1 : 0,
      faz_matematica ? 1 : 0,
      responsavel || null,
      observacoes || null
    ],
    function (err) {
      if (err) {
        console.error("Erro ao inserir aluno:", err);
        return res.status(500).json({ erro: "Erro ao inserir aluno" });
      }
      res.json({ id: this.lastID });
    }
  );
});

// Listar alunos
app.get("/alunos", (req, res) => {
  db.all(`SELECT * FROM alunos ORDER BY nome`, (err, rows) => {
    if (err) {
      console.error("Erro ao listar alunos:", err);
      return res.status(500).json({ erro: "Erro ao listar alunos" });
    }
    res.json(rows);
  });
});

// Atualizar aluno
app.put("/alunos/:id", (req, res) => {
  const id = req.params.id;
  const { nome, faz_ingles, faz_portugues, faz_matematica, responsavel, observacoes } = req.body;

  if (!nome) {
    return res.status(400).json({ erro: "Nome é obrigatório" });
  }

  const sql = `
    UPDATE alunos
    SET
      nome = ?,
      faz_ingles = ?,
      faz_portugues = ?,
      faz_matematica = ?,
      responsavel = ?,
      observacoes = ?
    WHERE id = ?
  `;

  db.run(
    sql,
    [
      nome,
      faz_ingles ? 1 : 0,
      faz_portugues ? 1 : 0,
      faz_matematica ? 1 : 0,
      responsavel || null,
      observacoes || null,
      id
    ],
    function (err) {
      if (err) {
        console.error("Erro ao atualizar aluno:", err);
        return res.status(500).json({ erro: "Erro ao atualizar aluno" });
      }
      res.json({ atualizado: this.changes > 0 });
    }
  );
});

// Excluir aluno (e apagar horários/presenças ligados a ele)
app.delete("/alunos/:id", (req, res) => {
  const id = req.params.id;

  const sqlHor = `DELETE FROM horarios_semanais WHERE aluno_id = ?`;
  const sqlPres = `DELETE FROM presencas WHERE aluno_id = ?`;
  const sqlAluno = `DELETE FROM alunos WHERE id = ?`;

  db.serialize(() => {
    db.run(sqlHor, [id], (err) => {
      if (err) console.error("Erro ao deletar horários do aluno:", err);
    });
    db.run(sqlPres, [id], (err) => {
      if (err) console.error("Erro ao deletar presenças do aluno:", err);
    });
    db.run(sqlAluno, [id], function (err) {
      if (err) {
        console.error("Erro ao deletar aluno:", err);
        return res.status(500).json({ erro: "Erro ao deletar aluno" });
      }
      res.json({ removido: this.changes > 0 });
    });
  });
});


// ======================== HORÁRIOS SEMANAIS ========================

// Listar horários semanais de um aluno
app.get("/alunos/:id/horarios", (req, res) => {
  const aluno_id = req.params.id;
  console.log(`/alunos/${aluno_id}/horarios solicitado`);

  const sql = `
    SELECT * FROM horarios_semanais
    WHERE aluno_id = ?
    ORDER BY dia_semana, hora_inicio
  `;

  db.all(sql, [aluno_id], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar horários do aluno:", err);
      return res.status(500).json({ erro: "Erro ao buscar horários" });
    }
    res.json(rows);
  });
});

// Criar horário semanal para um aluno
app.post("/alunos/:id/horarios", (req, res) => {
  const aluno_id = req.params.id;
  const { dia_semana, hora_inicio, hora_fim } = req.body;

  if (!dia_semana || !hora_inicio || !hora_fim) {
    return res.status(400).json({ erro: "dia_semana, hora_inicio e hora_fim são obrigatórios" });
  }

  const sql = `
    INSERT INTO horarios_semanais (aluno_id, dia_semana, hora_inicio, hora_fim)
    VALUES (?,?,?,?)
  `;

  db.run(sql, [aluno_id, dia_semana, hora_inicio, hora_fim], function (err) {
    if (err) {
      console.error("Erro ao inserir horário:", err);
      return res.status(500).json({ erro: "Erro ao inserir horário" });
    }
    res.json({ id: this.lastID });
  });
});

// Atualizar horário semanal específico
app.put("/horarios/:id", (req, res) => {
  const id = req.params.id;
  const { dia_semana, hora_inicio, hora_fim } = req.body;

  if (!dia_semana || !hora_inicio || !hora_fim) {
    return res.status(400).json({ erro: "dia_semana, hora_inicio e hora_fim são obrigatórios" });
  }

  const sql = `
    UPDATE horarios_semanais
    SET dia_semana = ?, hora_inicio = ?, hora_fim = ?
    WHERE id = ?
  `;

  db.run(sql, [dia_semana, hora_inicio, hora_fim, id], function (err) {
    if (err) {
      console.error("Erro ao atualizar horário:", err);
      return res.status(500).json({ erro: "Erro ao atualizar horário" });
    }
    res.json({ atualizado: this.changes > 0 });
  });
});

// Excluir horário semanal específico
app.delete("/horarios/:id", (req, res) => {
  const id = req.params.id;

  const sql = `DELETE FROM horarios_semanais WHERE id = ?`;

  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Erro ao excluir horário:", err);
      return res.status(500).json({ erro: "Erro ao excluir horário" });
    }
    res.json({ removido: this.changes > 0 });
  });
});


// ======================== AGENDA (PLANEJADA) ========================

// Função auxiliar: receber "YYYY-MM-DD" e devolver código do dia_semana
function getDiaSemanaFromISODate(dataISO) {
  const dias = ["DOMINGO", "SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO"];
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const d = new Date(ano, mes - 1, dia);
  return dias[d.getDay()];
}

// Agenda planejada para uma DATA específica (YYYY-MM-DD)
// Ex: GET /agenda/data/2025-11-19
app.get("/agenda/data/:data", (req, res) => {
  const data = req.params.data; // "YYYY-MM-DD"
  const dia_semana = getDiaSemanaFromISODate(data);

  console.log("Rota /agenda/data chamada com:", data, "->", dia_semana);

  const sql = `
    SELECT h.*, a.nome, a.faz_ingles, a.faz_portugues, a.faz_matematica
    FROM horarios_semanais h
    JOIN alunos a ON a.id = h.aluno_id
    WHERE h.dia_semana = ?
    ORDER BY h.hora_inicio, a.nome
  `;

  db.all(sql, [dia_semana], (err, rows) => {
    if (err) {
      console.error("Erro na query /agenda/data:", err);
      return res.status(500).json({ erro: "Erro ao buscar agenda da data" });
    }
    // sempre devolve esse formato
    res.json({
      data,
      dia_semana,
      horarios: rows
    });
  });
});

// Agenda de um dia da semana (planejado)
// Exemplo: GET /agenda/dia/SEGUNDA, /agenda/dia/TERCA, etc.
app.get("/agenda/dia/:dia_semana", (req, res) => {
  const dia_semana = req.params.dia_semana; // "SEGUNDA", "TERCA", ...

  console.log("Rota /agenda/dia chamada com:", dia_semana);

  const sql = `
    SELECT h.*, a.nome, a.faz_ingles, a.faz_portugues, a.faz_matematica
    FROM horarios_semanais h
    JOIN alunos a ON a.id = h.aluno_id
    WHERE h.dia_semana = ?
    ORDER BY h.hora_inicio, a.nome
  `;

  db.all(sql, [dia_semana], (err, rows) => {
    if (err) {
      console.error("Erro na query /agenda/dia:", err);
      return res.status(500).json({ erro: "Erro ao buscar agenda do dia" });
    }
    res.json(rows);
  });
});

// Agenda semanal: conta quantos alunos existem por hora/dia
// Resposta no formato:
// {
//   "14:00": { "SEGUNDA": 3, "TERCA": 1, ... },
//   "15:00": { "SEGUNDA": 0, "TERCA": 2, ... }
// }
app.get("/agenda/semanal", (req, res) => {
  const dias = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO"];

  const sql = `
    SELECT hora_inicio, dia_semana
    FROM horarios_semanais
  `;

  db.all(sql, (err, rows) => {
    if (err) {
      console.error("Erro ao carregar grade semanal:", err);
      return res.status(500).json({ erro: "Erro ao carregar grade semanal" });
    }

    console.log(`/agenda/semanal atendido - linhas: ${rows.length}`);

    const horas = [...new Set(rows.map(r => r.hora_inicio))].sort();

    const mapa = {};
    horas.forEach(hora => {
      mapa[hora] = {};
      dias.forEach(d => {
        mapa[hora][d] = 0;
      });
    });

    rows.forEach(r => {
      if (mapa[r.hora_inicio] && mapa[r.hora_inicio][r.dia_semana] !== undefined) {
        mapa[r.hora_inicio][r.dia_semana]++;
      }
    });

    res.json(mapa);
  });
});


// ======================== PRESENÇAS ========================

// Registrar ENTRADA
app.post("/presencas/entrada", (req, res) => {
  const { aluno_id } = req.body;
  const agora = new Date();
  const data = agora.toISOString().slice(0, 10); // "YYYY-MM-DD"
  const hora = agora.toTimeString().slice(0, 5); // "HH:MM"

  const sql = `
    INSERT INTO presencas (aluno_id, data, hora_entrada, status)
    VALUES (?,?,?,?)
  `;

  db.run(sql, [aluno_id, data, hora, "PRESENTE"], function (err) {
    if (err) {
      console.error("Erro ao registrar entrada:", err);
      return res.status(500).json({ erro: "Erro ao registrar entrada" });
    }
    res.json({ id: this.lastID, data, hora_entrada: hora });
  });
});

// Registrar SAÍDA (opcional, não é chamado direto pelo front atual)
app.post("/presencas/saida", (req, res) => {
  const { presenca_id } = req.body;
  const agora = new Date();
  const hora = agora.toTimeString().slice(0, 5);

  const sql = `
    UPDATE presencas
    SET hora_saida = ?
    WHERE id = ?
  `;

  db.run(sql, [hora, presenca_id], function (err) {
    if (err) {
      console.error("Erro ao registrar saída:", err);
      return res.status(500).json({ erro: "Erro ao registrar saída" });
    }
    res.json({ presenca_id, hora_saida: hora });
  });
});

// Marcar falta manual
app.post("/presencas/falta", (req, res) => {
  const { aluno_id, data } = req.body;
  const dia = data || new Date().toISOString().slice(0, 10);

  const sql = `
    INSERT INTO presencas (aluno_id, data, status)
    VALUES (?,?,?)
  `;

  db.run(sql, [aluno_id, dia, "FALTA"], function (err) {
    if (err) {
      console.error("Erro ao registrar falta:", err);
      return res.status(500).json({ erro: "Erro ao registrar falta" });
    }
    res.json({ id: this.lastID });
  });
});

// Listar presenças de uma DATA específica: /presencas/data/2025-11-21
app.get("/presencas/data/:data", (req, res) => {
  const data = req.params.data; // formato "YYYY-MM-DD"

  const sql = `
    SELECT p.*, a.nome
    FROM presencas p
    JOIN alunos a ON a.id = p.aluno_id
    WHERE p.data = ?
  `;

  db.all(sql, [data], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar presenças da data:", err);
      return res.status(500).json({ erro: "Erro ao buscar presenças da data" });
    }
    res.json(rows);
  });
});

// Atualizar uma presença (hora_entrada, hora_saida, status, observacao_dia)
app.put("/presencas/:id", (req, res) => {
  const id = req.params.id;
  const { hora_entrada, hora_saida, status, observacao_dia } = req.body;

  const sql = `
    UPDATE presencas
    SET hora_entrada = ?, hora_saida = ?, status = ?, observacao_dia = ?
    WHERE id = ?
  `;

  db.run(sql, [hora_entrada || null, hora_saida || null, status || null, observacao_dia || null, id], function (err) {
    if (err) {
      console.error("Erro ao atualizar presença:", err);
      return res.status(500).json({ erro: "Erro ao atualizar presença" });
    }
    res.json({ atualizado: this.changes > 0 });
  });
});

// Excluir presença específica
app.delete("/presencas/:id", (req, res) => {
  const id = req.params.id;

  const sql = `DELETE FROM presencas WHERE id = ?`;

  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Erro ao excluir presença:", err);
      return res.status(500).json({ erro: "Erro ao excluir presença" });
    }
    res.json({ removido: this.changes > 0 });
  });
});


// ======================== ESTATÍSTICAS ========================

// Geral de alunos: total e por disciplina
app.get("/stats/geral", (req, res) => {
  const sql = `
    SELECT 
      COUNT(*) AS total_alunos,
      SUM(faz_ingles)     AS total_ingles,
      SUM(faz_portugues)  AS total_portugues,
      SUM(faz_matematica) AS total_matematica
    FROM alunos
  `;

  db.get(sql, (err, row) => {
    if (err) {
      console.error("Erro ao buscar stats gerais:", err);
      return res.status(500).json({ erro: "Erro ao buscar estatísticas gerais" });
    }
    res.json(
      row || {
        total_alunos: 0,
        total_ingles: 0,
        total_portugues: 0,
        total_matematica: 0
      }
    );
  });
});

// Estatísticas de presenças por data: GET /stats/presencas/2025-11-24
app.get("/stats/presencas/:data", (req, res) => {
  const data = req.params.data; // "YYYY-MM-DD"

  const sql = `
    SELECT 
      COUNT(*) AS total_registros,
      SUM(CASE WHEN status = 'PRESENTE' THEN 1 ELSE 0 END) AS presentes,
      SUM(CASE WHEN status = 'FALTA'    THEN 1 ELSE 0 END) AS faltas
    FROM presencas
    WHERE data = ?
  `;

  db.get(sql, [data], (err, row) => {
    if (err) {
      console.error("Erro ao buscar stats de presenças:", err);
      return res.status(500).json({ erro: "Erro ao buscar stats de presenças" });
    }
    res.json(
      row || {
        total_registros: 0,
        presentes: 0,
        faltas: 0
      }
    );
  });
});


// ======================== INICIAR SERVIDOR ========================

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
