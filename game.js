
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/OrbitControls.js";


// ARQ-MATH 3D: juego educativo de cálculo arquitectónico.
// El ranking se guarda localmente en este navegador (localStorage).

const TOTAL_ROUNDS = 10;
const QUESTION_SECONDS = 60;
const RANKING_KEY = "arqmath3d-ranking-v1";

const $ = (id) => document.getElementById(id);
const ui = {
  score: $("score"), floors: $("floors"), round: $("round"), timer: $("timer"),
  timerBar: $("timerBar"), progressText: $("progressText"), progressBar: $("progressBar"),
  topicTag: $("topicTag"), questionNumber: $("questionNumber"), questionText: $("questionText"),
  formula: $("formula"), unitLabel: $("unitLabel"), answerForm: $("answerForm"),
  answerInput: $("answerInput"), submitBtn: $("submitBtn"), feedback: $("feedback"),
  startBtn: $("startBtn"), nextBtn: $("nextBtn"), playerName: $("playerName"),
  leaderboard: $("leaderboard"), clearRankingBtn: $("clearRankingBtn"), scene: $("scene")
};

let score = 0;
let round = 0;
let floors = 0;
let currentQuestion = null;
let active = false;
let answered = false;
let secondsLeft = QUESTION_SECONDS;
let timerInterval = null;
let gameFinished = false;

const questionBank = [
  { topic: "GEOMETRÍA", unit: "m²", formula: "A = largo × ancho", text: "Un vestíbulo rectangular mide 8,4 m × 5,5 m. ¿Cuál es su área útil?", answer: 46.2, tolerance: 0.01 },
  { topic: "VOLUMEN", unit: "m³", formula: "V = largo × ancho × alto", text: "Una cimentación prismática mide 3,2 m × 2,5 m × 0,45 m. ¿Qué volumen de concreto requiere?", answer: 3.6, tolerance: 0.01 },
  { topic: "TRIGONOMETRÍA", unit: "m", formula: "h = d · tan(θ)", text: "Desde un punto situado a 12 m de la fachada se observa la parte superior con un ángulo de elevación de 35°. ¿Cuál es la altura aproximada? (redondea a 2 decimales)", answer: 8.40, tolerance: 0.02, calculate: () => 12 * Math.tan(35 * Math.PI / 180) },
  { topic: "ESCALAS", unit: "cm", formula: "medida real = medida plano × escala", text: "En un plano a escala 1:100, una fachada mide 7,25 cm. ¿Cuántos centímetros mide en la realidad?", answer: 725, tolerance: 0.1 },
  { topic: "CÁLCULO", unit: "m²", formula: "A = ∫₀ᵇ f(x) dx", text: "La sección de una cubierta se modela con f(x)=2x+3 entre x=0 y x=4. ¿Cuál es el área bajo la curva?", answer: 28, tolerance: 0.01 },
  { topic: "PENDIENTES", unit: "%", formula: "pendiente = (desnivel / distancia) × 100", text: "Una rampa salva un desnivel de 0,72 m en una longitud horizontal de 9 m. ¿Cuál es su pendiente porcentual?", answer: 8, tolerance: 0.01 },
  { topic: "GEOMETRÍA ANALÍTICA", unit: "m", formula: "d = √[(x₂−x₁)² + (y₂−y₁)²]", text: "En una planta, dos puntos están en A(2, 3) y B(10, 9). ¿Cuál es la distancia entre ellos?", answer: 10, tolerance: 0.01 },
  { topic: "ESTRUCTURAS", unit: "kN", formula: "F = carga × área tributaria", text: "Una columna recibe una carga uniforme de 6 kN/m² sobre un área tributaria de 12 m². ¿Qué carga vertical recibe?", answer: 72, tolerance: 0.01 },
  { topic: "CÁLCULO", unit: "m²", formula: "A(r) = πr²", text: "Un patio circular tiene radio de 3,5 m. ¿Cuál es su área? Usa π = 3,1416 y redondea a 2 decimales.", answer: 38.48, tolerance: 0.02, calculate: () => Math.PI * 3.5 * 3.5 },
  { topic: "OPTIMIZACIÓN", unit: "m", formula: "P = 2x + 2y", text: "Un jardín rectangular tiene perímetro de 40 m. Si su largo es 12 m, ¿cuánto mide el ancho?", answer: 8, tolerance: 0.01 },
  { topic: "GEOMETRÍA", unit: "m²", formula: "A = largo × ancho", text: "Un dormitorio mide 4 m de largo y 3 m de ancho. ¿Cuál es su área?", answer: 12 },
  { topic: "VOLUMEN", unit: "m³", formula: "V = largo × ancho × alto", text: "Una habitación mide 5 m de largo, 4 m de ancho y 3 m de alto. ¿Cuál es su volumen?", answer: 60 },
  { topic: "PENDIENTES", unit: "%", formula: "p = (desnivel / distancia) × 100", text: "Una rampa sube 2 m en 20 m horizontales. ¿Cuál es su pendiente?", answer: 10 },
  { topic: "ESCALAS", unit: "m", formula: "real = plano × escala", text: "En un plano 1:100, una pared mide 5 cm. ¿Cuánto mide en la realidad, en metros?", answer: 5 },
  { topic: "GEOMETRÍA", unit: "m²", formula: "A = b × h / 2", text: "Un triángulo tiene base de 8 m y altura de 5 m. ¿Cuál es su área?", answer: 20 },
  { topic: "VOLUMEN", unit: "m³", formula: "V = π × r² × h", text: "Un cilindro tiene radio de 2 m y altura de 3 m. Usa π = 3.14. ¿Cuál es su volumen?", answer: 37.68 },
  { topic: "GEOMETRÍA ANALÍTICA", unit: "m", formula: "d = √(x² + y²)", text: "Dos puntos están separados 3 m horizontalmente y 4 m verticalmente. ¿Cuál es la distancia entre ellos?", answer: 5 },
  { topic: "ESTRUCTURAS", unit: "kN", formula: "F = carga × área", text: "Una losa soporta 4 kN/m² sobre un área de 20 m². ¿Cuál es la carga total en kN?", answer: 80 },
  { topic: "GEOMETRÍA", unit: "m²", formula: "A = π × r²", text: "Un patio circular tiene radio de 3 m. Usa π = 3.14. ¿Cuál es su área?", answer: 28.26 },
  { topic: "OPTIMIZACIÓN", unit: "m", formula: "P = 2(largo + ancho)", text: "Un rectángulo tiene largo de 8 m y ancho de 4 m. ¿Cuál es su perímetro?", answer: 24 },

];
let questions = [];

