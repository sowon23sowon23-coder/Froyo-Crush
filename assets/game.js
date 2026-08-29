const views = [...document.querySelectorAll(".view")];
const navButtons = [...document.querySelectorAll(".bottom-nav button")];
const board = document.getElementById("board");
const goalLeft = document.getElementById("goalLeft");
const movesLeft = document.getElementById("movesLeft");
const scoreValue = document.getElementById("scoreValue");
const scoreFill = document.getElementById("scoreFill");
const toast = document.getElementById("toast");
const winModal = document.getElementById("winModal");
const failModal = document.getElementById("failModal");
const shuffleBtn = document.getElementById("shuffleBtn");
const bombBtn = document.getElementById("bombBtn");
const restartBtn = document.getElementById("restartBtn");
const tryAgainBtn = document.getElementById("tryAgainBtn");
const shuffleCount = document.getElementById("shuffleCount");
const bombCount = document.getElementById("bombCount");

const size = 7;
const targetScore = 5200;
const pieces = [
  ["berry", "#ff8798", "#d91f47"],
  ["blueberry", "#8d9fff", "#33449b"],
  ["kiwi", "#c7ec7d", "#5e941d"],
  ["mango", "#ffda72", "#e48b1f"],
  ["choco", "#c79562", "#6e3e20"]
];

let grid = [];
let selected = null;
let busy = false;
let moves = 18;
let goal = 15;
let score = 0;
let shuffles = 3;
let bombs = 2;
let gameStarted = false;

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-view]");
  if (!trigger) return;
  showView(trigger.dataset.view);
});

restartBtn.addEventListener("click", startGame);
tryAgainBtn.addEventListener("click", startGame);
shuffleBtn.addEventListener("click", () => {
  if (busy || shuffles < 1) return;
  shuffles -= 1;
  shuffleBoard();
  syncHud();
  showToast("Shuffled");
});
bombBtn.addEventListener("click", () => {
  if (busy || bombs < 1 || !selected) {
    showToast("Pick a tile");
    return;
  }
  bombs -= 1;
  blastAt(selected.row, selected.col);
});

window.addEventListener("resize", placeTiles);

function showView(id) {
  views.forEach((view) => view.classList.toggle("active", view.id === id));
  navButtons.forEach((button) => {
    const linked = button.dataset.view;
    button.classList.toggle("active", linked === id || (id === "map" && linked === "home") || (id === "coupon" && linked === "rewards"));
  });
  closeModals();
  if (id === "game" && !gameStarted) startGame();
}

function startGame() {
  moves = 18;
  goal = 15;
  score = 0;
  shuffles = 3;
  bombs = 2;
  selected = null;
  busy = false;
  gameStarted = true;
  closeModals();
  buildBoard();
  syncHud();
  showToast("Level 4");
}

function buildBoard() {
  board.innerHTML = "";
  grid = [];
  for (let row = 0; row < size; row += 1) {
    grid[row] = [];
    for (let col = 0; col < size; col += 1) {
      let type = randomPiece();
      let guard = 0;
      while (wouldMatch(row, col, type) && guard < 20) {
        type = randomPiece();
        guard += 1;
      }
      grid[row][col] = createTile(row, col, type);
    }
  }
  placeTiles();
}

function createTile(row, col, type) {
  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = "tile";
  tile.dataset.row = row;
  tile.dataset.col = col;
  tile.dataset.type = type;
  paintTile(tile, type);
  tile.addEventListener("click", () => chooseTile(tile));
  board.appendChild(tile);
  return { row, col, type, tile };
}

function paintTile(tile, type) {
  const [name, light, dark] = pieces[type];
  tile.dataset.type = name;
  tile.style.background = `radial-gradient(circle at 32% 26%, ${light}, ${dark} 78%)`;
}

function placeTiles() {
  if (!board || !grid.length) return;
  const cell = board.clientWidth / size;
  grid.flat().forEach((piece) => {
    if (!piece) return;
    const pad = cell * .09;
    piece.tile.style.width = `${cell - pad * 2}px`;
    piece.tile.style.height = `${cell - pad * 2}px`;
    piece.tile.style.transform = `translate(${piece.col * cell + pad}px, ${piece.row * cell + pad}px)`;
  });
}

function chooseTile(tile) {
  if (busy) return;
  const piece = findPiece(tile);
  if (!piece) return;
  if (!selected) {
    select(piece);
    return;
  }
  if (selected === piece) {
    clearSelection();
    return;
  }
  if (isNeighbor(selected, piece)) {
    swapAttempt(selected, piece);
    return;
  }
  select(piece);
}

function findPiece(tile) {
  return grid.flat().find((piece) => piece && piece.tile === tile);
}

function select(piece) {
  clearSelection();
  selected = piece;
  piece.tile.classList.add("selected");
}

function clearSelection() {
  if (selected) selected.tile.classList.remove("selected");
  selected = null;
}

