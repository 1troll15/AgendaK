const API_BASE = ""; // mesma origem: http://localhost:3000

let alunos = [];
let alunoSelecionadoId = null;
let filtroNome = "";
let filtroDisciplina = "";

document.addEventListener("DOMContentLoaded", () => {
  // carregar dados iniciais
  carregarAlunos();
  carregarGradeSemanal();
  carregarStatsGerais();

  // formulário de aluno
  const formAluno = document.getElementById("form-aluno");
  if (formAluno) {
    formAluno.addEventListener("submit", async (e) => {
      e.preventDefault();
      await salvarAluno();
      await carregarStatsGerais();
    });
  }

  // formulário de horário
  const formHorario = document.getElementById("form-horario");
  if (formHorario) {
    formHorario.addEventListener("submit", async (e) => {
      e.preventDefault();
      await salvarHorario();
    });
  }

  // filtros da lista de alunos
  const inputFiltroNome = document.getElementById("filtro-nome");
  const selectFiltroDisciplina = document.getElementById("filtro-disciplina");

  if (inputFiltroNome) {
    inputFiltroNome.addEventListener("input", () => {
      filtroNome = inputFiltroNome.value.toLowerCase();
      renderizarListaAlunos();
    });
  }

  if (selectFiltroDisciplina) {
    selectFiltroDisciplina.addEventListener("change", () => {
      filtroDisciplina = selectFiltroDisciplina.value;
      renderizarListaAlunos();
    });
  }

  // botão NOVO ALUNO
  const btnNovoAluno = document.getElementById("btn-novo-aluno");
  if (btnNovoAluno) {
    btnNovoAluno.addEventListener("click", () => {
      limparFormularioAluno();
      renderizarListaAlunos(); // some o destaque do aluno antigo
    });
  }

  // botão EXCLUIR ALUNO
  const btnExcluirAluno = document.getElementById("btn-excluir-aluno");
  if (btnExcluirAluno) {
    btnExcluirAluno.addEventListener("click", excluirAluno);
  }

  // agenda por dia da semana
  const btnCarregarAgenda = document.getElementById("btn-carregar-agenda");
  if (btnCarregarAgenda) {
    btnCarregarAgenda.addEventListener("click", carregarAgendaDia);
  }
  carregarAgendaDia(); // carrega padrão na abertura

  // PRESENÇAS POR DIA
  const inputDataPresencas = document.getElementById("presencas-data");
  const hojeISO = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  if (inputDataPresencas) {
    inputDataPresencas.value = hojeISO;
  }

  const btnPresencas = document.getElementById("btn-presencas-carregar");
  if (btnPresencas) {
    btnPresencas.addEventListener("click", () => {
      const data = inputDataPresencas ? inputDataPresencas.value : hojeISO;
      carregarPresencasDaData(data);
    });
  }

  // carrega presenças de hoje na abertura
  carregarPresencasDaData(hojeISO);
});


// ============= ALUNOS =============

async function carregarAlunos() {
  try {
    const resp = await fetch(`${API_BASE}/alunos`);
    if (!resp.ok) {
      const texto = await resp.text();
      console.error("Erro HTTP ao carregar alunos:", resp.status, texto);
      alert(`Erro ao carregar alunos (HTTP ${resp.status}).`);
      return;
    }

    alunos = await resp.json();
    renderizarListaAlunos();
  } catch (err) {
    console.error("Erro de rede ou parse ao carregar alunos:", err);
    alert("Erro ao carregar alunos (veja o console).");
  }
}

