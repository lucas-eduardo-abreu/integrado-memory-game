// ==================== CONFIG ====================
const CONFIG = {
  ASSET_BASE: "assets/cards",
  EXT: "png",
  BACK_IMAGE: "assets/logo-card.png",
  TOTAL_IMAGES: 10,    // total de imagens disponíveis (enviadas pelo cliente)
  FLIP_BACK_MS: 600,
  IDLE_MS: 40 * 1000, // 40 segundos sem interação => vídeo de atração
  DIFFS: {
    normal:  { label: "Normal",  pairs: 6,  cols: 3, time: 60, warn: false },
    dificil: { label: "Difícil", pairs: 10, cols: 5, time: 60, warn: true  },
  },
};

const LEADS_KEY = "integrado_leads";

const $  = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

// ==================== ELEMENTOS ====================
const screens = {
  attract: $("#screen-attract"),
  start: $("#screen-start"),
  select: $("#screen-select"),
  lead: $("#screen-lead"),
  game: $("#screen-game"),
  win: $("#screen-win"),
  lose: $("#screen-lose"),
};
const board = $("#board");
const hud = { time: $("#hud-time"), diff: $("#hud-difficulty") };
const btnStart = $("#btn-start");
const btnBackStart = $("#btn-back-start");
const btnExit = $("#btn-exit");
const btnPlayAgain = $("#btn-play-again");
const btnGoMenu = $("#btn-go-menu");
const btnLoseRetry = $("#btn-lose-retry");
const btnLoseMenu  = $("#btn-lose-menu");

const warningOverlay = $("#warning-overlay");
const btnWarningOk = $("#btn-warning-ok");

const attractVideo = $("#attract-video");

const leadForm = $("#lead-form");
const leadNameEl = $("#lead-name");
const leadPhoneEl = $("#lead-phone");
const leadEmailEl = $("#lead-email");
const leadErrorEl = $("#lead-error");
const btnLeadBack = $("#btn-lead-back");

// ==================== STATE ====================
let state = {
  diff: null,
  pairs: 0,
  found: 0,
  first: null,
  lock: false,
  timeLeft: 0,
  totalTime: 0,
  timerId: null,
  cols: 0,
  currentLeadId: null,
};

// ==================== UTIL ====================
function showScreen(name){
  $$(".screen").forEach(s => s.classList.remove("screen--active"));
  screens[name].classList.add("screen--active");
}

function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function fmt(sec){
  const s=Math.max(0,sec|0);
  return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ==================== LEADS (localStorage) ====================
function getLeads() {
  try {
    return JSON.parse(localStorage.getItem(LEADS_KEY)) || [];
  } catch { return []; }
}
function genId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function saveLead(lead) {
  const leads = getLeads();
  leads.push(lead);
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}
function clearLeads() {
  localStorage.removeItem(LEADS_KEY);
}
function updateLeadResult(id, won) {
  if (!id) return;
  const leads = getLeads();
  const idx = leads.findIndex(l => l.id === id);
  if (idx === -1) return;
  leads[idx].result = won ? "venceu" : "perdeu";
  leads[idx].finishedAt = new Date().toISOString();
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}

function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function validPhone(v){ return v.replace(/\D/g,"").length >= 8; }

leadForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const name = String(fd.get("name") || "").trim();
  const phone = String(fd.get("phone") || "").trim();
  const email = String(fd.get("email") || "").trim();

  if (!name || !phone || !email) {
    showLeadError("Preencha todos os campos para continuar.");
    return;
  }
  if (!validEmail(email)) {
    showLeadError("Digite um e-mail válido.");
    return;
  }
  if (!validPhone(phone)) {
    showLeadError("Digite um telefone válido.");
    return;
  }
  leadErrorEl.hidden = true;

  const leadId = genId();
  state.currentLeadId = leadId;
  saveLead({
    id: leadId,
    name, phone, email,
    difficulty: CONFIG.DIFFS[state.diff]?.label || state.diff,
    result: null,
    timestamp: new Date().toISOString(),
  });

  leadForm.reset();

  if (CONFIG.DIFFS[state.diff]?.warn) {
    warningOverlay.hidden = false;
  } else {
    startGameFlow();
  }
});

function showLeadError(msg){
  leadErrorEl.textContent = msg;
  leadErrorEl.hidden = false;
}

btnLeadBack.onclick = () => showScreen("select");

function goToLeadForm(){
  showScreen("lead");
  leadNameEl.focus();
}

btnWarningOk.onclick = () => {
  warningOverlay.hidden = true;
  startGameFlow();
};