// ---------- Three.js: escena, luces, terreno y edificio ----------
let scene3D, camera, renderer, controls, buildingGroup, floorMaterials = [];
init3D();

function init3D() {
  const width = Math.max(ui.scene.clientWidth, 300);
  const height = Math.max(ui.scene.clientHeight, 240);
  scene3D = new THREE.Scene();
  scene3D.background = new THREE.Color("#0b1728");
  scene3D.fog = new THREE.Fog("#0b1728", 18, 38);

  camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(10, 8, 12);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  ui.scene.innerHTML = "";
  ui.scene.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 2.3, 0);
  controls.minDistance = 6;
  controls.maxDistance = 24;
  controls.maxPolarAngle = Math.PI * 0.48;

  scene3D.add(new THREE.HemisphereLight("#b8eaff", "#17253b", 2.1));
  const keyLight = new THREE.DirectionalLight("#ffffff", 3.0);
  keyLight.position.set(7, 12, 8);
  keyLight.castShadow = true;
  scene3D.add(keyLight);
  const rimLight = new THREE.PointLight("#43e8e0", 28, 22);
  rimLight.position.set(-5, 5, -4);
  scene3D.add(rimLight);

  // Suelo y cuadrícula de maqueta.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ color: "#10233a", roughness: 0.92, metalness: 0.05 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.12;
  ground.receiveShadow = true;
  scene3D.add(ground);

  const grid = new THREE.GridHelper(24, 24, "#2b8290", "#1b3c56");
  grid.position.y = -0.1;
  scene3D.add(grid);

  // Plataforma/cimientos.
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(4.7, 0.35, 4.0),
    new THREE.MeshStandardMaterial({ color: "#60768a", metalness: 0.25, roughness: 0.6 })
  );
  base.position.y = 0.08;
  base.castShadow = true;
  base.receiveShadow = true;
  scene3D.add(base);

  buildingGroup = new THREE.Group();
  buildingGroup.position.y = 0.26;
  scene3D.add(buildingGroup);

  // Silueta semitransparente de la torre objetivo.
  const ghostMaterial = new THREE.MeshStandardMaterial({
    color: "#4bd9e1", transparent: true, opacity: 0.08, roughness: 0.8,
    wireframe: true
  });
  const ghost = new THREE.Mesh(new THREE.BoxGeometry(3.5, 10, 3.0), ghostMaterial);
  ghost.position.set(0, 5, 0);
  scene3D.add(ghost);

  // Marcadores verticales discretos en el terreno.
  for (let i = 0; i < 4; i++) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.4, 0.09),
      new THREE.MeshStandardMaterial({ color: "#55e6df", emissive: "#0a5558", emissiveIntensity: 0.7 })
    );
    post.position.set(i % 2 ? 2.7 : -2.7, 0.1, i < 2 ? 2.3 : -2.3);
    scene3D.add(post);
  }

  window.addEventListener("resize", resize3D);
  animate3D();
}


