const page = document.body.dataset.page;
const links = document.querySelectorAll('[data-page-link]');

links.forEach((link) => {
  if (link.dataset.pageLink === page) {
    link.classList.add('active');
  }
});

if (page === 'home') {
  initTennisGame();
}

function initTennisGame() {
  const canvas = document.getElementById('tennisGame');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const playerScoreEl = document.getElementById('playerScore');
  const cpuScoreEl = document.getElementById('cpuScore');
  const statusEl = document.getElementById('tennisStatus');
  const resetBtn = document.getElementById('tennisReset');

  const maxScore = 7;
  const keyState = { left: false, right: false };
  const state = {
    viewWidth: canvas.width,
    viewHeight: canvas.height,
    pointerActive: false,
    pointerX: canvas.width / 2,
    running: true,
  };

  const player = { x: 0, y: 0, width: 0, height: 0, speed: 0 };
  const cpu = { x: 0, y: 0, width: 0, height: 0, speed: 0 };
  const ball = { x: 0, y: 0, radius: 6, vx: 0, vy: 0, speed: 0 };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function resetMatch() {
    playerScoreEl.textContent = '0';
    cpuScoreEl.textContent = '0';
    state.running = true;
    statusEl.textContent = 'First to 7 wins. Serve starts automatically.';
    resetBall();
  }

  function resetBall(scoredBy) {
    ball.x = state.viewWidth / 2;
    ball.y = state.viewHeight / 2;
    ball.speed = state.viewWidth * 0.42;
    const baseAngle = (Math.random() * 0.5 - 0.25) * Math.PI;
    const direction = scoredBy === 'player' ? -1 : scoredBy === 'cpu' ? 1 : Math.random() > 0.5 ? 1 : -1;
    ball.vx = Math.sin(baseAngle) * ball.speed;
    ball.vy = Math.cos(baseAngle) * ball.speed * direction;
  }

  function resizeGame() {
    const parent = canvas.parentElement;
    const width = Math.min(parent.clientWidth, 720);
    const height = Math.round(width * 0.56);
    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    state.viewWidth = width;
    state.viewHeight = height;

    player.width = width * 0.22;
    player.height = height * 0.04;
    player.y = height - player.height * 1.6;
    player.speed = width * 0.95;

    cpu.width = width * 0.2;
    cpu.height = height * 0.04;
    cpu.y = cpu.height * 1.6;
    cpu.speed = width * 0.65;

    player.x = width / 2;
    cpu.x = width / 2;
    ball.radius = width * 0.012;

    resetBall();
  }

  function updateScores() {
    const playerScore = Number(playerScoreEl.textContent);
    const cpuScore = Number(cpuScoreEl.textContent);
    if (playerScore >= maxScore || cpuScore >= maxScore) {
      state.running = false;
      statusEl.textContent = playerScore > cpuScore
        ? 'Clients win the set! Reset to play again.'
        : 'Northwind takes the set! Reset to rematch.';
    }
  }

  function registerScore(winner) {
    if (winner === 'player') {
      playerScoreEl.textContent = String(Number(playerScoreEl.textContent) + 1);
    } else {
      cpuScoreEl.textContent = String(Number(cpuScoreEl.textContent) + 1);
    }
    updateScores();
    if (state.running) {
      resetBall(winner);
    }
  }

  function update(dt) {
    if (!state.running) return;

    if (keyState.left || keyState.right) {
      const direction = keyState.right ? 1 : -1;
      player.x += direction * player.speed * dt;
      state.pointerActive = false;
    } else if (state.pointerActive) {
      player.x += (state.pointerX - player.x) * 0.18;
    }

    player.x = clamp(player.x, player.width / 2, state.viewWidth - player.width / 2);

    const cpuTarget = ball.x;
    const cpuDirection = cpuTarget - cpu.x;
    cpu.x += clamp(cpuDirection, -cpu.speed * dt, cpu.speed * dt);
    cpu.x = clamp(cpu.x, cpu.width / 2, state.viewWidth - cpu.width / 2);

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= state.viewWidth) {
      ball.vx *= -1;
      ball.x = clamp(ball.x, ball.radius, state.viewWidth - ball.radius);
    }

    const playerTop = player.y;
    const playerBottom = player.y + player.height;
    const cpuTop = cpu.y;
    const cpuBottom = cpu.y + cpu.height;

    if (ball.y + ball.radius >= playerTop && ball.y - ball.radius <= playerBottom) {
      if (ball.x >= player.x - player.width / 2 && ball.x <= player.x + player.width / 2 && ball.vy > 0) {
        const offset = (ball.x - player.x) / (player.width / 2);
        ball.speed = Math.min(ball.speed * 1.03, state.viewWidth * 0.7);
        ball.vx += offset * ball.speed * 0.6;
        ball.vy = -Math.abs(ball.vy);
        const mag = Math.hypot(ball.vx, ball.vy);
        ball.vx = (ball.vx / mag) * ball.speed;
        ball.vy = (ball.vy / mag) * ball.speed;
        ball.y = playerTop - ball.radius - 1;
      }
    }

    if (ball.y - ball.radius <= cpuBottom && ball.y + ball.radius >= cpuTop) {
      if (ball.x >= cpu.x - cpu.width / 2 && ball.x <= cpu.x + cpu.width / 2 && ball.vy < 0) {
        const offset = (ball.x - cpu.x) / (cpu.width / 2);
        ball.speed = Math.min(ball.speed * 1.02, state.viewWidth * 0.68);
        ball.vx += offset * ball.speed * 0.5;
        ball.vy = Math.abs(ball.vy);
        const mag = Math.hypot(ball.vx, ball.vy);
        ball.vx = (ball.vx / mag) * ball.speed;
        ball.vy = (ball.vy / mag) * ball.speed;
        ball.y = cpuBottom + ball.radius + 1;
      }
    }

    if (ball.y - ball.radius > state.viewHeight) {
      registerScore('cpu');
    }

    if (ball.y + ball.radius < 0) {
      registerScore('player');
    }
  }

  function drawCourt() {
    const width = state.viewWidth;
    const height = state.viewHeight;

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0b1324');
    gradient.addColorStop(1, '#13203b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(20, height / 2);
    ctx.lineTo(width - 20, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(20, height / 2 - 2, width - 40, 4);
  }

  function roundedRect(x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + safeRadius, y);
    ctx.lineTo(x + width - safeRadius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    ctx.lineTo(x + width, y + height - safeRadius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
    ctx.lineTo(x + safeRadius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
    ctx.lineTo(x, y + safeRadius);
    ctx.quadraticCurveTo(x, y, x + safeRadius, y);
    ctx.closePath();
  }

  function drawPaddle(paddle, color) {
    ctx.fillStyle = color;
    roundedRect(
      paddle.x - paddle.width / 2,
      paddle.y,
      paddle.width,
      paddle.height,
      paddle.height / 2
    );
    ctx.fill();
  }

  function drawBall() {
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function render() {
    drawCourt();
    drawPaddle(cpu, '#38bdf8');
    drawPaddle(player, '#f97316');
    drawBall();
  }

  let lastTime = performance.now();
  function loop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.033);
    lastTime = time;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    state.pointerX = event.clientX - rect.left;
    state.pointerActive = true;
  });

  canvas.addEventListener('touchstart', (event) => {
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    state.pointerX = touch.clientX - rect.left;
    state.pointerActive = true;
  }, { passive: true });

  canvas.addEventListener('touchmove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    state.pointerX = touch.clientX - rect.left;
    state.pointerActive = true;
  }, { passive: true });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
      keyState.left = true;
    }
    if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
      keyState.right = true;
    }
  });

  document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
      keyState.left = false;
    }
    if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
      keyState.right = false;
    }
  });

  resetBtn.addEventListener('click', () => {
    resetMatch();
  });

  window.addEventListener('resize', () => {
    resizeGame();
  });

  resizeGame();
  requestAnimationFrame(loop);
}
