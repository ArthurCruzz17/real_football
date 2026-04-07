const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configurações Físicas e Globais
const gravity = 0.8;
let score = { p1: 0, p2: 0 };
const goalPos = 80;    // Posição x da linha do gol
const goalHeight = 170; // Altura da trave
const postWidth = 10;   // Largura visual do poste vertical

// Estados do Sistema de Jogo
let timeLeft = 60; 
let gameRunning = false;
let isGoalActive = false;
let matchEnded = false;
let timerInterval;

// Gerenciamento de entrada (teclado)
const keys = {
    w: { pressed: false }, a: { pressed: false }, d: { pressed: false },
    arrowup: { pressed: false }, arrowleft: { pressed: false }, arrowright: { pressed: false }
};

// Classe representando os jogadores 
 
class Player {
    constructor(x, y, color, name, stats) {
        this.x = x; this.y = y; this.name = name; this.color = color;
        this.width = 50; this.height = 75;
        this.velocityY = 0; this.velocityX = 0; this.isJumping = false;
        this.speed = stats.speed; this.jumpPower = stats.jumpPower; this.kickForce = stats.kickForce;
    }
    
    draw() {
        ctx.fillStyle = this.color;
        // Desenha o corpo
        ctx.beginPath(); ctx.roundRect(this.x, this.y + 30, this.width, 45, 10); ctx.fill();
        // Desenha a cabeça
        ctx.beginPath(); ctx.arc(this.x + this.width / 2, this.y + 15, 22, 0, Math.PI * 2); ctx.fill();

        // Nome em cima do jogador durante a partida
        ctx.fillStyle = "white";
        ctx.font = "bold 14px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText(this.name, this.x + this.width / 2, this.y - 15);
    }
    
    update() {
        if (!gameRunning || isGoalActive || matchEnded) return;
        
        // Aplicação da Gravidade
        this.y += this.velocityY;
        if (this.y + this.height < canvas.height) {
            this.velocityY += gravity;
        } else {
            this.y = canvas.height - this.height;
            this.velocityY = 0;
            this.isJumping = false;
        }
        
        // Movimentação lateral e limites do campo
        this.x += this.velocityX;
        this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));
    }
}

// Classe representando a bola

class Ball {
    constructor() { 
        this.radius = 12; 
        this.friction = 0.98; // Atrito constante no ar/chão
        this.gravity = 0.5; 
        this.restitution = 0.7; // Impacto elástico para quicar
        this.reset(); 
    }

    reset() { 
        this.x = canvas.width/2; 
        this.y = 100; 
        this.velocityX = 0; 
        this.velocityY = 0; 
    }

    draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#fff"; ctx.fill();
        ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.stroke();
    }

    update() {
        if (!gameRunning || isGoalActive || matchEnded) return;

        // Gravidade aplicada na bola
        if (this.y + this.radius < canvas.height) this.velocityY += this.gravity;
        else { 
            this.y = canvas.height - this.radius; 
            this.velocityY *= -this.restitution; 
        }
        
        // Colisão física com o Travessão
        if (this.x < goalPos || this.x > canvas.width - goalPos) {
            if (Math.abs(this.y - (canvas.height - goalHeight)) < this.radius) {
                this.velocityY *= -this.restitution;
                this.y = this.velocityY > 0 ? canvas.height - goalHeight + this.radius : canvas.height - goalHeight - this.radius;
            }
        }
        
        // Colisão com as paredes laterais
        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
            this.velocityX *= -this.restitution;
            this.x = this.x < this.radius ? this.radius : canvas.width - this.radius;
        }

        this.x += this.velocityX; 
        this.y += this.velocityY; 
        this.velocityX *= this.friction; // Desaceleração gradual
    }
}

// Inicialização dos Personagens
const ball = new Ball();
const p1 = new Player(150, 300, '#FFF', 'P1', { speed: 6, jumpPower: -18, kickForce: 0.5 });
const p2 = new Player(700, 300, '#0055ff', 'P2', { speed: 6, jumpPower: -18, kickForce: 0.5 });