function animate3D() {
  requestAnimationFrame(animate3D);

  if (controls) {
    controls.update();
  }

  if (renderer && scene3D && camera) {
    renderer.render(scene3D, camera);
  }
}


function resize3D() {
  if (!renderer || !camera || !ui.scene) return;

  const w = Math.max(ui.scene.clientWidth, 300);
  const h = Math.max(ui.scene.clientHeight, 240);

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}


function addFloor() {
  const floorIndex = floors;
  const y = floorIndex * 1.05 + 0.55;

  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0xfaf8f1,
    metalness: 0,
    roughness: 1,
    transparent: false,
    opacity: 1,
    flatShading: true
  });


  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x343b40,
    metalness: 0,
    roughness: 1,
    flatShading: true
  });


  // Losa de cada planta.
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(3.7, 0.13, 3.2),
    frameMaterial
  );
  slab.position.y = y;
  slab.castShadow = true;
  slab.receiveShadow = true;
  buildingGroup.add(slab);

  // Cuatro columnas y paneles de fachada.
 


slab.position.y = y;
slab.castShadow = true;
slab.receiveShadow = true;
buildingGroup.add(slab);

// Contorno oscuro estilo dibujo arquitectónico

    // Contorno oscuro estilo dibujo arquitectónico
    const slabEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(slab.geometry),
        new THREE.LineBasicMaterial({
            color: 0x343b40
        })
    );

    slabEdges.position.copy(slab.position);
    buildingGroup.add(slabEdges);


slabEdges.position.copy(slab.position);
buildingGroup.add(slabEdges);


// Contorno oscuro estilo dibujo arquitectónico

slabEdges.position.copy(slab.position);
buildingGroup.add(slabEdges);


  const front = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.82, 0.035), glassMaterial);
  front.position.set(0, y - 0.51, 1.49);
  buildingGroup.add(front);
  const side = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.82, 2.85), glassMaterial);
  side.position.set(1.73, y - 0.51, 0);
  buildingGroup.add(side);

  // Ventanas verticales para dar escala arquitectónica.
  for (let i = 0; i < 5; i++) {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.78, 0.04), frameMaterial);
    mullion.position.set(-1.25 + i * 0.625, y - 0.51, 1.515);
    buildingGroup.add(mullion);
  }

  floorMaterials.push(glassMaterial);
  controls.target.y = Math.max(1.6, floors * 0.45 + 1.1);
  const targetHeight = Math.min(13, 7 + floors * 0.35);
  camera.position.y = Math.max(camera.position.y, targetHeight);
  controls.update();
}



function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}





