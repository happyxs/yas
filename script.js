(() => {
const $ = s => document.querySelector(s);
const rnd = (a, b) => Math.random() * (b - a) + a;
const cv = $('#c'), ctx = cv.getContext('2d');
let W, H, dpr = 1, mx = 0, my = 0, tm = 0, mode = 'intro', prog = 0, done = false, rk, ac;

function rs() { dpr = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
rs(); addEventListener('resize', rs);

/* ---------- partículas (sprites em cache = leve) ---------- */
const P = [], MAX = 380, BLUES = ['#4da3ff', '#2b6fe8', '#7aa8ff'];
const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), r: rnd(.3, 1.8), t: rnd(0, 6), z: rnd(.2, 1) }));
const cache = {};
function sprite(ch, c, s) {
  const sz = Math.max(8, Math.round(s / 4) * 4), k = ch + c + sz;
  if (cache[k]) return cache[k];
  const d = Math.ceil(sz * 1.6), o = document.createElement('canvas'), x = o.getContext('2d');
  o.width = o.height = d * 2; x.scale(2, 2);
  x.font = sz + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = c; x.shadowColor = c; x.shadowBlur = 8; x.fillText(ch, d / 2, d / 2);
  return cache[k] = { c: o, d };
}
const add = o => {
  if (P.length >= MAX) return;
  const p = Object.assign({ type: 't', ch: '♥', x: 0, y: 0, vx: 0, vy: 0, g: 0, s: 16, c: '#4da3ff', a: 1, l: 1, f: .01, r: 0, vr: 0, drag: 1 }, o);
  if (p.type === 't') p.sp = sprite(p.ch, p.c, p.s);
  P.push(p);
};

function burst(x = W / 2, y = H / 2, n = 110) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, 6.283), sp = rnd(3, 11), h = Math.random() < .55;
    add({ ch: h ? '♥' : Math.random() < .5 ? '✦' : '★', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: .05, drag: .985, s: rnd(12, 32), c: h ? BLUES[i % 3] : '#fff', vr: rnd(-.1, .1), f: .007 });
  }
}
function firework(x, y) {
  const c = ['#4da3ff', '#bfe0ff', '#fff', '#7aa8ff'][Math.floor(rnd(0, 4))];
  for (let i = 0; i < 36; i++) { const a = rnd(0, 6.283), sp = rnd(1, 5.5); add({ type: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: .04, drag: .98, s: rnd(1.2, 2.6), c, f: .015 }); }
}
const rocket = () => add({ type: 'rocket', x: rnd(.15, .85) * W, y: H, vy: -rnd(10, 13), g: .15, s: 2.5, c: '#fff', f: .0005 });

function loop() {
  ctx.clearRect(0, 0, W, H); tm += .03; ctx.fillStyle = '#fff';
  for (const s of stars) {
    ctx.globalAlpha = .25 + .75 * Math.abs(Math.sin(tm * s.z + s.t));
    ctx.beginPath(); ctx.arc(s.x * W + mx * s.z * 14, s.y * H + my * s.z * 10, s.r, 0, 6.283); ctx.fill();
  }
  const rate = mode === 'final' ? .14 : mode === 'scene' ? .05 + prog * .08 : .04;
  if (Math.random() < rate) add({ x: rnd(0, W), y: H + 20, vx: rnd(-.3, .3), vy: -rnd(.4, 1.2), s: rnd(10, 24), a: .55, f: .0012 });
  if (mode === 'final' && Math.random() < .07) add({ ch: '✦', c: '#fff', x: rnd(0, W), y: -10, vy: rnd(.6, 1.8), s: rnd(8, 20), vr: .02, f: .002, a: .9 });
  if (Math.random() < .004) add({ type: 'streak', x: rnd(.3, 1) * W, y: rnd(0, .4) * H, vx: -rnd(8, 12), vy: rnd(3, 6), f: .03, c: '#fff' });
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i];
    p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.l -= p.f;
    if (p.type === 'rocket' && p.vy > -1) { firework(p.x, p.y); p.l = 0; }
    if (p.l <= 0 || p.y < -40 || p.y > H + 40 || p.x < -40 || p.x > W + 40) { P[i] = P[P.length - 1]; P.pop(); continue; }
    ctx.globalAlpha = Math.max(0, Math.min(1, p.l * 1.5)) * p.a;
    if (p.type === 'streak') { ctx.strokeStyle = p.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 5, p.y - p.vy * 5); ctx.stroke(); }
    else if (p.type === 'spark' || p.type === 'rocket') { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.283); ctx.fill(); ctx.fillStyle = '#fff'; }
    else {
      const cs = Math.cos(p.r), sn = Math.sin(p.r), d = p.sp.d;
      ctx.setTransform(dpr * cs, dpr * sn, -dpr * sn, dpr * cs, dpr * p.x, dpr * p.y);
      ctx.drawImage(p.sp.c, -d / 2, -d / 2, d, d);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(loop);
}
loop();