function startGameFlow(){
  renderBoard(state.diff);
  showScreen("game");
}

// ==================== TIMEBAR ====================
function updateTimebar(pct){
  const bar=$("#timebar");
  const fill=bar.querySelector(".timebar__fill");
  fill.style.width=(pct*100).toFixed(0)+"%";
}

// ==================== TIMER ====================
function startTimer(){
  const now=Date.now();
  state.end=now+state.timeLeft*1000;
  state.timerId=setInterval(()=>{
    const left=Math.ceil((state.end-Date.now())/1000);
    state.timeLeft=Math.max(0,left);
    hud.time.textContent=fmt(state.timeLeft);
    updateTimebar(state.timeLeft/state.totalTime);
    if(state.timeLeft<=0){ stopTimer(); timeUp(); }
  },250);
}
function stopTimer(){
  clearInterval(state.timerId);
  state.timerId=null;
}
function timeUp(){
  state.lock = true;
  board.style.pointerEvents = "none";
  updateLeadResult(state.currentLeadId, false);
  showScreen("lose");
}

// ==================== BOARD ====================
function pickImageIndices(pairsNeeded){
  const all = Array.from({length: CONFIG.TOTAL_IMAGES}, (_,i)=>i+1);
  return shuffle(all).slice(0, pairsNeeded);
}

function makeDeck(pairsNeeded){
  const indices = pickImageIndices(pairsNeeded);
  const deck=[];
  indices.forEach(i => {
    const src=`${CONFIG.ASSET_BASE}/${i}.${CONFIG.EXT}`;
    deck.push({k:i,src});
    deck.push({k:i,src});
  });
  return shuffle(deck);
}

function resizeBoardCells() {
  const style = getComputedStyle(board);
  const gap = parseFloat(style.rowGap || style.gap) || 0;

  const cols = state.cols || 2;
  const totalCards = state.pairs * 2;
  const rows = Math.ceil(totalCards / cols);

  const contW = board.clientWidth;
  const contH = board.clientHeight;

  const gapW = (cols - 1) * gap;
  const gapH = (rows - 1) * gap;

  const cellW = (contW - gapW) / cols;
  const cellH = (contH - gapH) / rows;
  let cell = Math.floor(Math.max(40, Math.min(cellW, cellH)));

  const MAX_CELL = 180;
  board.style.setProperty("--cell-size", `${Math.min(cell, MAX_CELL)}px`);
}

function renderBoard(diff){
  const cfg = CONFIG.DIFFS[diff] || CONFIG.DIFFS.normal;
  Object.assign(state,{diff, pairs:cfg.pairs,found:0,first:null,lock:false, cols: cfg.cols});
  hud.diff.textContent = cfg.label;
  board.className = "board board--" + (cfg.cols === 5 ? "hard" : "normal");
  board.innerHTML="";
  board.style.pointerEvents="auto";

  state.totalTime=cfg.time;
  state.timeLeft=state.totalTime;
  hud.time.textContent=fmt(state.timeLeft);
  updateTimebar(1);

  const deck=makeDeck(cfg.pairs);
  deck.forEach(({k,src})=>{
    const c=document.createElement("div");
    c.className="card"; c.dataset.k=k;

    const inner=document.createElement("div");
    inner.className="card__inner";

    const f1=document.createElement("div");
    f1.className="card__face card__face--front";
    const img=document.createElement("img");
    img.src=src; img.decoding="async"; img.loading="eager";
    f1.appendChild(img);

    const f2=document.createElement("div");
    f2.className="card__face card__face--back";
    const backChip=document.createElement("div");
    backChip.className="card-back-chip";
    const backImg=document.createElement("img");
    backImg.className="card-back-img";
    backImg.src=CONFIG.BACK_IMAGE;
    backImg.alt="Costas da carta";
    backImg.decoding="async"; backImg.loading="eager";
    backChip.appendChild(backImg);
    f2.appendChild(backChip);

    inner.append(f1,f2);
    c.appendChild(inner);
    c.onclick=()=>flip(c);
    board.appendChild(c);
  });

  requestAnimationFrame(resizeBoardCells);
}

function flip(card){
  if(state.lock||card.classList.contains("flipped"))return;
  card.classList.add("flipped");
  if(!state.first){
    state.first=card;
    if(!state.timerId) startTimer();
    return;
  }
  const match=state.first.dataset.k===card.dataset.k;
  if(match){
    state.first=null; state.found++;
    if(state.found===state.pairs){ stopTimer(); win(); }
  }else{
    state.lock=true;
    setTimeout(()=>{
      card.classList.remove("flipped");
      state.first.classList.remove("flipped");
      state.first=null; state.lock=false;
    },CONFIG.FLIP_BACK_MS);
  }
}