// Renderiza a interface do Placar e Cronômetro

function drawScoreboard() {
    const boardW = 400; const boardH = 70;
    const boardX = canvas.width / 2 - boardW / 2;
    const boardY = 15;

    ctx.fillStyle = "rgba(22, 22, 21, 0.9)";
    ctx.beginPath(); ctx.roundRect(boardX, boardY, boardW, boardH, 12); ctx.fill();
    ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();

    // Cronômetro (Fica vermelho nos últimos 10 segundos)
    ctx.fillStyle = timeLeft <= 10 ? "#ff4444" : "#ffeb3b";
    ctx.font = "bold 24px Monospace"; ctx.textAlign = "center";
    ctx.fillText(timeLeft + "s", canvas.width / 2, boardY + 25);

    // Placar central
    ctx.fillStyle = "white"; ctx.font = "bold 32px Monospace";
    ctx.fillText(score.p1 + " - " + score.p2, canvas.width / 2, boardY + 55);

    // Nomes dos Jogadores no Placar
    ctx.font = "bold 14px Segoe UI";
    ctx.textAlign = "left"; ctx.fillStyle = p1.color; ctx.fillText(p1.name.toUpperCase(), boardX + 20, boardY + 40);
    ctx.textAlign = "right"; ctx.fillStyle = p2.color; ctx.fillText(p2.name.toUpperCase(), boardX + boardW - 20, boardY + 40);
}

// Finaliza a partida e exibe o resultado

function endMatch() {
    matchEnded = true; gameRunning = false;
    clearInterval(timerInterval);
    
    const screen = document.getElementById('gameOverScreen');
    const winnerTxt = document.getElementById('winnerText');
    const scoreTxt = document.getElementById('finalScoreText');
    
    screen.style.display = 'flex';
    scoreTxt.innerText = `Placar Final: ${score.p1} - ${score.p2}`;
    scoreTxt.style.color = "#ffeb3b"; 
    
    winnerTxt.style.color = "#ffeb3b";

    if (score.p1 > score.p2) {
        winnerTxt.innerText = `${p1.name.toUpperCase()} VENCEU!`;
    } else if (score.p2 > score.p1) {
        winnerTxt.innerText = `${p2.name.toUpperCase()} VENCEU!`;
    } else {
        winnerTxt.innerText = "EMPATE!";
        winnerTxt.style.color = "white"; 
    }
}

// Verifica se a bola ultrapassou a linha de gol

function checkGoal() {
    if (isGoalActive || matchEnded) return;

    if (ball.x < goalPos - ball.radius && ball.y > canvas.height - goalHeight) { 
        score.p2++; isGoalActive = true;
        if (score.p2 >= 10) { endMatch(); return; }
        setTimeout(() => { isGoalActive = false; ball.reset(); p1.x = 150; p2.x = 700; }, 2000);
    }
    
    if (ball.x > canvas.width - goalPos + ball.radius && ball.y > canvas.height - goalHeight) { 
        score.p1++; isGoalActive = true;
        if (score.p1 >= 10) { endMatch(); return; }
        setTimeout(() => { isGoalActive = false; ball.reset(); p1.x = 150; p2.x = 700; }, 2000);
    }
}

window.addEventListener('keydown', (e) => { 
    const key = e.key.toLowerCase();
    if (keys[key] !== undefined) keys[key].pressed = true;
    else if (keys[e.key] !== undefined) keys[e.key].pressed = true; 
});

window.addEventListener('keyup', (e) => { 
    const key = e.key.toLowerCase();
    if (keys[key] !== undefined) keys[key].pressed = false;
    else if (keys[e.key] !== undefined) keys[e.key].pressed = false;
});

// Inicialização do Jogo via Menu
document.getElementById('startBtn').addEventListener('click', () => {
    p1.name = document.getElementById('p1NameInput').value || "Jogador 1";
    p2.name = document.getElementById('p2NameInput').value || "Jogador 2";
    p1.color = document.getElementById('p1ColorInput').value;
    p2.color = document.getElementById('p2ColorInput').value;
    document.getElementById('lobby').style.display = 'none';
    gameRunning = true;
    
    // Parâmetro do Cronômetro
    timerInterval = setInterval(() => {
        if (!isGoalActive && gameRunning) {
            timeLeft--;
            if (timeLeft <= 0) endMatch();
        }
    }, 1000);
});