async function swapAttempt(a, b) {
  busy = true;
  clearSelection();
  swapPieces(a, b);
  placeTiles();
  await wait(170);
  const hits = findMatches();
  if (!hits.length) {
    swapPieces(a, b);
    placeTiles();
    showToast("No match");
    await wait(170);
    busy = false;
    return;
  }
  moves -= 1;
  await resolveMatches(hits);
  busy = false;
  finishTurn();
}

async function resolveMatches(firstHits) {
  let hits = firstHits;
  let combo = 1;
  while (hits.length) {
    const berryHits = hits.filter((piece) => piece.type === 0).length;
    goal = Math.max(0, goal - berryHits);
    score += hits.length * 85 * combo;
    syncHud();
    showToast(combo > 1 ? `Combo x${combo}` : `+${hits.length * 85}`);
    hits.forEach((piece) => piece.tile.classList.add("pop"));
    await wait(230);
    hits.forEach((piece) => {
      piece.tile.remove();
      grid[piece.row][piece.col] = null;
    });
    collapseBoard();
    await wait(220);
    hits = findMatches();
    combo += 1;
  }
}

function collapseBoard() {
  for (let col = 0; col < size; col += 1) {
    let writeRow = size - 1;
    for (let row = size - 1; row >= 0; row -= 1) {
      const piece = grid[row][col];
      if (piece) {
        grid[writeRow][col] = piece;
        piece.row = writeRow;
        piece.col = col;
        writeRow -= 1;
      }
    }
    for (let row = writeRow; row >= 0; row -= 1) {
      grid[row][col] = createTile(row, col, randomPiece());
    }
  }
  placeTiles();
}

function finishTurn() {
  syncHud();
  if (goal <= 0) {
    winModal.classList.add("show");
    return;
  }
  if (moves <= 0) {
    failModal.classList.add("show");
  }
}

async function blastAt(row, col) {
  busy = true;
  clearSelection();
  const hits = [];
  for (let r = row - 1; r <= row + 1; r += 1) {
    for (let c = col - 1; c <= col + 1; c += 1) {
      if (grid[r] && grid[r][c]) hits.push(grid[r][c]);
    }
  }
  goal = Math.max(0, goal - hits.filter((piece) => piece.type === 0).length);
  score += hits.length * 65;
  syncHud();
  showToast("Blast");
  hits.forEach((piece) => piece.tile.classList.add("pop"));
  await wait(230);
  hits.forEach((piece) => {
    piece.tile.remove();
    grid[piece.row][piece.col] = null;
  });
  collapseBoard();
  await wait(220);
  const matches = findMatches();
  if (matches.length) await resolveMatches(matches);
  busy = false;
  finishTurn();
}

function shuffleBoard() {
  const types = grid.flat().map((piece) => piece.type).sort(() => Math.random() - .5);
  grid.flat().forEach((piece, index) => {
    piece.type = types[index];
    paintTile(piece.tile, piece.type);
  });
}

function findMatches() {
  const hits = new Set();
  for (let row = 0; row < size; row += 1) {
    let run = [grid[row][0]];
    for (let col = 1; col <= size; col += 1) {
      const current = col < size ? grid[row][col] : null;
      if (current && run[0] && current.type === run[0].type) {
        run.push(current);
      } else {
        if (run.length >= 3) run.forEach((piece) => hits.add(piece));
        run = [current];
      }
    }
  }
  for (let col = 0; col < size; col += 1) {
    let run = [grid[0][col]];
    for (let row = 1; row <= size; row += 1) {
      const current = row < size ? grid[row][col] : null;
      if (current && run[0] && current.type === run[0].type) {
        run.push(current);
      } else {
        if (run.length >= 3) run.forEach((piece) => hits.add(piece));
        run = [current];
      }
    }
  }
  return [...hits];
}

function wouldMatch(row, col, type) {
  const leftOne = grid[row] && grid[row][col - 1];
  const leftTwo = grid[row] && grid[row][col - 2];
  const upOne = grid[row - 1] && grid[row - 1][col];
  const upTwo = grid[row - 2] && grid[row - 2][col];
  return (leftOne && leftTwo && leftOne.type === type && leftTwo.type === type) ||
    (upOne && upTwo && upOne.type === type && upTwo.type === type);
}

function swapPieces(a, b) {
  const aRow = a.row;
  const aCol = a.col;
  grid[a.row][a.col] = b;
  grid[b.row][b.col] = a;
  a.row = b.row;
  a.col = b.col;
  b.row = aRow;
  b.col = aCol;
}

function isNeighbor(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

function randomPiece() {
  return Math.floor(Math.random() * pieces.length);
}

function syncHud() {
  goalLeft.textContent = goal;
  movesLeft.textContent = moves;
  scoreValue.textContent = score.toLocaleString();
  scoreFill.style.width = `${Math.min(100, score / targetScore * 100)}%`;
  shuffleCount.textContent = shuffles;
  bombCount.textContent = bombs;
  shuffleBtn.disabled = shuffles < 1;
  bombBtn.disabled = bombs < 1;
}

function closeModals() {
  winModal.classList.remove("show");
  failModal.classList.remove("show");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("show");
  void toast.offsetWidth;
  toast.classList.add("show");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