function renderizarListaAlunos() {
  const lista = document.getElementById("lista-alunos");
  if (!lista) return;

  lista.innerHTML = "";

  const alunosFiltrados = alunos.filter((aluno) => {
    const nome = (aluno.nome || "").toLowerCase();
    const nomeOk = nome.includes(filtroNome || "");

    let discOk = true;
    if (filtroDisciplina === "ING") discOk = !!aluno.faz_ingles;
    else if (filtroDisciplina === "PORT") discOk = !!aluno.faz_portugues;
    else if (filtroDisciplina === "MAT") discOk = !!aluno.faz_matematica;

    return nomeOk && discOk;
  });

  if (!alunosFiltrados.length) {
    lista.innerHTML = "<p>Nenhum aluno encontrado.</p>";
    return;
  }

  alunosFiltrados.forEach((aluno) => {
    const div = document.createElement("div");
    div.className = "item-aluno";
    if (aluno.id === alunoSelecionadoId) {
      div.classList.add("selecionado");
    }

    const disciplinas = [];
    if (aluno.faz_ingles) disciplinas.push("ING");
    if (aluno.faz_portugues) disciplinas.push("PORT");
    if (aluno.faz_matematica) disciplinas.push("MAT");

    div.innerHTML = `
      <strong>${aluno.nome}</strong><br>
      <small>Resp.: ${aluno.responsavel || "-"}</small><br>
      <small>Disciplinas: ${disciplinas.join(", ") || "-"}</small>
    `;

    div.addEventListener("click", () => selecionarAluno(aluno.id));
    lista.appendChild(div);
  });
}

async function salvarAluno() {
  const isEdicao = !!alunoSelecionadoId;

  const nome = document.getElementById("aluno-nome").value.trim();
  const faz_ingles = document.getElementById("aluno-ingles").checked;
  const faz_portugues = document.getElementById("aluno-portugues").checked;
  const faz_matematica = document.getElementById("aluno-matematica").checked;
  const responsavel = document.getElementById("aluno-responsavel").value.trim();
  const observacoes = document.getElementById("aluno-observacoes").value.trim();

  if (!nome) {
    alert("Informe o nome do aluno.");
    return;
  }

  const payload = {
    nome,
    faz_ingles,
    faz_portugues,
    faz_matematica,
    responsavel,
    observacoes
  };

  try {
    const url = isEdicao
      ? `${API_BASE}/alunos/${alunoSelecionadoId}`
      : `${API_BASE}/alunos`;

    const method = isEdicao ? "PUT" : "POST";

    console.log("[salvarAluno] isEdicao =", isEdicao, "method =", method, "url =", url);

    const resp = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) throw new Error("Erro ao salvar aluno");

    await carregarAlunos();

    if (!isEdicao) {
      limparFormularioAluno();
    } else {
      alert("Aluno atualizado com sucesso.");
    }
  } catch (err) {
    console.error(err);
    alert("Erro ao salvar aluno.");
  }
}

function limparFormularioAluno() {
  const form = document.getElementById("form-aluno");
  if (form) form.reset();

  alunoSelecionadoId = null; // zera o aluno selecionado

  const info = document.getElementById("aluno-selecionado-info");
  const areaHorarios = document.getElementById("area-horarios");
  const btnSalvar = document.getElementById("btn-salvar-aluno");

  if (info) info.textContent = "Nenhum aluno selecionado.";
  if (areaHorarios) areaHorarios.classList.add("escondido");
  if (btnSalvar) btnSalvar.textContent = "Salvar aluno";
}

