import { loadData, $, esc, fmtNum, fmtBRL, emptyBox, countUp, initReveal, initHeader, setWhatsApp, renderRedes } from './core.js';
initHeader();
const { config: cfg, itens: it } = await loadData();
setWhatsApp(cfg);

const emendas = it.emendas || [];
const totalReg = emendas.reduce((s, e) => s + (Number(e.valor) || 0), 0);
const munReg = new Set(emendas.map(e => e.codigo_ibge || e.municipio).filter(Boolean)).size;
const n = cfg.numeros;
const kp = [
  { ...n[2], id: 'a' }, { ...n[3], id: 'b' },
  { valor: emendas.length, rotulo: 'Emendas detalhadas abaixo', id: 'c' },
  { valor: (it.projetos || []).length, rotulo: 'Projetos e ações cadastrados', id: 'd' }
];
$('#kpis').innerHTML = kp.map(k => `<div class="kpi"><strong data-k="${k.id}"></strong><span>${esc(k.rotulo)}</span></div>`).join('');
kp.forEach(k => countUp($(`[data-k="${k.id}"]`), { valor: Number(k.valor), dec: k.decimais || 0, pre: k.prefixo || '', suf: k.sufixo || '' }));

// barras por município (somente emendas cadastradas)
const by = {};
emendas.forEach(e => { const k = e.municipio || 'Município a informar'; by[k] = (by[k] || 0) + (Number(e.valor) || 0); });
const rank = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 12), max = rank[0]?.[1] || 1;
$('#bars').innerHTML = rank.length
  ? rank.map(([m, v]) => `<div class="bar"><span>${esc(m)}</span><div class="bar-t"><i data-w="${(v / max * 100).toFixed(1)}"></i></div><b>${fmtBRL(v)}</b></div>`).join('')
  : emptyBox('Detalhamento em breve', 'As emendas, com município, valor e objeto, serão cadastradas pela equipe do mandato.');
requestAnimationFrame(() => setTimeout(() => document.querySelectorAll('.bar-t i').forEach(i => (i.style.width = i.dataset.w + '%')), 200));

$('#tblEmendas').innerHTML = emendas.length
  ? `<div class="tbl-wrap"><table><thead><tr><th>Município</th><th>Objeto</th><th>Ano</th><th>Status</th><th class="num-r">Valor</th></tr></thead><tbody>${
    emendas.map(e => `<tr><td>${esc(e.municipio || '—')}</td><td>${esc(e.objeto || '—')}</td><td>${esc(e.ano || '—')}</td><td>${esc(e.status || '—')}</td><td class="num-r">${e.valor ? fmtBRL(e.valor) : '—'}</td></tr>`).join('')
  }</tbody></table></div>` : '';
$('#srcEmendas').textContent = emendas.length ? `Soma das emendas detalhadas: ${fmtBRL(totalReg)} em ${fmtNum(munReg)} município(s). Os totais do topo seguem os números oficiais do mandato.` : '';

const proj = it.projetos || [];
$('#cardsProj').innerHTML = proj.length
  ? proj.map(p => `<article class="card"><div class="card-top"><span class="tag">${esc(p.categoria || 'Mandato')}</span><span class="status">${esc(p.status || 'Em andamento')}</span></div><h3>${esc(p.titulo)}</h3><dl>${[['Problema', p.problema], ['Proposta', p.proposta], ['Ação', p.acao], ['Resultado', p.resultado]].map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v) || '—'}</dd></div>`).join('')}</dl></article>`).join('')
  : emptyBox('Em breve', 'Projetos e ações serão publicados aqui pela equipe.');
const res = it.resultados || [];
$('#cardsRes').innerHTML = res.length
  ? res.map(r => `<article class="card"><h3>${esc(r.titulo)}</h3>${r.valor ? `<strong style="font-family:var(--display);font-size:2.4rem;color:var(--g700)">${esc(r.valor)}</strong>` : ''}<p>${esc(r.descricao)}</p></article>`).join('')
  : emptyBox('Em breve', 'Resultados serão publicados aqui pela equipe.');

renderRedes(cfg, $('#redes'));
initReveal();
const { initMapa } = await import('./mapa.js');
initMapa($('#mapaBox'), $('#mapaSide'), it);