function win(){
  const elapsed = state.totalTime - state.timeLeft;
  updateLeadResult(state.currentLeadId, true);
  let resultEl = $("#win-result");
  if (!resultEl) {
    resultEl = document.createElement("p");
    resultEl.id = "win-result";
    resultEl.className = "win-result";
    $(".panel--win .win-title").after(resultEl);
  }
  resultEl.textContent = `Tempo: ${fmt(elapsed)}`;

  showScreen("win");
  startConfetti();
}

// ==================== NAV ====================
btnStart.onclick = () => showScreen("select");
btnBackStart.onclick = () => showScreen("start");

$$('#screen-select .btn-diff').forEach(b => b.onclick = () => {
  state.diff = b.dataset.diff;
  goToLeadForm();
});

btnExit.onclick=()=>{ stopTimer(); showScreen("start"); };

// "Jogar novamente" / "Tentar novamente" voltam pra seleção de dificuldade,
// exigindo um novo cadastro de lead a cada partida.
btnPlayAgain.onclick=()=>{ stopConfetti(); showScreen("select"); };
btnGoMenu.onclick=()=>{ stopConfetti(); stopTimer(); showScreen("start"); };

btnLoseRetry.onclick=()=>{ showScreen("select"); };
btnLoseMenu.onclick =()=>{ stopTimer(); showScreen("start"); };

showScreen("start");

window.addEventListener("resize", debounce(() => {
  if (screens.game.classList.contains("screen--active")) {
    resizeBoardCells();
  }
}, 150));

// ==================== IDLE / ATRAÇÃO ====================
let lastActivity = Date.now();
let inAttractMode = false;

function markActivity(){
  lastActivity = Date.now();
}
["mousemove","mousedown","touchstart","keydown","wheel","click"].forEach(evt => {
  document.addEventListener(evt, () => {
    if (!inAttractMode) markActivity();
  }, { passive: true });
});

function enterAttractMode(){
  if (inAttractMode) return;
  inAttractMode = true;

  // pausa qualquer partida em andamento e volta ao estado neutro por baixo
  stopTimer();
  stopConfetti();
  showScreen("start");
  showScreen("attract");

  // carrega o vídeo só na primeira vez que for realmente necessário (evita
  // baixar/decodificar um arquivo grande logo na abertura do totem)
  if (!attractVideo.src) {
    attractVideo.src = attractVideo.dataset.src;
  }
  attractVideo.currentTime = 0;
  attractVideo.muted = false;
  const p = attractVideo.play();
  if (p && p.catch) {
    p.catch(() => {
      // autoplay com áudio bloqueado pelo navegador: tenta mudo
      attractVideo.muted = true;
      attractVideo.play().catch(()=>{});
    });
  }
}

function exitAttractMode(){
  if (!inAttractMode) return;
  inAttractMode = false;
  attractVideo.pause();
  markActivity();
  showScreen("select");
}

screens.attract.addEventListener("click", exitAttractMode);
screens.attract.addEventListener("touchstart", exitAttractMode, { passive: true });

setInterval(() => {
  if (!inAttractMode && Date.now() - lastActivity > CONFIG.IDLE_MS) {
    enterAttractMode();
  }
}, 5000);

// ==================== PAINEL ADMINISTRATIVO (F9) ====================
const adminOverlay = $("#admin-overlay");
const adminTbody = $("#admin-tbody");
const adminCount = $("#admin-count");

