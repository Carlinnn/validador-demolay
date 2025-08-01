document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('atividade-form');
    const resultadoDiv = document.getElementById('resultado');
    const resultadoText = document.getElementById('resultado-text');
    const copyButton = document.getElementById('copy-button');

    form.addEventListener('submit', handleFormSubmit);
    copyButton.addEventListener('click', handleCopyButtonClick);

    function handleFormSubmit(event) {
        event.preventDefault();
        const capitulo = document.getElementById('capitulo').value.trim();
        const atividadesInput = document.getElementById('atividade').value;

        fetch('gabarito.json')
            .then(response => response.json())
            .then(data => processarAtividades(data.atividades, capitulo, atividadesInput))
            .catch(error => console.error('Erro ao carregar o gabarito:', error));
    }

    function processarAtividades(atividadesGabarito, capitulo, atividadesInput) {
        const atividadesUsuario = atividadesInput.split('\n').map(line => line.trim());
        const nomesAtividadesUsuario = atividadesUsuario
            .filter((_, i) => i % 2 === 0)
            .map(nome => nome.toLowerCase());

        let resultado = [];

        atividadesUsuario.forEach((atividade, index) => {
            if (index % 2 === 0) {
                const nomeAtividade = atividade.toLowerCase();
                const dataAtividade = atividadesUsuario[index + 1];

                if (dataAtividade && isDataValida(dataAtividade)) {
                    const atividadeEncontrada = encontrarAtividade(atividadesGabarito, nomeAtividade);
                    if (atividadeEncontrada) {
                        resultado.push(validarAtividade(atividadeEncontrada, nomeAtividade, dataAtividade));
                    }
                }
            }
        });

        atividadesGabarito.forEach(atividade => {
            if (!nomesAtividadesUsuario.includes(atividade.nome.toLowerCase())) {
                resultado.push(`❌ ${atividade.nome} não consta na lista de atividades informadas.`);
            }
        });

        exibirResultado(capitulo, resultado);
    }

    function encontrarAtividade(atividades, nomeAtividade) {
        return atividades.find(atividade => nomeAtividade === atividade.nome.toLowerCase());
    }

    function validarAtividade(atividadeEncontrada, nomeAtividade, dataAtividade) {
        const dataParts = dataAtividade.split('/');
        const dataUsuario = new Date(dataParts[2], dataParts[1] - 1, dataParts[0]);

        if (atividadeEncontrada.validacao) {
            const nome = atividadeEncontrada.nome.toLowerCase();

            if (nome === "dia devocional" || nome === "dia em memória a jacques demolay") {
                return dataUsuario.getMonth() === 2
                    ? `✔️ ${atividadeEncontrada.nome} (${dataAtividade}) está correta.`
                    : `❌ ${atividadeEncontrada.nome} deve ser realizada no mês de março.`;
            }

            if (nome === "dia das mães") {
                return dataUsuario.getMonth() === 4
                    ? `✔️ ${atividadeEncontrada.nome} (${dataAtividade}) está correta.`
                    : `❌ ${atividadeEncontrada.nome} deve ser realizada no mês de maio.`;
            }

            if (nome === "comissões permanentes") {
                if (dataUsuario <= new Date('2025-08-30')) {
                    return `✔️ ${atividadeEncontrada.nome} (${dataAtividade}) está correta.`;
                }
                return `❌ ${atividadeEncontrada.nome} deve ser realizada até 30/08/2025.`;
            }

            if (dataUsuario <= new Date('2025-12-20')) {
                return `✔️ ${atividadeEncontrada.nome} (${dataAtividade}) está correta.`;
            }

            return `❌ ${atividadeEncontrada.nome} está incorreta. A atividade deve ser realizada até 20/12/2025.`;
        }

        return `✔️ ${atividadeEncontrada.nome} (${dataAtividade}) está correta.`;
    }

    function isDataValida(dataAtividade) {
        const dataParts = dataAtividade.split('/');
        return dataParts.length === 3;
    }

    function normalizarTexto(texto) {
        return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    function exibirResultado(capitulo, resultado) {
        const capituloNormalizado = normalizarTexto(capitulo);
        const temPalavraCapitulo = /\bcapitulo\b/.test(capituloNormalizado);
        const tituloFormatado = temPalavraCapitulo ? capitulo : `Capítulo: ${capitulo}`;

        resultadoText.textContent = `${tituloFormatado}\n\n${resultado.join('\n')}`;
        resultadoDiv.classList.remove('hidden');
    }

    function handleCopyButtonClick() {
        const resultadoTexto = resultadoText.textContent;
        navigator.clipboard.writeText(resultadoTexto)
            .then(() => alert('Resultado copiado para a área de transferência!'))
            .catch(err => console.error('Erro ao copiar o texto: ', err));
    }
});