async function selecionarAluno(id) {
  alunoSelecionadoId = id;

  renderizarListaAlunos();

  const aluno = alunos.find((a) => a.id === id);
  const info = document.getElementById("aluno-selecionado-info");
  const areaHorarios = document.getElementById("area-horarios");

  if (!aluno) {
    if (info) info.textContent = "Nenhum aluno selecionado.";
    if (areaHorarios) areaHorarios.classList.add("escondido");
    return;
  }

  const disciplinas = [];
  if (aluno.faz_ingles) disciplinas.push("Inglês");
  if (aluno.faz_portugues) disciplinas.push("Português");
  if (aluno.faz_matematica) disciplinas.push("Matemática");

  if (info) {
    info.innerHTML = `
      <strong>${aluno.nome}</strong><br>
      Responsável: ${aluno.responsavel || "-"}<br>
      Disciplinas: ${disciplinas.join(", ") || "-"}
    `;
  }

  if (areaHorarios) areaHorarios.classList.remove("escondido");

  // preenche formulário para edição
  document.getElementById("aluno-nome").value = aluno.nome || "";
  document.getElementById("aluno-ingles").checked = !!aluno.faz_ingles;
  document.getElementById("aluno-portugues").checked = !!aluno.faz_portugues;
  document.getElementById("aluno-matematica").checked = !!aluno.faz_matematica;
  document.getElementById("aluno-responsavel").value = aluno.responsavel || "";
  document.getElementById("aluno-observacoes").value = aluno.observacoes || "";

  const btnSalvar = document.getElementById("btn-salvar-aluno");
  if (btnSalvar) btnSalvar.textContent = "Atualizar aluno";

  await carregarHorariosAluno();
}

async function excluirAluno() {
  if (!alunoSelecionadoId) {
    alert("Selecione um aluno primeiro.");
    return;
  }

  const ok = confirm("Tem certeza que deseja excluir este aluno?");
  if (!ok) return;

  try {
    const resp = await fetch(`${API_BASE}/alunos/${alunoSelecionadoId}`, {
      method: "DELETE"
    });
    if (!resp.ok) throw new Error("Erro ao excluir aluno");

    alunoSelecionadoId = null;
    limparFormularioAluno();
    await carregarAlunos();
    await carregarStatsGerais();
  } catch (err) {
    console.error(err);
    alert("Erro ao excluir aluno.");
  }
}


// ============= HORÁRIOS SEMANAIS EDITÁVEIS =============

async function carregarHorariosAluno() {
  if (!alunoSelecionadoId) {
    console.warn("carregarHorariosAluno chamado sem alunoSelecionadoId");
    return;
  }

  try {
    const url = `${API_BASE}/alunos/${alunoSelecionadoId}/horarios`;
    console.log("Solicitando horários:", url);
    const resp = await fetch(url);

    if (!resp.ok) {
      const texto = await resp.text().catch(() => "(não foi possível ler resposta)");
      console.error(`Erro HTTP ao carregar horários: ${resp.status}`, texto);
      alert(`Erro ao carregar horários (HTTP ${resp.status}). Veja console.`);
      return;
    }

    const horarios = await resp.json();
    renderizarHorarios(horarios);
  } catch (err) {
    console.error("Erro ao carregar horários (network/json):", err);
    alert("Erro ao carregar horários (veja o console).");
  }
}

function renderizarHorarios(horarios) {
  const lista = document.getElementById("lista-horarios");
  if (!lista) return;

  lista.innerHTML = "";

  if (!horarios.length) {
    lista.innerHTML = "<p>Nenhum horário cadastrado para este aluno.</p>";
    return;
  }

  horarios.forEach((h) => {
    const div = document.createElement("div");
    div.className = "item-horario";

    const selectDia = document.createElement("select");
    selectDia.innerHTML = `
      <option value="SEGUNDA">Segunda</option>
      <option value="TERCA">Terça</option>
      <option value="QUARTA">Quarta</option>
      <option value="QUINTA">Quinta</option>
      <option value="SEXTA">Sexta</option>
      <option value="SABADO">Sábado</option>
    `;
    selectDia.value = h.dia_semana;

    const inputInicio = document.createElement("input");
    inputInicio.type = "time";
    inputInicio.value = h.hora_inicio;

    const inputFim = document.createElement("input");
    inputFim.type = "time";
    inputFim.value = h.hora_fim;

    const btnSalvar = document.createElement("button");
    btnSalvar.textContent = "Salvar";
    btnSalvar.classList.add("btn", "btn-secondary");

    const btnExcluir = document.createElement("button");
    btnExcluir.textContent = "Excluir";
    btnExcluir.classList.add("btn", "btn-danger");

    btnSalvar.addEventListener("click", async () => {
      await atualizarHorario(h.id, selectDia.value, inputInicio.value, inputFim.value);
      await carregarHorariosAluno();
      carregarGradeSemanal();
    });

    btnExcluir.addEventListener("click", async () => {
      const ok = confirm("Tem certeza que deseja excluir este horário?");
      if (!ok) return;
      await excluirHorario(h.id);
      await carregarHorariosAluno();
      carregarGradeSemanal();
    });

    div.appendChild(selectDia);
    div.appendChild(inputInicio);
    div.appendChild(inputFim);
    div.appendChild(btnSalvar);
    div.appendChild(btnExcluir);

    lista.appendChild(div);
  });
}

