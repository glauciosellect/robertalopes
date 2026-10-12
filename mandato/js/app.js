import { loadData, $, $$, esc, fmtNum, fmtData, safeUrl, ytId, emptyBox, countUp, initReveal, initHeader, setWhatsApp, renderRedes, CATEGORIAS } from './core.js';

initHeader();
initReveal();

/* ---------- parallax leve ---------- */
(() => {
  const p = $('#heroPhoto'); if (!p || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let t = false;
  addEventListener('scroll', () => { if (t) return; t = true; requestAnimationFrame(() => { if (scrollY < innerHeight) p.style.transform = `translateY(${scrollY * .12}px)`; t = false; }); }, { passive: true });
})();

const data = await loadData();
const cfg = data.config, it = data.itens;
setWhatsApp(cfg);

/* ---------- números ---------- */
$('#numeros').innerHTML = cfg.numeros.map(n => `<div class="num" data-r><strong aria-label="${esc((n.prefixo || '') + fmtNum(n.valor, n.decimais || 0) + (n.sufixo || ''))}"></strong><span>${esc(n.rotulo)}</span></div>`).join('');
$$('#numeros .num').forEach((el, i) => { const n = cfg.numeros[i]; countUp(el.querySelector('strong'), { valor: Number(n.valor), dec: n.decimais || 0, pre: n.prefixo || '', suf: n.sufixo || '' }); });
// votos citados no texto "Sobre" seguem os números cadastrados
$$('[data-n="votos2026"]').forEach(e => (e.textContent = fmtNum(cfg.numeros[0].valor)));
$$('[data-n="votos2024"]').forEach(e => (e.textContent = fmtNum(cfg.numeros[1].valor)));

/* ---------- mandato (cards por categoria) ---------- */
const projetos = it.projetos || [];
let cat = 'Todos';
const catsEl = $('#cats'), cardsEl = $('#cardsMandato');
catsEl.innerHTML = ['Todos', ...CATEGORIAS].map(c => `<button class="cat${c === cat ? ' on' : ''}" role="tab" aria-selected="${c === cat}">${esc(c)}</button>`).join('');
const renderCards = () => {
  const list = projetos.filter(p => cat === 'Todos' || p.categoria === cat);
  if (!list.length) {
    cardsEl.innerHTML = `<article class="card pending"><div class="card-top"><span class="tag">${esc(cat === 'Todos' ? 'Mandato' : cat)}</span><span class="status">A preencher</span></div><h3>Projeto a cadastrar</h3>
      <dl><div><dt>Problema</dt><dd>—</dd></div><div><dt>Proposta</dt><dd>—</dd></div><div><dt>Ação</dt><dd>—</dd></div><div><dt>Resultado</dt><dd>—</dd></div></dl></article>
      ${emptyBox('Em breve', 'As ações do mandato serão publicadas aqui pela equipe, com problema, proposta, ação, resultado e status.')}`;
    return;
  }
  cardsEl.innerHTML = list.map(p => `<article class="card"><div class="card-top"><span class="tag">${esc(p.categoria || 'Mandato')}</span><span class="status">${esc(p.status || 'Em andamento')}</span></div><h3>${esc(p.titulo)}</h3>
    <dl>${[['Problema', p.problema], ['Proposta', p.proposta], ['Ação', p.acao], ['Resultado', p.resultado]].map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v) || '—'}</dd></div>`).join('')}</dl></article>`).join('');
};
catsEl.addEventListener('click', e => {
  const b = e.target.closest('.cat'); if (!b) return;
  cat = b.textContent; $$('.cat', catsEl).forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); }); renderCards();
});
renderCards();

/* ---------- golaços ---------- */
const gol = [...cfg.golacos, ...(it.golacos || [])];
$('#golacos-grid').innerHTML = gol.map((g, i) => `<article class="gol" data-r data-n="${i + 1}" style="--d:${i * .08}s"><div><span class="tag">Golaço ${i + 1}</span><h3>${esc(g.titulo)}</h3></div><p>${esc(g.descricao)}</p></article>`).join('')
  + `<article class="gol pending" data-r data-n="+"><div><span class="tag">Em breve</span><h3>Novos golaços</h3></div><p>Os próximos golaços do mandato serão cadastrados pela equipe.</p></article>`;
initReveal();

/* ---------- assembleia ---------- */
$('#assGrid').innerHTML = cfg.assembleia.map(a => `<div class="ass-it" data-r><strong>${a.valor == null || a.valor === '' ? '—' : esc(fmtNum(a.valor))}</strong><span>${esc(a.rotulo)}</span>${a.valor == null || a.valor === '' ? '<small>A informar pela equipe</small>' : ''}</div>`).join('');
const li = (arr, f, vazio) => arr.length ? arr.slice(0, 5).map(f).join('') : `<li class="empty-s">${vazio}</li>`;
const link = (u, t, s) => { const h = safeUrl(u); return `<li>${h ? `<a href="${esc(h)}" target="_blank" rel="noopener noreferrer">${esc(t)}</a>` : esc(t)}<small>${s}</small></li>`; };
$('#listProp').innerHTML = li(it.proposicoes || [], p => link(p.link, `${p.tipo || 'Proposição'} ${p.numero || ''} — ${p.titulo}`.trim(), [fmtData(p.data), p.situacao].filter(Boolean).map(esc).join(' · ')), 'Nenhuma proposição cadastrada ainda.');
$('#listDisc').innerHTML = li(it.discursos || [], d => link(d.link || d.youtube, d.titulo, esc(fmtData(d.data))), 'Nenhum discurso cadastrado ainda.');
$('#listEv').innerHTML = li(it.eventos || [], e => link(e.link, e.titulo, [fmtData(e.data), e.local].filter(Boolean).map(esc).join(' · ')), 'Nenhuma audiência ou evento cadastrado ainda.');
$('#listCom').innerHTML = li((it.proposicoes || []).filter(p => /comiss|vota/i.test(p.tipo || '')), p => link(p.link, p.titulo, esc(p.situacao || '')), 'Comissões e votações serão informadas pela equipe.');

/* ---------- zona da mata ---------- */
const z = cfg.zona_extra, n2 = cfg.numeros[2], n3 = cfg.numeros[3];
$('#zonaNums').innerHTML = `<div><strong>${esc((n2.prefixo || '') + fmtNum(n2.valor, n2.decimais || 0) + (n2.sufixo || ''))}</strong><span>${esc(n2.rotulo)}</span></div>
  <div><strong>${esc(fmtNum(n3.valor))}</strong><span>${esc(n3.rotulo)}</span></div>
  <div style="grid-column:1/-1"><strong>${esc(z.valor)}</strong><span>${esc(z.rotulo)}</span></div>`;

/* ---------- vídeos ---------- */
const vids = it.videos || [];
$('#vidGrid').innerHTML = vids.length ? vids.slice(0, 6).map(v => {
  const id = ytId(v.youtube); if (!id) return '';
  return `<article class="vid" data-r><div class="vid-frame" data-yt="${id}"><img loading="lazy" src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt=""><button class="vid-play" aria-label="Assistir: ${esc(v.titulo)}"><span><svg viewBox="0 0 24 24"><path d="M6 3v18l15-9z"/></svg></span></button></div><small>${esc(v.categoria || 'Vídeo')}</small><h4>${esc(v.titulo)}</h4></article>`;
}).join('') : emptyBox('Em breve', 'Os vídeos do mandato aparecerão aqui. Enquanto isso, acompanhe tudo no canal oficial do YouTube.');
$('#vidGrid').addEventListener('click', e => {
  const f = e.target.closest('.vid-play')?.parentElement; if (!f) return;
  f.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${f.dataset.yt}?autoplay=1&rel=0" title="Vídeo" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
});
if (safeUrl(cfg.redes.youtube)) $('#ytLink').href = cfg.redes.youtube;

/* ---------- notícias ---------- */
const news = it.noticias || [];
$('#newsGrid').innerHTML = news.length ? news.slice(0, 6).map(n => {
  const h = safeUrl(n.link), img = safeUrl(n.imagem);
  return `<${h ? `a href="${esc(h)}" target="_blank" rel="noopener noreferrer"` : 'div'} class="news" data-r>${img ? `<img loading="lazy" src="${esc(img)}" alt="">` : ''}<div class="news-b"><span class="tag" style="align-self:flex-start">${esc(n.categoria || 'Mandato')}</span><h3>${esc(n.titulo)}</h3><p>${esc(n.resumo)}</p><time>${esc(fmtData(n.data))}</time></div></${h ? 'a' : 'div'}>`;
}).join('') : emptyBox('Em breve', 'As notícias do mandato serão publicadas aqui.');

/* ---------- redes ---------- */
renderRedes(cfg, $('#redes'));
initReveal();

/* ---------- mapa (carrega só quando se aproxima) ---------- */
const box = $('#mapaBox');
new IntersectionObserver(async (es, io) => {
  if (!es[0].isIntersecting) return; io.disconnect();
  const { initMapa } = await import('./mapa.js');
  initMapa(box, $('#mapaSide'), it);
}, { rootMargin: '600px' }).observe(box);