/* ---------- texto letra por letra ---------- */
function prep(el, lines) {
  el.innerHTML = ''; const out = []; let n = 0;
  lines.forEach(line => {
    const d = document.createElement('div'); d.className = 'line';
    line.split(' ').forEach(w => {
      const ws = document.createElement('span'); ws.className = 'wd' + (w === 'CAPOTAR' ? ' cap' : '');
      [...w].forEach(ch => { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', n++); s.textContent = ch; ws.appendChild(s); out.push(s); });
      d.appendChild(ws); d.appendChild(document.createTextNode(' '));
    });
    el.appendChild(d);
  });
  return out;
}
const reveal = (list, ms, cb) => { list.forEach((s, i) => setTimeout(() => s.classList.add('on'), i * ms)); setTimeout(cb, list.length * ms + 200); };

const msgCh = prep($('#msg'), ['antes de eu CAPOTAR de dormir, não posso deixar de deixar o meu boa noite para essa moça 💙']);
const words = [...document.querySelectorAll('.w')], WT = ['linda', 'maravilhosa', 'perfeita'], TH = [.2, .5, .8];
words.forEach((w, i) => prep(w, [WT[i]]));
const finCh = prep($('#fin'), ['BOA NOITE', 'MOÇA LINDAAAAAAA,', 'ATÉ AMANHÃ']);

/* ---------- som e vibração ---------- */
const initAudio = () => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); } catch (e) {} };
function chime() {
  if (!ac) return;
  try { [659.25, 783.99, 987.77, 1318.5, 1567.98].forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * .14; o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + 1.6); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 1.7); }); } catch (e) {}
}
const vib = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

/* ---------- fluxo ---------- */
$('#start').addEventListener('click', () => {
  initAudio(); mode = 'scene';
  $('#intro').classList.add('hide'); $('#scene').classList.remove('hide');
  setTimeout(() => reveal(msgCh, 38, () => $('#slw').classList.add('ready')), 500);
});

const sl = $('#sl'), knob = $('#knob'), fill = $('#fill');
const maxX = () => sl.clientWidth - knob.offsetWidth - 8;
function setP(p) {
  prog = Math.max(0, Math.min(1, p));
  knob.style.transform = `translateX(${prog * maxX()}px)`;
  fill.style.width = prog * maxX() + 60 + 'px';
  $('#hint').style.opacity = prog > .04 ? 0 : 1;
  $('#pct').textContent = Math.round(prog * 100) + '%';
  document.documentElement.style.setProperty('--glow', prog.toFixed(2));
  words.forEach((w, i) => { if (prog >= TH[i] && !w.classList.contains('on')) { w.classList.add('on'); vib(30); const r = knob.getBoundingClientRect(); for (let k = 0; k < 14; k++) add({ x: r.left + 28, y: r.top + 28, vx: rnd(-3, 3), vy: rnd(-5, -1), g: .08, s: rnd(10, 20), c: BLUES[k % 3], f: .014 }); } });
  if (prog >= .97 && !done) finish();
}
let drag = false;
const pos = e => { const r = sl.getBoundingClientRect(); return (e.clientX - r.left - knob.offsetWidth / 2 - 4) / maxX(); };
sl.addEventListener('pointerdown', e => { if (done) return; drag = true; sl.setPointerCapture(e.pointerId); setP(pos(e)); });
sl.addEventListener('pointermove', e => {
  if (!drag || done) return; setP(pos(e));
  if (Math.random() < .6) { const r = knob.getBoundingClientRect(); add({ x: r.left + 28, y: r.top + 28, vx: rnd(-.8, .8), vy: -rnd(.5, 1.8), s: rnd(8, 18), c: BLUES[Math.floor(rnd(0, 3))], f: .015 }); }
});
['pointerup', 'pointercancel'].forEach(ev => sl.addEventListener(ev, () => drag = false));
knob.addEventListener('keydown', e => { if (e.key === 'ArrowRight') setP(prog + .1); if (e.key === 'ArrowLeft') setP(prog - .1); });

function finish() {
  done = true; mode = 'final'; setP(1); chime(); vib([60, 40, 140]);
  $('#flash').classList.add('go');
  [0, .25].forEach(d => { const r = document.createElement('div'); r.className = 'ring'; r.style.animationDelay = d + 's'; document.body.appendChild(r); setTimeout(() => r.remove(), 2600); });
  setTimeout(() => {
    $('#scene').classList.add('hide'); $('#final').classList.remove('hide'); $('#moon').classList.add('big');
    burst(); firework(W * .25, H * .3); firework(W * .75, H * .35);
    reveal(finCh, 55, () => { $('#fin').classList.add('wave'); $('#small').classList.add('on'); $('#again').classList.add('on'); });
    setTimeout(burst, 1000); setTimeout(() => burst(W / 2, H / 2, 70), 2200);
    rk = setInterval(rocket, 1300);
  }, 380);
}

function reset() {
  clearInterval(rk); done = false; mode = 'scene';
  $('#flash').classList.remove('go'); $('#moon').classList.remove('big');
  finCh.forEach(s => s.classList.remove('on')); $('#fin').classList.remove('wave');
  $('#small').classList.remove('on'); $('#again').classList.remove('on');
  words.forEach(w => w.classList.remove('on'));
  $('#final').classList.add('hide'); $('#scene').classList.remove('hide'); setP(0);
}
$('#again').addEventListener('click', reset);

document.addEventListener('pointerdown', e => { if (mode === 'final' && !e.target.closest('button')) { burst(e.clientX, e.clientY, 40); firework(e.clientX, e.clientY); } });
document.addEventListener('pointermove', e => { mx = e.clientX / W * 2 - 1; my = e.clientY / H * 2 - 1; $('#moon').style.transform = `translate(${mx * -14}px,${my * -10}px)`; });
})();
