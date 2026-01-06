document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("atividade-form");
  const resultadoDiv = document.getElementById("resultado");
  const resultadoText = document.getElementById("resultado-text");
  const copyButton = document.getElementById("copy-button");

  form.addEventListener("submit", handleFormSubmit);
  copyButton.addEventListener("click", handleCopyButtonClick);

  function handleFormSubmit(event) {
    event.preventDefault();

    const capitulo = document.getElementById("capitulo").value.trim();
    const atividadesInput = document.getElementById("atividade").value.trim();

    if (!capitulo || !atividadesInput) {
      showToast("Erro", "Preencha o nome do capítulo e as atividades", "error");
      return;
    }

    fetch("gabarito.json")
      .then((response) => response.json())
      .then((data) => processarAtividades(data.atividades, capitulo, atividadesInput))
      .catch(() => {
        showToast("Erro", "Erro ao carregar gabarito", "error");
      });
  }

  function processarAtividades(atividadesGabarito, capitulo, atividadesInput) {
    const linhas = atividadesInput.split("\n").map(l => l.trim()).filter(Boolean);

    const atividadesUsuario = [];
    for (let i = 0; i < linhas.length; i += 2) {
      const nome = linhas[i];
      const data = linhas[i + 1];

      if (!nome || !data || !isDataValida(data)) continue;

      atividadesUsuario.push({
        nomeOriginal: nome,
        nomeNormalizado: normalizarTexto(nome),
        data
      });
    }

    const resultado = [];
    const usadas = new Set();

    atividadesUsuario.forEach((usuario) => {
      const match = encontrarMelhorMatch(atividadesGabarito, usuario.nomeNormalizado);

      if (!match) {
        resultado.push(`[ERRO] ${usuario.nomeOriginal}: atividade não existe no gabarito.`);
        return;
      }

      if (usadas.has(match.nome)) {
        resultado.push(`[ERRO] ${match.nome}: atividade duplicada.`);
        return;
      }

      usadas.add(match.nome);

      const validacao = validarAtividade(match, usuario.data);
      resultado.push(validacao);
    });

    atividadesGabarito.forEach((atividade) => {
      if (!usadas.has(atividade.nome)) {
        resultado.push(`[ERRO] ${atividade.nome}: não foi informada.`);
      }
    });

    exibirResultado(capitulo, resultado);
  }

  function encontrarMelhorMatch(atividades, nomeUsuario) {
    let melhor = null;
    let maiorScore = 0;

    atividades.forEach((atividade) => {
      const nomeGabarito = normalizarTexto(atividade.nome);
      const score = similaridade(nomeUsuario, nomeGabarito);

      if (score > maiorScore) {
        maiorScore = score;
        melhor = atividade;
      }
    });

    return maiorScore >= 0.75 ? melhor : null;
  }

  function validarAtividade(atividade, dataUsuarioStr) {
    const dataUsuario = parseData(dataUsuarioStr);
    const dataGabarito = parseData(atividade.data);

    const erros = [];

    if (!dataUsuario || !dataGabarito) {
      return `[ERRO] ${atividade.nome}: data inválida.`;
    }

    if (atividade.mes_obrigatorio) {
      const mesUsuario = String(dataUsuario.getMonth() + 1).padStart(2, "0");
      if (mesUsuario !== atividade.mes_obrigatorio) {
        erros.push(`mês obrigatório ${atividade.mes_obrigatorio}`);
      }
    }

    if (atividade.validacao) {
      if (atividade.nome.toLowerCase() === "comissões permanentes") {
        const limite = new Date(2025, 7, 31);
        if (dataUsuario > limite) {
          erros.push("prazo máximo 31/08/2025");
        }
      } else {
        const limite = new Date(2025, 11, 20);
        if (dataUsuario > limite) {
          erros.push("prazo máximo 20/12/2025");
        }
      }
    }

    if (erros.length === 0) {
      return `[OK] ${atividade.nome} (${dataUsuarioStr}) está correta.`;
    }

    return `[ERRO] ${atividade.nome}: ${erros.join(" e ")}.`;
  }

  function normalizarTexto(texto) {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function similaridade(a, b) {
    if (a === b) return 1;
    const distancia = levenshtein(a, b);
    const max = Math.max(a.length, b.length);
    return 1 - distancia / max;
  }

  function levenshtein(a, b) {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  function isDataValida(data) {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(data)) return false;

    const [dia, mes, ano] = data.split("/").map(Number);
    const date = new Date(ano, mes - 1, dia);

    return date.getFullYear() === ano && date.getMonth() === mes - 1 && date.getDate() === dia;
  }

  function parseData(data) {
    if (!isDataValida(data)) return null;
    const [dia, mes, ano] = data.split("/").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  function exibirResultado(capitulo, resultado) {
    const capituloNormalizado = normalizarTexto(capitulo);
    const temCapitulo = capituloNormalizado.includes("capitulo");
    const titulo = temCapitulo ? capitulo : `Capítulo: ${capitulo}`;

    resultadoText.textContent = `${titulo}\n\n${resultado.join("\n")}`;
    resultadoDiv.classList.remove("hidden");
  }

  function handleCopyButtonClick() {
    const texto = resultadoText.textContent;

    navigator.clipboard.writeText(texto).then(() => {
      playNotificationSound();
      showToast("Sucesso", "Resultado copiado para a área de transferência");
    }).catch(() => {
      showToast("Erro", "Falha ao copiar", "error");
    });
  }

  function playNotificationSound() {
    try {
      const audio = new Audio("assets/notify.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
  }

  function showToast(title, message, type = "success") {
    const existing = document.querySelector(".toast-notification");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "toast-notification";

    const icon = type === "success"
      ? '<i class="ph ph-check-circle"></i>'
      : '<i class="ph ph-warning-circle"></i>';

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <div class="toast-progress"></div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);

    setTimeout(() => {
      toast.classList.add("hide");
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
});