function renderAdmin(){
  const leads = getLeads();
  adminCount.textContent = leads.length;
  adminTbody.innerHTML = "";
  leads.slice().reverse().forEach(l => {
    const tr = document.createElement("tr");
    const dt = new Date(l.timestamp);
    const resultLabel = l.result === "venceu" ? "🏆 Venceu" : l.result === "perdeu" ? "⏰ Perdeu" : "—";
    tr.innerHTML = `<td>${escapeHtml(l.name)}</td><td>${escapeHtml(l.phone)}</td><td>${escapeHtml(l.email)}</td><td>${escapeHtml(l.difficulty || "—")}</td><td>${resultLabel}</td><td>${dt.toLocaleString("pt-BR")}</td>`;
    adminTbody.appendChild(tr);
  });
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function openAdmin(){
  renderAdmin();
  adminOverlay.hidden = false;
}
function closeAdmin(){
  adminOverlay.hidden = true;
}

document.addEventListener("keydown", (e) => {
  if (e.key === "F9") {
    e.preventDefault();
    if (adminOverlay.hidden) openAdmin(); else closeAdmin();
  } else if (e.key === "Escape" && !adminOverlay.hidden) {
    closeAdmin();
  }
});
$("#admin-close").onclick = closeAdmin;
adminOverlay.addEventListener("click", (e) => { if (e.target === adminOverlay) closeAdmin(); });

$("#admin-export").onclick = () => {
  const leads = getLeads();
  if (!leads.length) { alert("Nenhum lead cadastrado ainda."); return; }
  const rows = leads.map(l => ({
    Nome: l.name,
    Telefone: l.phone,
    "E-mail": l.email,
    Dificuldade: l.difficulty || "—",
    Resultado: l.result === "venceu" ? "Venceu" : l.result === "perdeu" ? "Perdeu" : "Não finalizou",
    Data: new Date(l.timestamp).toLocaleString("pt-BR"),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{wch:28},{wch:18},{wch:28},{wch:14},{wch:16},{wch:20}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
  XLSX.writeFile(wb, `leads_integrado_${stamp}.xlsx`);
};

$("#admin-clear").onclick = () => {
  const leads = getLeads();
  if (!leads.length) { alert("Não há leads para limpar."); return; }
  if (confirm(`Tem certeza que deseja apagar todos os ${leads.length} lead(s) cadastrados? Essa ação não pode ser desfeita.`)) {
    clearLeads();
    renderAdmin();
  }
};

// ==================== CONFETTI ====================
let confettiRAF = null;
let confettiParticles = [];
let confettiStartedAt = 0;
const CONFETTI_COLORS = ["#ffffff", "#3996d3", "#eb942d", "#ea543d", "#6b97cd", "#eaf1fa"];
const CONFETTI_DURATION_MS = 7000;
const CONFETTI_GRAVITY = 0.12;
const CONFETTI_DRAG = 0.995;
const CONFETTI_COUNT = 320;

function getCanvas() { return document.getElementById("confetti-canvas"); }
function resizeConfettiCanvas() {
  const c = getCanvas(); if (!c) return;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  c.width  = Math.floor(c.clientWidth  * dpr);
  c.height = Math.floor(c.clientHeight * dpr);
  const ctx = c.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function makeParticle(w, h) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 4 + Math.random() * 6;
  return {
    x: Math.random() * w,
    y: -20 + Math.random() * 40,
    vx: Math.cos(angle) * speed * 0.6,
    vy: Math.sin(angle) * speed * 0.2,
    size: 6 + Math.random() * 8,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.2,
    color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
    shape: Math.random() < 0.5 ? "rect" : "circle",
  };
}
function startConfetti() {
  const c = getCanvas(); if (!c) return;
  resizeConfettiCanvas();
  const w = c.clientWidth, h = c.clientHeight;
  confettiParticles = Array.from({ length: CONFETTI_COUNT }, () => makeParticle(w, h));
  confettiStartedAt = performance.now();
  cancelAnimationFrame(confettiRAF);
  tickConfetti();
}
function stopConfetti() {
  cancelAnimationFrame(confettiRAF);
  confettiRAF = null;
  const c = getCanvas(); if (c) c.getContext("2d").clearRect(0, 0, c.width, c.height);
}
function tickConfetti(ts) {
  const c = getCanvas(); if (!c) return;
  const ctx = c.getContext("2d");
  const w = c.clientWidth, h = c.clientHeight;

  if (ts && ts - confettiStartedAt > CONFETTI_DURATION_MS) { stopConfetti(); return; }

  ctx.clearRect(0, 0, c.width, c.height);

  for (let p of confettiParticles) {
    p.vx *= CONFETTI_DRAG;
    p.vy = p.vy * CONFETTI_DRAG + CONFETTI_GRAVITY;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;

    if (p.y > h + 20) {
      p.y = -20;
      p.x = Math.random() * w;
      p.vy = 1 + Math.random() * 2;
      p.vx = (Math.random() - 0.5) * 6;
    }

    const flicker = 0.5 + 0.5 * Math.cos(p.rot * 3);
    const a = 0.6 + 0.4 * flicker;

    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);

    if (p.shape === "rect") {
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  confettiRAF = requestAnimationFrame(tickConfetti);
}

window.addEventListener("resize", () => {
  const c = getCanvas();
  if (!c || c.closest(".screen")?.id !== "screen-win" || !c.closest(".screen")?.classList.contains("screen--active")) return;
  resizeConfettiCanvas();
});
