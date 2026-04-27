let ship;
let meteors = [];
let particles = [];
let stars = [];

let score = 0;
let highScore = 0;
let gameOver = false;
let gameStarted = false;

let speedMultiplier = 1;
let lives = 3;
let spawnRate = 75;

// Cores
let color_primary;
let color_accent;
let color_glow;

function preload() {
  sndExplosion = loadSound("explosao.mp3");
  sndMusic = loadSound("musica.mp3")
  sndHit = loadSound("hit.mp3")
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);

  color_primary = color(200, 80, 100);
  color_accent = color(0, 90, 100);
  color_glow = color(200, 80, 100, 50);

  highScore = float(localStorage.getItem("spaceHighscore_maria")) || 0;

  sndExplosion.setVolume(0.05);
  sndMusic.setVolume(0.1);
  sndHit.setVolume(0.05);
  
  createStars();
  resetGame();
  noLoop();
}

function draw() {
  drawSpaceBackground();

  if (!gameStarted) {
    drawStartScreen();
    return;
  }

  if (!gameOver) {
    drawGame();
  } else {
    drawGameOver();
  }
}

function resetGame() {
  ship = new SpaceShip(width / 2, height - 100);
  meteors = [];
  particles = [];
  score = 0;
  speedMultiplier = 1;
  lives = 3;
  gameOver = false;
}

function startGame() {
  sndMusic.loop();
  resetGame();
  gameStarted = true;
  loop();
}

function drawGame() {
  score += 1 / 60;

  // Mantém a mesma quantidade/frequência de meteoros do seu código
  let spawnRate = max(16, 60 - score * 2);

  // Velocidade progressiva mais suave
  speedMultiplier = 1 + score * 0.05;

  if (frameCount % floor(spawnRate) === 0) {
    meteors.push(new Meteor());
  }

  updateParticles();

  ship.update();
  ship.display();

  checkMeteorCollisions();

  drawUI();
}

function checkMeteorCollisions() {
  for (let i = meteors.length - 1; i >= 0; i--) {
    meteors[i].update(speedMultiplier);
    meteors[i].display();

    if (ship.hits(meteors[i])) {
      lives--;
      sndHit.play()
      createExplosion(ship.pos.x, ship.pos.y);

      meteors.splice(i, 1); 

      if (lives <= 0) {
        endGame();
      }
    } else if (meteors[i].offScreen()) {
      meteors.splice(i, 1);
    }
  }
}

// ------------------ TELA INICIAL ------------------

function drawStartScreen() {
  fill(0, 0, 0, 120);
  rect(0, 0, width, height);

  textAlign(CENTER);

  fill(200, 80, 100);
  textSize(60);
  text("SPACE ESCAPE", width / 2, height / 2 - 120);

  fill(0, 0, 100);
  textSize(24);
  text("Desvie dos meteoros e sobreviva o máximo possível!", width / 2, height / 2 - 60);

  textSize(20);
  text("Use as setas do teclado para mover a nave", width / 2, height / 2 - 15);
  text("Você começa com 3 vidas", width / 2, height / 2 + 20);
  text("A dificuldade aumenta com o tempo", width / 2, height / 2 + 55);

  fill(50, 80, 100);
  textSize(24);
  text("Pressione ENTER para começar", width / 2, height / 2 + 120);
}

// ------------------ NAVE ------------------

class SpaceShip {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.friction = 0.95;
    this.maxSpeed = 8;
    this.size = 25;
  }

  update() {
    let force = createVector(0, 0);

    if (keyIsDown(LEFT_ARROW)) force.x -= 1;
    if (keyIsDown(RIGHT_ARROW)) force.x += 1;
    if (keyIsDown(UP_ARROW)) force.y -= 1;
    if (keyIsDown(DOWN_ARROW)) force.y += 1;

    if (force.mag() > 0) {
      force.normalize();
      force.mult(1.5);
      this.acc.add(force);

      if (keyIsDown(UP_ARROW)) {
        for (let i = 0; i < 2; i++) {
          particles.push(
            new Particle(
              this.pos.x,
              this.pos.y + this.size * 1.5,
              color_accent
            )
          );
        }
      }
    }

    this.vel.add(this.acc);
    this.vel.mult(this.friction);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);

    this.pos.x = constrain(this.pos.x, this.size, width - this.size);
    this.pos.y = constrain(this.pos.y, this.size, height - this.size);
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    noStroke();

    drawingContext.shadowBlur = 25;
    drawingContext.shadowColor = color_glow;
    fill(color_glow);
    this.drawShipGeometry();

    drawingContext.shadowBlur = 0;

    fill(color_primary);
    this.drawShipGeometry();

    fill(color_accent);
    rect(-this.size * 0.9, this.size * 0.3, this.size * 0.2, this.size * 0.8);
    rect(this.size * 0.7, this.size * 0.3, this.size * 0.2, this.size * 0.8);

    fill(0, 0, 10);
    ellipse(0, -this.size * 0.2, this.size * 0.5, this.size * 0.8);

    fill(0, 0, 100, 30);
    ellipse(0, -this.size * 0.3, this.size * 0.3, this.size * 0.5);

    pop();
  }

  drawShipGeometry() {
    beginShape();
    vertex(0, -this.size * 1.5);
    vertex(this.size * 0.3, -this.size * 0.5);
    vertex(this.size * 1.0, this.size * 0.2);
    vertex(this.size * 1.2, this.size * 1.2);
    vertex(this.size * 0.4, this.size * 1.0);
    vertex(this.size * 0.2, this.size * 1.3);
    vertex(-this.size * 0.2, this.size * 1.3);
    vertex(-this.size * 0.4, this.size * 1.0);
    vertex(-this.size * 1.2, this.size * 1.2);
    vertex(-this.size * 1.0, this.size * 0.2);
    vertex(-this.size * 0.3, -this.size * 0.5);
    endShape(CLOSE);
  }

  hits(m) {
    let d = dist(this.pos.x, this.pos.y, m.pos.x, m.pos.y);
    return d < this.size + m.r * 0.7;
  }
}