function startGame() {
  clearInterval(timerInterval);
  const name = ui.playerName.value.trim();
  if (!name) {
    ui.playerName.focus();
    showFeedback("Escribe tu nombre para registrar el resultado.", "bad");
    return;
  }

  score = 0;
  round = 0;
  floors = 0;
  active = true;
  answered = false;
  gameFinished = false;
  questions = shuffle(questionBank).slice(0, TOTAL_ROUNDS);
  buildingGroup.clear();
  floorMaterials = [];
  ui.score.textContent = "0";
  ui.floors.innerHTML = '0 <small>/ 10</small>';
  ui.round.innerHTML = '0 <small>/ 10</small>';
  ui.progressBar.style.width = "0%";
  ui.progressText.textContent = "0%";
  ui.startBtn.hidden = true;
  ui.nextBtn.hidden = true;
  showFeedback("Obra iniciada. ¡Resuelve el primer cálculo!", "");
  loadQuestion();
}

function loadQuestion() {
  clearInterval(timerInterval);
  if (round >= TOTAL_ROUNDS) {
    finishGame();
    return;
  }
  currentQuestion = questions[round];
  if (typeof currentQuestion.calculate === "function") {
    currentQuestion = { ...currentQuestion, answer: currentQuestion.calculate() };
  }

  answered = false;
  secondsLeft = QUESTION_SECONDS;
  ui.round.innerHTML = `${round + 1} <small>/ ${TOTAL_ROUNDS}</small>`;
  ui.questionNumber.textContent = `RETO ${String(round + 1).padStart(2, "0")}`;
  ui.topicTag.textContent = currentQuestion.topic;
  ui.questionText.textContent = currentQuestion.text;
  ui.formula.textContent = currentQuestion.formula;
  ui.unitLabel.textContent = currentQuestion.unit;
  ui.answerInput.value = "";
  ui.answerInput.disabled = false;
  ui.submitBtn.disabled = false;
  ui.nextBtn.hidden = true;
  ui.answerInput.focus();
  showFeedback("Introduce tu resultado y compruébalo antes de que termine el tiempo.", "");
  updateTimer();
  timerInterval = setInterval(() => {
    secondsLeft -= 1;
    updateTimer();
    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

function updateTimer() {
  ui.timer.innerHTML = `${secondsLeft}<span>s</span>`;
  const pct = Math.max(0, secondsLeft / QUESTION_SECONDS * 100);
  ui.timerBar.style.width = `${pct}%`;
  ui.timerBar.style.background = secondsLeft <= 8 ? "var(--red)" : "var(--cyan)";
}

function showFeedback(message, type) {
  ui.feedback.textContent = message;
  ui.feedback.className = `feedback ${type || ""}`;
}

function submitAnswer(event) {
  event.preventDefault();
  if (!active || answered || !currentQuestion) return;
  const raw = ui.answerInput.value.trim();
  if (raw === "") {
    showFeedback("Escribe una respuesta numérica antes de comprobar.", "bad");
    return;
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    showFeedback("Introduce un número válido.", "bad");
    return;
  }
  answered = true;
  clearInterval(timerInterval);
  ui.answerInput.disabled = true;
  ui.submitBtn.disabled = true;

  if (Math.abs(value - currentQuestion.answer) <= currentQuestion.tolerance) {
    const speedBonus = Math.max(0, secondsLeft * 2);
    const earned = 100 + speedBonus;
    score += earned;
    floors += 1;
    addFloor();
    showFeedback(`¡Correcto! +${earned} puntos (${100} base + ${speedBonus} de rapidez). Planta añadida a la maqueta.`, "good");
  } else {
    const formatted = Number(currentQuestion.answer.toFixed(2)).toLocaleString("es-CO", { maximumFractionDigits: 2 });
    showFeedback(`No es correcto. Resultado esperado: ${formatted} ${currentQuestion.unit}. Repasa la fórmula e inténtalo en el siguiente reto.`, "bad");
  }

  ui.score.textContent = score;
  ui.floors.innerHTML = `${floors} <small>/ 10</small>`;
  const pct = Math.round(round / TOTAL_ROUNDS * 100);
  ui.progressBar.style.width = `${pct}%`;
  ui.progressText.textContent = `${pct}%`;
  ui.nextBtn.hidden = false;
  ui.nextBtn.textContent = round === TOTAL_ROUNDS - 1 ? "Ver resultado final →" : "Siguiente problema →";
}

function handleTimeout() {
  if (!active || answered) return;
  answered = true;
  ui.answerInput.disabled = true;
  ui.submitBtn.disabled = true;
  const formatted = Number(currentQuestion.answer.toFixed(2)).toLocaleString("es-CO", { maximumFractionDigits: 2 });
  showFeedback(`Tiempo agotado. La respuesta era ${formatted} ${currentQuestion.unit}. El siguiente reto te espera.`, "bad");
  ui.nextBtn.hidden = false;
  ui.nextBtn.textContent = round === TOTAL_ROUNDS - 1 ? "Ver resultado final →" : "Siguiente problema →";
  ui.progressBar.style.width = `${Math.round((round + 1) / TOTAL_ROUNDS * 100)}%`;
  ui.progressText.textContent = `${Math.round((round + 1) / TOTAL_ROUNDS * 100)}%`;
}

function nextQuestion() {
  if (!active || !answered) return;
  round += 1;
  loadQuestion();
}

function finishGame() {
  clearInterval(timerInterval);
  active = false;
  gameFinished = true;
  ui.answerInput.disabled = true;
  ui.submitBtn.disabled = true;
  ui.nextBtn.hidden = true;
  ui.startBtn.hidden = false;
  ui.startBtn.textContent = "Jugar de nuevo";
  ui.topicTag.textContent = "OBRA FINALIZADA";
  ui.questionNumber.textContent = "PROYECTO COMPLETADO";
  ui.questionText.textContent = `Terminaste los ${TOTAL_ROUNDS} retos y conseguiste ${floors} plantas. Tu puntuación final es ${score} puntos.`;
  ui.formula.textContent = floors >= 8 ? "EVALUACIÓN: EXCELENTE" : floors >= 5 ? "EVALUACIÓN: BUEN PROGRESO" : "EVALUACIÓN: SIGUE PRACTICANDO";
  ui.unitLabel.textContent = "resultado";
  ui.timer.innerHTML = "—";
  ui.timerBar.style.width = "0%";
  showFeedback(floors >= 8 ? "¡Gran trabajo! Tu torre ya tiene una estructura sólida." : "Cada reto es una oportunidad para mejorar tu diseño y tus cálculos.", "good");
  saveResult();
  renderLeaderboard();
}

function getRanking() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RANKING_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveResult() {
  const name = ui.playerName.value.trim().slice(0, 18) || "Arquitecto/a";
  const ranking = getRanking();
  ranking.push({ name, score, floors, date: new Date().toISOString() });
  ranking.sort((a, b) => b.score - a.score || b.floors - a.floors);
  try {
    localStorage.setItem(RANKING_KEY, JSON.stringify(ranking.slice(0, 20)));
  } catch {
    showFeedback("Partida terminada, pero el navegador no permitió guardar el ranking.", "bad");
  }
}

function renderLeaderboard() {
  const ranking = getRanking().sort((a, b) => b.score - a.score || b.floors - a.floors).slice(0, 5);
  ui.leaderboard.innerHTML = "";
  if (ranking.length === 0) {
    ui.leaderboard.innerHTML = '<li class="empty-rank">Aún no hay resultados. ¡Sé el primero!</li>';
    return;
  }
  ranking.forEach((item, index) => {
    const li = document.createElement("li");
    const number = document.createElement("span");
    number.className = "rank-num";
    number.textContent = String(index + 1).padStart(2, "0");
    const name = document.createElement("span");
    name.className = "rank-name";
    name.textContent = item.name;
    const detail = document.createElement("span");
    detail.className = "rank-score";
    detail.textContent = `${item.score} pts`;
    li.append(number, name, detail);
    ui.leaderboard.appendChild(li);
  });
}

// ---------- Eventos ----------
ui.answerForm.addEventListener("submit", submitAnswer);
ui.startBtn.addEventListener("click", startGame);
ui.nextBtn.addEventListener("click", nextQuestion);
ui.clearRankingBtn.addEventListener("click", () => {
  if (confirm("¿Seguro que quieres borrar toda la clasificación guardada en este navegador?")) {
    localStorage.removeItem(RANKING_KEY);
    renderLeaderboard();
  }
});
ui.playerName.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !active) startGame();
});

renderLeaderboard();
window.addEventListener("beforeunload", () => clearInterval(timerInterval));
