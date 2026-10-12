// Mapa interativo de Minas Gerais (malha municipal IBGE). Municípios com registros no CMS ficam clicáveis.
import { BASE, esc, fmtBRL, safeUrl, $ } from './core.js';

const ZONA_DA_MATA = 3112; // mesorregião IBGE
let _geo;
const loadGeo = () => (_geo ||= fetch(BASE + 'data/mapa-mg.json').then(r => r.json()));

export async function initMapa(box, side, itens) {
  const geo = await loadGeo();
  const municipios = itens.municipios || [], emendas = itens.emendas || [], projetos = itens.projetos || [], fotos = itens.fotos || [];
  const byCode = {};
  const get = c => (byCode[c] ||= { cod: c, reg: null, emendas: [], projetos: [], fotos: [] });
  municipios.forEach(m => m.codigo_ibge && (get(String(m.codigo_ibge)).reg = m));
  emendas.forEach(e => e.codigo_ibge && get(String(e.codigo_ibge)).emendas.push(e));
  projetos.forEach(p => p.codigo_ibge && get(String(p.codigo_ibge)).projetos.push(p));
  fotos.forEach(f => f.codigo_ibge && get(String(f.codigo_ibge)).fotos.push(f));

  const paths = Object.entries(geo.m).map(([id, m]) => {
    const on = byCode[id] ? ' on' : '', zm = m.r === ZONA_DA_MATA ? ' zm' : '';
    return `<path data-id="${id}" class="${(zm + on).trim()}" d="${m.d}" ${on ? `tabindex="0" role="button" aria-label="${esc(m.n)} — ver atuação"` : ''}><title>${esc(m.n)}</title></path>`;
  }).join('');
  box.innerHTML = `<svg viewBox="0 0 ${geo.w} ${geo.h}" role="group" aria-label="Mapa de Minas Gerais por município">${paths}</svg><div class="mapa-tip" id="mtip"></div>`;
  const svg = box.querySelector('svg'), tip = box.querySelector('#mtip');

  const active = Object.keys(byCode).length;
  const intro = () => {
    side.innerHTML = `<div class="eyebrow">Mapa do mandato</div><h3>Selecione um município</h3>` + (active
      ? `<p class="vazio">Os municípios em verde-escuro têm atuação registrada. Clique em um deles para ver recursos, projetos, ações, fotografias e resultados.</p>`
      : `<p class="vazio">Os municípios com atuação serão destacados e ficarão clicáveis aqui, conforme a equipe do mandato os cadastrar no painel administrativo. A região da Zona da Mata está destacada no mapa.</p>`);
  };
  const show = id => {
    const m = geo.m[id], d = byCode[id];
    $$all(svg, 'path.sel').forEach(p => p.classList.remove('sel'));
    svg.querySelector(`path[data-id="${id}"]`)?.classList.add('sel');
    if (!d) { side.innerHTML = `<div class="eyebrow">Minas Gerais</div><h3>${esc(m.n)}</h3><p class="vazio">Ainda não há atuação registrada para este município.</p>`; return; }
    const r = d.reg || {};
    const total = d.emendas.reduce((s, e) => s + (Number(e.valor) || 0), 0);
    const row = (t, v) => v ? `<div><dt>${t}</dt><dd>${v}</dd></div>` : '';
    const fl = [...(String(r.fotos || '').split(/\s+/).filter(safeUrl)), ...d.fotos.map(f => f.imagem).filter(safeUrl)].slice(0, 6);
    side.innerHTML = `<div class="eyebrow">Município</div><h3>${esc(m.n)}</h3><dl>
      ${row('Recursos', total ? fmtBRL(total) + (r.recursos ? '\n' + esc(r.recursos) : '') : esc(r.recursos))}
      ${d.emendas.length ? row('Emendas', d.emendas.map(e => `${e.valor ? fmtBRL(e.valor) + ' — ' : ''}${esc(e.objeto || 'Objeto a informar')}`).join('\n')) : ''}
      ${row('Projetos', d.projetos.length ? d.projetos.map(p => esc(p.titulo)).join('\n') : esc(r.projetos))}
      ${row('Ações', esc(r.acoes))}${row('Resultados', esc(r.resultados))}
    </dl>${fl.length ? `<div class="mapa-fotos">${fl.map(u => `<img src="${esc(u)}" loading="lazy" alt="Foto em ${esc(m.n)}">`).join('')}</div>` : ''}`;
  };
  intro();

  svg.addEventListener('click', e => { const p = e.target.closest('path'); if (p) show(p.dataset.id); });
  svg.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('path.on')) { e.preventDefault(); show(e.target.dataset.id); } });
  svg.addEventListener('pointermove', e => {
    const p = e.target.closest('path'); if (!p) { tip.style.opacity = 0; return; }
    const b = box.getBoundingClientRect();
    tip.textContent = geo.m[p.dataset.id].n; tip.style.left = e.clientX - b.left + 'px'; tip.style.top = e.clientY - b.top + 'px'; tip.style.opacity = 1;
  });
  svg.addEventListener('pointerleave', () => (tip.style.opacity = 0));
}
const $$all = (r, s) => [...r.querySelectorAll(s)];