// ------------------ METEORO ------------------

class Meteor {
  constructor() {
    this.r = random(15, 60);
    this.pos = createVector(random(width), random(-200, -50));
    this.vel = createVector(random(-1.5, 1.5), random(3, 6));
    this.rot = 0;
    this.rotVel = random(-0.08, 0.08);

    this.points = [];
    let totalPoints = floor(random(5, 10));

    for (let i = 0; i < totalPoints; i++) {
      let angle = map(i, 0, totalPoints, 0, TWO_PI);
      let rOffset = random(0.7, 1.3);
      this.points.push(
        createVector(
          cos(angle) * this.r * rOffset,
          sin(angle) * this.r * rOffset
        )
      );
    }
  }

  update(mult) {
    this.pos.add(this.vel.copy().mult(mult));
    this.rot += this.rotVel;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rot);

    fill(25, 20, 35);
    stroke(200, 50, 100, 30);
    strokeWeight(2);

    beginShape();
    for (let p of this.points) {
      vertex(p.x, p.y);
    }
    endShape(CLOSE);

    pop();
  }

  offScreen() {
    return this.pos.y > height + this.r * 2;
  }
}

// ------------------ PARTÍCULAS ------------------

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();

    if (particles[i].lifespan <= 0) {
      particles.splice(i, 1);
    }
  }
}

function createExplosion(x, y) {
  for (let i = 0; i < 20; i++) {
    particles.push(new Particle(x, y, color_accent));
  }
}

class Particle {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-3, 3), random(-3, 5));
    this.lifespan = 100;
    this.color = col;
    this.size = random(4, 8);
  }

  update() {
    this.pos.add(this.vel);
    this.lifespan -= 4;
  }

  display() {
    noStroke();
    fill(
      hue(this.color),
      saturation(this.color),
      brightness(this.color),
      this.lifespan
    );
    ellipse(this.pos.x, this.pos.y, this.size);
  }
}

// ------------------ FUNDO ------------------

function createStars() {
  stars = [];

  for (let i = 0; i < 120; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      speed: random(0.2, 1.2),
      alpha: random(30, 90)
    });
  }
}

function drawSpaceBackground() {
  background(240, 60, 5);

  noStroke();

  for (let star of stars) {
    fill(0, 0, 100, star.alpha);
    ellipse(star.x, star.y, star.size);

    if (gameStarted && !gameOver) {
      star.y += star.speed;

      if (star.y > height) {
        star.y = 0;
        star.x = random(width);
      }
    }
  }
}

// ------------------ UI ------------------

function drawUI() {
  let points = floor(score * 10);
  let level = floor(score / 10) + 1;

  fill(0, 0, 100);
  textSize(22);
  textAlign(LEFT);

  text("Pontos: " + points, 30, 45);
  text("Vidas: " + lives, 30, 75);
  text("Nível: " + level, 30, 105);

  fill(50, 80, 100);
  text("Recorde: " + floor(highScore * 10) + " pts", 30, 135);
}

// ------------------ GAME OVER ------------------

function drawGameOver() {
  let points = floor(score * 10);
  let level = floor(score / 10) + 1;

  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  textAlign(CENTER);

  fill(0, 100, 100);
  textSize(58);
  text("Nave Destruída!", width / 2, height / 2 - 100);

  fill(0, 0, 100);
  textSize(25);
  text("Pontuação final: " + points, width / 2, height / 2 - 35);
  text("Tempo sobrevivido: " + nf(score, 0, 1) + "s", width / 2, height / 2 + 5);
  text("Nível alcançado: " + level, width / 2, height / 2 + 45);
  text("Recorde: " + floor(highScore * 10) + " pts", width / 2, height / 2 + 85);

  fill(50, 80, 100);
  text("Pressione ESPAÇO para jogar novamente", width / 2, height / 2 + 145);
}

// ------------------ CONTROLE ------------------

function endGame() {
  sndExplosion.play();
  sndMusic.stop();
  gameOver = true;
  
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("spaceHighscore_maria", highScore);
  }
}

function keyPressed() {
  if (!gameStarted && keyCode === ENTER) {
    startGame();
  }

  if (gameOver && key === " ") {
    startGame();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  createStars();

  if (!gameStarted || gameOver) {
    redraw();
  }
}