/* ===== Sticky nav + mobile menu ===== */
const nav = document.getElementById('nav');
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40));
burger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
document.getElementById('year').textContent = new Date().getFullYear();

/* ===== Scroll reveal ===== */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 90 + 'ms';
  io.observe(el);
});

/* ===== Animated counters ===== */
const counters = document.querySelectorAll('[data-count]');
const cio = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, target = +el.dataset.count, suffix = el.dataset.suffix || '';
    let cur = 0; const step = Math.max(1, Math.ceil(target / 50));
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { cur = target; clearInterval(t); }
      el.textContent = cur + suffix;
    }, 30);
    cio.unobserve(el);
  });
}, { threshold: 0.6 });
counters.forEach(c => cio.observe(c));

/* ===== Hero typing effect ===== */
const lines = [
  '> New lead received: Acme Corp',
  '> Enriching company data...',
  '> AI score: 92 / 100 — HOT LEAD',
  '> Sent to Slack for approval ✔'
];
const typingEl = document.getElementById('typing');
let li = 0, ci = 0;
function type() {
  if (li >= lines.length) { setTimeout(() => { typingEl.textContent = ''; li = 0; ci = 0; type(); }, 2600); return; }
  if (ci < lines[li].length) {
    typingEl.textContent += lines[li][ci++];
    setTimeout(type, 38);
  } else {
    typingEl.textContent += '\n'; li++; ci = 0;
    setTimeout(type, 500);
  }
}
typingEl.style.whiteSpace = 'pre-line';
type();

/* ===== 3D tilt on service cards (desktop only) ===== */
if (window.matchMedia('(hover:hover)').matches) {
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `translateY(-8px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
    });
    card.addEventListener('mouseleave', () => card.style.transform = '');
  });
}

/* ===== FAQ accordion ===== */
document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-q').addEventListener('click', () => {
    const open = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => { i.classList.remove('open'); i.querySelector('.faq-a').style.maxHeight = 0; });
    if (!open) { item.classList.add('open'); const a = item.querySelector('.faq-a'); a.style.maxHeight = a.scrollHeight + 'px'; }
  });
});

/* ===== Particle network background ===== */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let W, H, pts = [];
function resize() {
  W = canvas.width = innerWidth; H = canvas.height = innerHeight;
  const n = Math.min(80, Math.floor(W * H / 18000));
  pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4 }));
}
function draw() {
  ctx.clearRect(0, 0, W, H);
  pts.forEach((p, i) => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > W) p.vx *= -1;
    if (p.y < 0 || p.y > H) p.vy *= -1;
    ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, 6.283); ctx.fillStyle = 'rgba(0,212,255,.7)'; ctx.fill();
    for (let j = i + 1; j < pts.length; j++) {
      const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < 140) {
        ctx.strokeStyle = `rgba(108,92,231,${(1 - d / 140) * .35})`;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      }
    }
  });
  requestAnimationFrame(draw);
}
addEventListener('resize', resize);
resize();
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) draw();

/* ===== Lead form -> Python (Flask) backend ===== */
const form = document.getElementById('leadForm');
const statusEl = document.getElementById('formStatus');
const btn = document.getElementById('submitBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  statusEl.className = 'form-status';

  if (!data.name || !data.email || !data.message || !data.service) {
    statusEl.textContent = 'Please fill in name, email, service and message.';
    statusEl.classList.add('err'); return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    statusEl.textContent = 'Please enter a valid email address.';
    statusEl.classList.add('err'); return;
  }

  btn.disabled = true; btn.textContent = 'Sending...';
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out.error || 'Something went wrong');
    statusEl.textContent = '✅ Thanks! We received your message and will reply within 24 hours.';
    statusEl.classList.add('ok');
    form.reset();
  } catch (err) {
    statusEl.textContent = '❌ ' + err.message + ' — or email us directly.';
    statusEl.classList.add('err');
  } finally {
    btn.disabled = false; btn.textContent = 'Send Message →';
  }
});
