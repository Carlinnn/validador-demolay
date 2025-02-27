// rain.js

// Função para criar uma gota de chuva
function createRainDrop() {
    const rainDrop = document.createElement('img');
    rainDrop.src = 'assets/dm.png'; // Caminho para a imagem
    rainDrop.style.position = 'absolute';
    rainDrop.style.width = '50px'; // Ajuste o tamanho conforme necessário
    rainDrop.style.opacity = '0.7';
    
    // Posição inicial aleatória
    rainDrop.style.left = Math.random() * window.innerWidth + 'px';
    rainDrop.style.top = '-50px'; // Começa acima da tela

    // Adiciona a gota de chuva ao contêiner de chuva
    const rainContainer = document.querySelector('.rain');
    rainContainer.appendChild(rainDrop);

    // Animação da gota de chuva
    const fallDuration = Math.random() * 3 + 2; // Duração aleatória entre 2 e 5 segundos
    rainDrop.animate([
        { transform: 'translateY(0)' },
        { transform: 'translateY(' + (window.innerHeight + 50) + 'px)' }
    ], {
        duration: fallDuration * 1000,
        easing: 'linear',
        fill: 'forwards'
    });

    // Remover a gota após a animação
    setTimeout(() => {
        rainDrop.remove();
    }, fallDuration * 1000);
}

// Função para ofuscar a logo
function ofuscarLogo() {
    const logos = document.querySelectorAll('img'); // Seleciona todas as imagens
    logos.forEach(logo => {
        logo.classList.add('ofuscada'); // Adiciona a classe de ofuscamento
    });
}

// Função para restaurar a logo
function restaurarLogo() {
    const logos = document.querySelectorAll('img'); // Seleciona todas as imagens
    logos.forEach(logo => {
        logo.classList.remove('ofuscada'); // Remove a classe de ofuscamento
    });
}

// Criar gotas de chuva em intervalos
setInterval(() => {
    createRainDrop();
    ofuscarLogo(); // Ofusca a logo ao criar gotas de chuva
}, 300); // Ajuste o intervalo conforme necessário

// Restaura a logo após um tempo (opcional)
setTimeout(restaurarLogo, 10000); // Restaura a logo após 10 segundos (ajuste conforme necessário) 