async function atualizarHorario(id, dia_semana, hora_inicio, hora_fim) {
  try {
    const resp = await fetch(`${API_BASE}/horarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dia_semana, hora_inicio, hora_fim })
    });
    if (!resp.ok) throw new Error("Erro ao atualizar horário");
  } catch (err) {
    console.error(err);
    alert("Erro ao atualizar horário.");
  }
}

async function excluirHorario(id) {
  try {
    const resp = await fetch(`${API_BASE}/horarios/${id}`, {
      method: "DELETE"
    });
    if (!resp.ok) throw new Error("Erro ao excluir horário");
  } catch (err) {
    console.error(err);
    alert("Erro ao excluir horário.");
  }
}

async function salvarHorario() {
  if (!alunoSelecionadoId) {
    alert("Selecione um aluno primeiro.");
    return;
  }

  const dia_semana = document.getElementById("horario-dia").value;
  const hora_inicio = document.getElementById("horario-inicio").value;
  const hora_fim = document.getElementById("horario-fim").value;

  if (!dia_semana || !hora_inicio || !hora_fim) {
    alert("Preencha dia, horário de início e fim.");
    return;
  }

  const payload = { dia_semana, hora_inicio, hora_fim };

  try {
    const resp = await fetch(`${API_BASE}/alunos/${alunoSelecionadoId}/horarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) throw new Error("Erro ao salvar horário");

    document.getElementById("form-horario").reset();
    await carregarHorariosAluno();
    carregarGradeSemanal();
  } catch (err) {
    console.error(err);
    alert("Erro ao salvar horário.");
  }
}


// ============= AGENDA POR DIA (SEMANAL) =============

async function carregarAgendaDia() {
  const selectDia = document.getElementById("agenda-dia-select");
  const area = document.getElementById("agenda-dia-resultado");
  if (!selectDia || !area) return;

  const dia_semana = selectDia.value;
  area.innerHTML = "<p>Carregando...</p>";

  try {
    const resp = await fetch(`${API_BASE}/agenda/dia/${dia_semana}`);
    if (!resp.ok) {
      const texto = await resp.text();
      console.error("Erro HTTP na agenda do dia:", resp.status, texto);
      area.innerHTML = `<p>Erro ao carregar agenda (HTTP ${resp.status}).</p>`;
      return;
    }

    const lista = await resp.json();

    if (!lista.length) {
      area.innerHTML = "<p>Não há alunos agendados para este dia.</p>";
      return;
    }

    area.innerHTML = "";

    lista.forEach((item) => {
      const div = document.createElement("div");
      div.className = "item-agenda";

      const disciplinas = [];
      if (item.faz_ingles) disciplinas.push("ING");
      if (item.faz_portugues) disciplinas.push("PORT");
      if (item.faz_matematica) disciplinas.push("MAT");

      div.innerHTML = `
        <strong>${item.hora_inicio} às ${item.hora_fim}</strong><br>
        ${item.nome} <small>(${disciplinas.join(", ") || "-"})</small>
      `;
      area.appendChild(div);
    });
  } catch (err) {
    console.error("Erro ao carregar agenda do dia", err);
    area.innerHTML = "<p>Erro ao carregar agenda.</p>";
  }
}


