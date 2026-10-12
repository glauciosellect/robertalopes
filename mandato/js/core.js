// Núcleo compartilhado: dados (padrão + CMS), formatação, animações.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const BASE = new URL('../', import.meta.url).href;

/* ---------- conteúdo padrão (nada inventado; campos vazios = a preencher) ---------- */
export const DEFAULTS = {
  numeros: [
    { valor: 63840, rotulo: 'Mineiros confiaram em Roberta' },
    { valor: 7924, rotulo: 'Votos em 2024 para vereadora' },
    { valor: 12.3, prefixo: 'R$ ', sufixo: ' milhões', decimais: 1, rotulo: 'Em emendas indicadas para a Zona da Mata' },
    { valor: 22, rotulo: 'Municípios já contemplados' }
  ],
  // Contadores da área "Na Assembleia". null = ainda não informado (aparece "—").
  assembleia: [
    { rotulo: 'Projetos de lei', valor: null },
    { rotulo: 'Requerimentos', valor: null },
    { rotulo: 'Discursos', valor: null },
    { rotulo: 'Votações', valor: null },
    { rotulo: 'Comissões', valor: null },
    { rotulo: 'Audiências', valor: null },
    { rotulo: 'Proposições', valor: null },
    { rotulo: 'Ações parlamentares', valor: null }
  ],
  golacos: [
    { titulo: 'Programa Escola Segura', descricao: 'Treinamento de professores e funcionários em primeiros socorros e resposta a ataques nas escolas municipais.' },
    { titulo: 'Fim do prazo de validade de laudos', descricao: 'Projeto que busca acabar com a revalidação periódica de laudos médicos de caráter definitivo para pessoas com deficiência.' }
  ],
  zona_extra: { valor: 'R$ 120 mi+', rotulo: 'Investidos por Nikolas Ferreira na Zona da Mata*' },
  contato: { whatsapp: '5532998560022', mensagem: 'Olá, Deputada Roberta! Gostaria de falar com o mandato.' },
  redes: {
    instagram: 'https://www.instagram.com/robertalopesdm/',
    facebook: 'https://www.facebook.com/RobertaLopesDM/',
    youtube: 'https://www.youtube.com/@RobertaLopesDM',
    threads: '',
    x: '',
    tiktok: 'https://www.tiktok.com/@robertalopesdm'
  }
};

export const CATEGORIAS = ['Saúde', 'Educação', 'Segurança', 'Família', 'Infraestrutura', 'Desenvolvimento', 'Zona da Mata', 'Defesa da vida'];

/* ---------- carga de dados ---------- */
let _cache;
export async function loadData() {
  if (_cache) return _cache;
  const data = { config: structuredClone(DEFAULTS), itens: {}, cms: false };
  try {
    const mod = await Promise.race([
      import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))
    ]);
    const sb = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const [cfg, itens] = await Promise.all([
      sb.from('mandato_config').select('chave,valor'),
      sb.from('mandato_itens').select('*').eq('publicado', true).order('ordem', { ascending: true }).order('created_at', { ascending: false })
    ]);
    if (!cfg.error && cfg.data) {
      data.cms = true;
      for (const r of cfg.data) data.config[r.chave] = r.valor && typeof r.valor === 'object' && !Array.isArray(r.valor)
        ? { ...(data.config[r.chave] || {}), ...r.valor } : r.valor;
    }
    if (!itens.error && itens.data) {
      for (const r of itens.data) (data.itens[r.tipo] ||= []).push({ id: r.id, titulo: r.titulo, ...r.dados });
    }
  } catch (e) { /* tabelas ainda não criadas ou sem rede: usa o conteúdo padrão */ }
  return (_cache = data);
}

/* ---------- utilitários ---------- */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmtNum = (v, dec = 0) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
export const fmtBRL = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const fmtData = d => { if (!d) return ''; const dt = new Date(/^\d{4}-\d{2}-\d{2}$/.test(d) ? d + 'T12:00:00' : d); return isNaN(dt) ? esc(d) : dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }); };
export const safeUrl = u => (/^https?:\/\//i.test(u || '') ? u : '');
export const ytId = u => (String(u || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/) || [])[1];
export const emptyBox = (t, s) => `<div class="empty"><b>${esc(t)}</b>${esc(s)}</div>`;

export function waLink(cfg) {
  const c = cfg.contato || {};
  return `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(c.mensagem || '')}`;
}

/* ---------- animações ---------- */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initReveal() {
  const els = $$('[data-r]:not(.in)');
  if (reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  els.forEach(e => io.observe(e));
}

export function countUp(el, n) {
  const { valor, dec = 0, pre = '', suf = '' } = n;
  const fmt = v => pre + fmtNum(v, dec) + suf;
  if (reduce) { el.textContent = fmt(valor); return; }
  el.textContent = fmt(0);
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    const t0 = performance.now(), dur = 1800;
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(valor * k);
      if (p < 1) requestAnimationFrame(tick); else el.textContent = fmt(valor);
    };
    requestAnimationFrame(tick);
  }, { threshold: .5 });
  io.observe(el);
}