function drawField() {
    const stripeWidth = 100;
    for (let i = 0; i < canvas.width; i += stripeWidth) {
        ctx.fillStyle = (i / stripeWidth) % 2 === 0 ? "#2e7d32" : "#388e3c";
        ctx.fillRect(i, 0, stripeWidth, canvas.height);
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"; ctx.lineWidth = 2;
    ctx.strokeRect(0, canvas.height - 120, goalPos + 50, 120);
    ctx.strokeRect(canvas.width - (goalPos + 50), canvas.height - 120, goalPos + 50, 120);
    ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height, 60, 0, Math.PI, true); ctx.stroke();
}

function drawGoalDecoration(x, side) {
    const isLeft = side === 1; const netX = isLeft ? 0 : canvas.width;
    ctx.beginPath(); ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"; ctx.lineWidth = 1;
    for(let i=0; i <= goalHeight; i+=20) { ctx.moveTo(x, canvas.height - i); ctx.lineTo(netX, canvas.height - i); }
    ctx.stroke();
    
    const segments = 6; const segH = goalHeight / segments;
    for(let i=0; i<segments; i++) {
        ctx.fillStyle = i % 2 === 0 ? "#ff4500" : "white";
        ctx.fillRect(isLeft ? x : x - postWidth, canvas.height - (i+1)*segH, postWidth, segH);
    }
    // Travessão
    ctx.fillStyle = "white"; ctx.fillRect(isLeft ? 0 : x, canvas.height - goalHeight, isLeft ? x : canvas.width - x, 6);
}

function animate() {
    drawField();
    drawGoalDecoration(goalPos, 1);
    drawGoalDecoration(canvas.width - goalPos, -1);

    // Lógica de movimento por tecla
    if (gameRunning && !isGoalActive && !matchEnded) {
        p1.velocityX = 0;
        if (keys.a.pressed) p1.velocityX = -p1.speed;
        if (keys.d.pressed) p1.velocityX = p1.speed;
        if (keys.w.pressed && !p1.isJumping) { p1.velocityY = p1.jumpPower; p1.isJumping = true; }
        
        p2.velocityX = 0;
        if (keys.arrowleft.pressed) p2.velocityX = -p2.speed;
        if (keys.arrowright.pressed) p2.velocityX = p2.speed;
        if (keys.arrowup.pressed && !p2.isJumping) { p2.velocityY = p2.jumpPower; p2.isJumping = true; }
    }

    p1.update(); p2.update(); ball.update();
    
    // Processamento de colisão jogador vs bola 
    [p1, p2].forEach(p => {
        let closestX = Math.max(p.x, Math.min(ball.x, p.x + p.width));
        let closestY = Math.max(p.y, Math.min(ball.y, p.y + p.height));
        let dx = ball.x - closestX; let dy = ball.y - closestY;
        
        if ((dx * dx + dy * dy) < (ball.radius * ball.radius)) {
            let dist = Math.sqrt(dx * dx + dy * dy) || 1;
            ball.x += (dx / dist) * (ball.radius - dist);
            ball.y += (dy / dist) * (ball.radius - dist);
            // Aplicação da força baseada na posição do impacto
            ball.velocityX = (ball.x - (p.x + p.width / 2)) * p.kickForce;
            ball.velocityY = -7;
        }
    });

    checkGoal();
    drawScoreboard();
    p1.draw(); p2.draw(); ball.draw();

    // Frase pós gol
    if (isGoalActive && !matchEnded) {
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0,0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffeb3b"; ctx.font = "bold 80px Impact"; ctx.textAlign = "center";
        ctx.fillText("GOOOOOOL!", canvas.width / 2, canvas.height / 2);
    }

    requestAnimationFrame(animate);
}

animate();