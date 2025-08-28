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
    const atividadesInput = document.getElementById("atividade").value;

    fetch("gabarito.json")
      .then((response) => response.json())
      .then((data) =>
        processarAtividades(data.atividades, capitulo, atividadesInput)
      )
      .catch((error) => console.error("Erro ao carregar o gabarito:", error));
  }

  function processarAtividades(atividadesGabarito, capitulo, atividadesInput) {
    const atividadesUsuario = atividadesInput
      .split("\n")
      .map((line) => line.trim());

    const atividadesUsuarioObjs = [];
    for (let i = 0; i < atividadesUsuario.length; i += 2) {
      const nomeOriginal = atividadesUsuario[i];
      const data = atividadesUsuario[i + 1];
      if (nomeOriginal && data && isDataValida(data)) {
        atividadesUsuarioObjs.push({
          nomeOriginal,
          nomeNormalizado: normalizarTexto(nomeOriginal),
          data,
        });
      }
    }

    let resultado = [];

    atividadesUsuarioObjs.forEach(({ nomeOriginal, nomeNormalizado, data }) => {
      const atividadeEncontrada = encontrarAtividade(
        atividadesGabarito,
        nomeNormalizado
      );
      if (atividadeEncontrada) {
        resultado.push(
          validarAtividade(atividadeEncontrada, nomeOriginal, data)
        );
      }
    });

    atividadesGabarito.forEach((atividade) => {
      const nomeGabaritoNormalizado = normalizarTexto(atividade.nome);
      const encontrada = atividadesUsuarioObjs.some(
        (obj) => obj.nomeNormalizado === nomeGabaritoNormalizado
      );
      if (!encontrada) {
        resultado.push(
          `❌ ${atividade.nome} não consta na lista de atividades informadas.`
        );
      }
    });

    exibirResultado(capitulo, resultado);
  }

  function encontrarAtividade(atividades, nomeAtividade) {
    return atividades.find(
      (atividade) =>
        normalizarTexto(nomeAtividade) === normalizarTexto(atividade.nome)
    );
  }

  function validarAtividade(atividadeEncontrada, nomeAtividade, dataAtividade) {
    const dataParts = dataAtividade.split("/");
    const dataUsuario = new Date(dataParts[2], dataParts[1] - 1, dataParts[0]);
    let erros = [];

    if (
      atividadeEncontrada.mes_obrigatorio &&
      atividadeEncontrada.mes_obrigatorio !== ""
    ) {
      const mesUsuario = (dataParts[1] || "").padStart(2, "0");
      if (mesUsuario !== atividadeEncontrada.mes_obrigatorio) {
        erros.push(
          `❌ ${atividadeEncontrada.nome}: Deve ser realizada no mês ${atividadeEncontrada.mes_obrigatorio}.`
        );
      }
    }

    if (atividadeEncontrada.validacao) {
      const nome = atividadeEncontrada.nome.toLowerCase();

      if (nome === "comissões permanentes") {
        if (dataUsuario > new Date("2025-08-31")) {
          erros.push(
            `❌ ${atividadeEncontrada.nome}: Deve ser realizada até 31/08/2025.`
          );
        }
      } else if (dataUsuario > new Date("2025-12-20")) {
        erros.push(
          `❌ ${atividadeEncontrada.nome}: Deve ser realizada até 20/12/2025.`
        );
      }
    }

    if (erros.length === 0) {
      return `✔️ ${atividadeEncontrada.nome} (${dataAtividade}) está correta.`;
    } else if (erros.length === 1) {
      return erros[0];
    } else {
      return `❌ ${atividadeEncontrada.nome}: ${erros
        .map((e) => e.replace(/^❌ [^:]+: /, ""))
        .join(" e ")}`;
    }
  }

  function isDataValida(dataAtividade) {
    const dataParts = dataAtividade.split("/");
    return dataParts.length === 3;
  }

  function normalizarTexto(texto) {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s\u00A0]+/g, " ")
      .replace(/ +/g, " ")
      .trim()
      .toLowerCase();
  }

  function exibirResultado(capitulo, resultado) {
    const capituloNormalizado = normalizarTexto(capitulo);
    const temPalavraCapitulo = /\bcapitulo\b/.test(capituloNormalizado);
    const tituloFormatado = temPalavraCapitulo
      ? capitulo
      : `Capítulo: ${capitulo}`;

    resultadoText.textContent = `${tituloFormatado}\n\n${resultado.join("\n")}`;
    resultadoDiv.classList.remove("hidden");
  }

  function handleCopyButtonClick() {
    const resultadoTexto = resultadoText.textContent;
    navigator.clipboard
      .writeText(resultadoTexto)
      .then(() => alert("Resultado copiado para a área de transferência!"))
      .catch((err) => console.error("Erro ao copiar o texto: ", err));
  }
});