export function initHeader() {
  const h = $('#hdr'), b = $('#burger');
  const on = () => h.classList.toggle('solid', scrollY > 40);
  on(); addEventListener('scroll', on, { passive: true });
  b?.addEventListener('click', () => {
    const o = document.body.classList.toggle('menu-open');
    b.setAttribute('aria-expanded', o); b.setAttribute('aria-label', o ? 'Fechar menu' : 'Abrir menu');
  });
  $$('#nav a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-open'); b?.setAttribute('aria-expanded', false); }));
}

export function setWhatsApp(cfg) {
  const href = waLink(cfg);
  $$('[data-wa]').forEach(a => { a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; });
}

export const ICONS = {
  instagram: 'M12 2.2c3.2 0 3.6 0 4.85.07 3.25.15 4.77 1.7 4.92 4.92.06 1.25.07 1.6.07 4.81s0 3.56-.07 4.81c-.15 3.2-1.66 4.77-4.92 4.92-1.25.06-1.6.07-4.85.07s-3.6 0-4.85-.07c-3.26-.15-4.77-1.72-4.92-4.92C2.17 15.56 2.16 15.2 2.16 12s0-3.56.07-4.81C2.38 3.92 3.9 2.37 7.15 2.22 8.4 2.16 8.77 2.2 12 2.2Zm0 4.6a5.2 5.2 0 1 0 0 10.4 5.2 5.2 0 0 0 0-10.4Zm0 8.57a3.37 3.37 0 1 1 0-6.74 3.37 3.37 0 0 1 0 6.74Zm5.4-9.97a1.22 1.22 0 1 0 0 2.44 1.22 1.22 0 0 0 0-2.44Z',
  facebook: 'M13.5 22v-8.4h2.8l.4-3.3h-3.2V8.1c0-.95.27-1.6 1.63-1.6h1.74V3.5c-.3-.04-1.3-.13-2.5-.13-2.5 0-4.2 1.53-4.2 4.34v2.6H7.3v3.3h2.9V22h3.3Z',
  youtube: 'M23 12s0-3.6-.46-5.3a3 3 0 0 0-2.1-2.1C18.7 4.1 12 4.1 12 4.1s-6.7 0-8.44.5a3 3 0 0 0-2.1 2.1C1 8.4 1 12 1 12s0 3.6.46 5.3a3 3 0 0 0 2.1 2.1c1.74.5 8.44.5 8.44.5s6.7 0 8.44-.5a3 3 0 0 0 2.1-2.1C23 15.6 23 12 23 12ZM9.75 15.5v-7l6 3.5-6 3.5Z',
  threads: 'M12.2 2c-5.3 0-8.4 3.6-8.4 10s3.1 10 8.4 10c4.3 0 7-2.3 7-5.6 0-2.4-1.6-4-4.3-4.3-.2-1.6-1.2-2.5-2.9-2.5-1.3 0-2.3.6-2.8 1.6l1.4.9c.3-.6.8-.9 1.4-.9.9 0 1.4.5 1.5 1.4-.5-.1-1-.1-1.5-.1-2.3 0-3.7 1.2-3.7 3 0 1.7 1.4 2.9 3.5 2.9 2.2 0 3.6-1.4 3.8-3.6 1 .3 1.5.9 1.5 1.8 0 1.5-1.4 3.7-5 3.7-3.9 0-6.5-2.4-6.5-8.4S8.4 3.6 12.2 3.6c2.4 0 4 .8 4.9 2.5l1.5-.8C17.5 3 15.3 2 12.2 2Z',
  x: 'M17.7 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.7 3Zm-1.1 16.2h1.7L7.5 4.7H5.7l10.9 14.5Z',
  whatsapp: 'M12 2a10 10 0 0 0-8.6 15l-1.4 5 5.1-1.3A10 10 0 1 0 12 2Zm5.4 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.4-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.1 1.4Z',
  tiktok: 'M16.6 2h-3.2v13.9a3 3 0 1 1-2.1-2.86V9.8a6.1 6.1 0 1 0 5.3 6.05V8.3a7.6 7.6 0 0 0 4.4 1.4V6.5a4.4 4.4 0 0 1-4.4-4.4Z'
};
export function renderRedes(cfg, el) {
  const r = cfg.redes || {};
  const wa = waLink(cfg);
  const list = [['instagram', 'Instagram', r.instagram], ['facebook', 'Facebook', r.facebook], ['youtube', 'YouTube', r.youtube], ['threads', 'Threads', r.threads], ['x', 'X', r.x], ['whatsapp', 'WhatsApp', wa]];
  el.innerHTML = list.map(([k, n, u]) => {
    const ok = safeUrl(u);
    return `<a class="soc ${ok ? '' : 'off'}" ${ok ? `href="${esc(ok)}" target="_blank" rel="noopener noreferrer"` : 'aria-disabled="true" tabindex="-1"'}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[k]}"/></svg><b>${n}</b><small>${ok ? 'Seguir' : 'Em breve'}</small></a>`;
  }).join('');
}