// ============= VISÃO SEMANAL (GRADE) =============

async function carregarGradeSemanal() {
  const container = document.getElementById("grade-semanal-container");
  if (!container) return;

  container.innerHTML = "Carregando...";

  try {
    const resp = await fetch(`${API_BASE}/agenda/semanal`);
    if (!resp.ok) {
      const texto = await resp.text();
      console.error("Erro HTTP na grade:", resp.status, texto);
      container.innerHTML = `<p>Erro ao carregar grade (HTTP ${resp.status}).</p>`;
      return;
    }

    const dados = await resp.json();

    const dias = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO"];
    const diasLabel = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    const horas = Object.keys(dados).sort();

    if (!horas.length) {
      container.innerHTML = "<p>Não há horários cadastrados ainda.</p>";
      return;
    }

    let html = `
      <table class="tabela-grade">
        <thead>
          <tr>
            <th>Horário</th>
            ${diasLabel.map((d) => `<th>${d}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
    `;

    horas.forEach((hora) => {
      html += `<tr><td><strong>${hora}</strong></td>`;

      dias.forEach((diaCod) => {
        const linhaDia = dados[hora] || {};
        const qtd = linhaDia[diaCod] || 0;

        const classe =
          qtd === 0
            ? "celula-vazia"
            : qtd <= 3
            ? "celula-ok"
            : qtd <= 6
            ? "celula-moderada"
            : "celula-cheia";

        html += `<td class="${classe}">${qtd}</td>`;
      });

      html += "</tr>";
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
  } catch (err) {
    console.error("Erro ao carregar grade semanal", err);
    container.innerHTML = "<p>Erro ao carregar grade.</p>";
  }
}


// ============= PRESENÇAS POR DIA (FLEXÍVEL) =============

async function carregarPresencasDaData(dataISO) {
  const info = document.getElementById("hoje-info");
  const listaDiv = document.getElementById("hoje-lista");

  if (!listaDiv) return;

  if (!dataISO) {
    listaDiv.innerHTML = "<p>Selecione uma data.</p>";
    return;
  }

  listaDiv.innerHTML = "<p>Carregando...</p>";

  try {
    // 1) Agenda planejada da data
    const respAgenda = await fetch(`${API_BASE}/agenda/data/${dataISO}`);
    if (!respAgenda.ok) {
      const texto = await respAgenda.text();
      console.error("Erro HTTP em /agenda/data:", respAgenda.status, texto);
      listaDiv.innerHTML = `<p>Erro ao carregar dados da agenda (HTTP ${respAgenda.status}).</p>`;
      return;
    }

    const dadosAgenda = await respAgenda.json();
    const dia_semana = dadosAgenda.dia_semana;
    const horarios = dadosAgenda.horarios || [];

    // 2) Presenças registradas da data
    const respPresencas = await fetch(`${API_BASE}/presencas/data/${dataISO}`);
    if (!respPresencas.ok) {
      const texto2 = await respPresencas.text();
      console.error("Erro HTTP em /presencas/data:", respPresencas.status, texto2);
      listaDiv.innerHTML = `<p>Erro ao carregar presenças (HTTP ${respPresencas.status}).</p>`;
      return;
    }

    const presencas = await respPresencas.json();

    const mapaPresencas = {};
    presencas.forEach((p) => {
      mapaPresencas[p.aluno_id] = p;
    });

    // Atualiza estatísticas de presenças da data
    carregarStatsPresencas(dataISO);

    if (info) {
      info.textContent = `Data: ${formatarDataBR(dataISO)} — ${formatarDiaSemana(dia_semana)}`;
    }

    if (!horarios.length) {
      listaDiv.innerHTML = "<p>Não há alunos agendados para este dia.</p>";
      return;
    }

    listaDiv.innerHTML = "";

    horarios.forEach((item) => {
      const div = document.createElement("div");
      div.className = "item-agenda";

      const presenca = mapaPresencas[item.aluno_id];

      const disciplinas = [];
      if (item.faz_ingles) disciplinas.push("ING");
      if (item.faz_portugues) disciplinas.push("PORT");
      if (item.faz_matematica) disciplinas.push("MAT");

      let inputEntradaHTML = "";
      let inputSaidaHTML = "";
      let obsHTML = "";
      let statusTexto = "Sem registro ainda";
      let botoesHTML = "";

      if (presenca) {
        const entradaVal = presenca.hora_entrada || "";
        const saidaVal = presenca.hora_saida || "";
        const obsVal = presenca.observacao_dia || "";

        inputEntradaHTML = `<input type="time" class="input-entrada" value="${entradaVal}">`;
        inputSaidaHTML = `<input type="time" class="input-saida" value="${saidaVal}">`;
        obsHTML = `<textarea class="input-observacao" rows="2" placeholder="Observações do dia...">${obsVal}</textarea>`;

        statusTexto = presenca.status || "PRESENTE";

        botoesHTML = `
          <button data-acao="salvar-presenca" data-presenca-id="${presenca.id}" class="btn btn-secondary">Salvar edição</button>
          <button data-acao="excluir-presenca" data-presenca-id="${presenca.id}" class="btn btn-danger">Excluir registro</button>
        `;
      } else {
        const hojeISO = new Date().toISOString().slice(0, 10);
        if (dataISO === hojeISO) {
          botoesHTML = `
            <button data-acao="entrada-agora" data-aluno-id="${item.aluno_id}" class="btn btn-primary">Registrar entrada agora</button>
            <button data-acao="falta" data-aluno-id="${item.aluno_id}" class="btn btn-danger">Marcar falta</button>
          `;
        } else {
          statusTexto = "Sem presença registrada nesta data.";
        }
        obsHTML = "-";
      }

      div.innerHTML = `
        <strong>${item.hora_inicio} às ${item.hora_fim}</strong><br>
        ${item.nome} <small>(${disciplinas.join(", ") || "-"})</small><br>
        <small>Status: ${statusTexto}</small><br>
        <div style="margin-top: 4px; display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
          <span>Entrada:</span> ${inputEntradaHTML || "-"}
          <span>Saída:</span> ${inputSaidaHTML || "-"}
        </div>
        <div style="margin-top: 6px;">
          <span style="font-size:12px; color:#6b7280;">Obs. do dia:</span><br>
          ${obsHTML}
        </div>
        <div style="margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap;">
          ${botoesHTML}
        </div>
      `;

      div.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const acao = btn.getAttribute("data-acao");

          if (acao === "entrada-agora") {
            const alunoId = Number(btn.getAttribute("data-aluno-id"));
            await registrarEntrada(alunoId);
          } else if (acao === "falta") {
            const alunoId = Number(btn.getAttribute("data-aluno-id"));
            await registrarFalta(alunoId, dataISO);
          } else if (acao === "salvar-presenca") {
            const presencaId = Number(btn.getAttribute("data-presenca-id"));
            const container = btn.closest(".item-agenda");
            const inputEntrada = container.querySelector(".input-entrada");
            const inputSaida = container.querySelector(".input-saida");
            const inputObs = container.querySelector(".input-observacao");

            const novaEntrada = inputEntrada ? inputEntrada.value : null;
            const novaSaida = inputSaida ? inputSaida.value : null;
            const novaObs = inputObs ? inputObs.value.trim() : null;

            await atualizarPresenca(presencaId, novaEntrada, novaSaida, novaObs);
          } else if (acao === "excluir-presenca") {
            const presencaId = Number(btn.getAttribute("data-presenca-id"));
            const ok = confirm("Excluir este registro de presença?");
            if (ok) {
              await excluirPresenca(presencaId);
            }
          }

          await carregarPresencasDaData(dataISO);
        });
      });

      listaDiv.appendChild(div);
    });
  } catch (err) {
    console.error("Erro ao carregar presenças da data", err);
    listaDiv.innerHTML = "<p>Erro ao carregar dados.</p>";
  }
}

async function registrarEntrada(aluno_id) {
  try {
    const resp = await fetch(`${API_BASE}/presencas/entrada`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aluno_id: Number(aluno_id) })
    });
    if (!resp.ok) throw new Error("Erro ao registrar entrada");
  } catch (err) {
    console.error(err);
    alert("Erro ao registrar entrada.");
  }
}

async function registrarFalta(aluno_id, dataISO) {
  try {
    const body = { aluno_id: Number(aluno_id) };
    if (dataISO) body.data = dataISO;

    const resp = await fetch(`${API_BASE}/presencas/falta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!resp.ok) throw new Error("Erro ao registrar falta");
  } catch (err) {
    console.error(err);
    alert("Erro ao registrar falta.");
  }
}

async function atualizarPresenca(id, hora_entrada, hora_saida, observacao_dia) {
  try {
    const payload = {
      hora_entrada: hora_entrada || null,
      hora_saida: hora_saida || null,
      status: "PRESENTE",
      observacao_dia: observacao_dia || null
    };

    const resp = await fetch(`${API_BASE}/presencas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) throw new Error("Erro ao atualizar presença");
  } catch (err) {
    console.error(err);
    alert("Erro ao atualizar presença.");
  }
}

async function excluirPresenca(id) {
  try {
    const resp = await fetch(`${API_BASE}/presencas/${id}`, {
      method: "DELETE"
    });
    if (!resp.ok) throw new Error("Erro ao excluir presença");
  } catch (err) {
    console.error(err);
    alert("Erro ao excluir presença.");
  }
}


// ============= ESTATÍSTICAS (FRONT) =============

async function carregarStatsGerais() {
  try {
    const resp = await fetch(`${API_BASE}/stats/geral`);
    if (!resp.ok) return;

    const stats = await resp.json();

    const totalAlunosEl = document.getElementById("stat-total-alunos");
    const totalIngEl = document.getElementById("stat-total-ingles");
    const totalPortEl = document.getElementById("stat-total-portugues");
    const totalMatEl = document.getElementById("stat-total-matematica");

    if (totalAlunosEl) totalAlunosEl.textContent = stats.total_alunos || 0;
    if (totalIngEl) totalIngEl.textContent = stats.total_ingles || 0;
    if (totalPortEl) totalPortEl.textContent = stats.total_portugues || 0;
    if (totalMatEl) totalMatEl.textContent = stats.total_matematica || 0;
  } catch (err) {
    console.error("Erro ao carregar stats gerais", err);
  }
}

async function carregarStatsPresencas(dataISO) {
  const el = document.getElementById("stat-presencas-data");
  if (!el || !dataISO) return;

  try {
    const resp = await fetch(`${API_BASE}/stats/presencas/${dataISO}`);
    if (!resp.ok) {
      el.textContent = "0 presentes / 0 faltas";
      return;
    }

    const stats = await resp.json();
    const presentes = stats.presentes || 0;
    const faltas = stats.faltas || 0;

    el.textContent = `${presentes} presentes / ${faltas} faltas`;
  } catch (err) {
    console.error("Erro ao carregar stats de presenças", err);
    el.textContent = "0 presentes / 0 faltas";
  }
}


// ============= UTIL =============

function formatarDiaSemana(codigo) {
  const mapa = {
    SEGUNDA: "Segunda",
    TERCA: "Terça",
    QUARTA: "Quarta",
    QUINTA: "Quinta",
    SEXTA: "Sexta",
    SABADO: "Sábado",
    DOMINGO: "Domingo"
  };
  return mapa[codigo] || codigo;
}

function formatarDataBR(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}
