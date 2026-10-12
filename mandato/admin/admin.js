// Painel administrativo (CMS) do site de mandato. Usa o mesmo login do painel atual.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../js/config.js';
import { DEFAULTS, CATEGORIAS, esc, $, $$ } from '../js/core.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const STATUS = ['Em andamento', 'Em tramitação', 'Aprovado', 'Concluído', 'Arquivado'];
const T = (name, label, extra = {}) => ({ name, label, ...extra });

/* ---------- esquema dos conteúdos ---------- */
const TIPOS = {
  projetos: { label: 'Projetos e ações', titulo: 'Nome do projeto/ação', campos: [
    T('categoria', 'Categoria', { type: 'select', opts: CATEGORIAS }), T('status', 'Status', { type: 'select', opts: STATUS }),
    T('problema', 'Problema', { type: 'textarea', full: 1 }), T('proposta', 'Proposta', { type: 'textarea', full: 1 }),
    T('acao', 'Ação', { type: 'textarea', full: 1 }), T('resultado', 'Resultado', { type: 'textarea', full: 1 }), T('municipio', 'Município (opcional)', { type: 'municipio' })] },
  proposicoes: { label: 'Proposições', titulo: 'Título / ementa curta', campos: [
    T('tipo', 'Tipo', { type: 'select', opts: ['Projeto de lei', 'Requerimento', 'Indicação', 'Moção', 'Emenda', 'Comissão', 'Votação', 'Outro'] }), T('numero', 'Número'),
    T('data', 'Data', { type: 'date' }), T('situacao', 'Situação'), T('link', 'Link (ALMG)', { type: 'url', full: 1 }), T('ementa', 'Ementa', { type: 'textarea', full: 1 })] },
  discursos: { label: 'Discursos', titulo: 'Título', campos: [T('data', 'Data', { type: 'date' }), T('link', 'Link (YouTube ou ALMG)', { type: 'url' }), T('resumo', 'Resumo', { type: 'textarea', full: 1 })] },
  eventos: { label: 'Audiências e eventos', titulo: 'Título', campos: [T('data', 'Data', { type: 'date' }), T('local', 'Local'), T('link', 'Link', { type: 'url' }), T('descricao', 'Descrição', { type: 'textarea', full: 1 })] },
  noticias: { label: 'Notícias', titulo: 'Título', campos: [
    T('categoria', 'Categoria', { type: 'select', opts: ['Mandato', 'Assembleia', 'Minas', 'Zona da Mata', 'Projetos', 'Prestação de contas', 'Entrevistas'] }), T('data', 'Data', { type: 'date' }),
    T('imagem', 'Imagem', { type: 'image' }), T('link', 'Link da matéria', { type: 'url' }), T('resumo', 'Resumo', { type: 'textarea', full: 1 })] },
  videos: { label: 'Vídeos', titulo: 'Título', campos: [
    T('categoria', 'Categoria', { type: 'select', opts: ['Bastidores', 'Discursos', 'Prestação de contas', 'Entrevistas', 'Visitas', 'Ações', 'Reuniões'] }), T('youtube', 'Link do YouTube', { type: 'url', full: 1 })] },
  municipios: { label: 'Municípios (mapa)', titulo: 'Observação interna (opcional)', campos: [
    T('municipio', 'Município', { type: 'municipio', full: 1 }), T('recursos', 'Recursos', { type: 'textarea' }), T('projetos', 'Projetos', { type: 'textarea' }),
    T('acoes', 'Ações', { type: 'textarea' }), T('resultados', 'Resultados', { type: 'textarea' }), T('fotos', 'Fotografias (uma URL por linha)', { type: 'imagens', full: 1 })] },
  emendas: { label: 'Emendas', titulo: 'Identificação da emenda', campos: [
    T('municipio', 'Município', { type: 'municipio' }), T('valor', 'Valor (R$)', { type: 'number' }), T('ano', 'Ano'), T('status', 'Status'), T('objeto', 'Objeto', { type: 'textarea', full: 1 })] },
  resultados: { label: 'Resultados', titulo: 'Título do resultado', campos: [T('valor', 'Número/valor em destaque'), T('descricao', 'Descrição', { type: 'textarea', full: 1 })] },
  golacos: { label: 'Golaços do mandato', titulo: 'Nome do golaço', campos: [T('descricao', 'Descrição', { type: 'textarea', full: 1 })] },
  fotos: { label: 'Fotos', titulo: 'Legenda', campos: [T('imagem', 'Foto', { type: 'image', full: 1 }), T('municipio', 'Município (opcional)', { type: 'municipio' })] }
};
const CONFIGS = {
  numeros: { label: 'Números de impacto', tipo: 'lista', campos: [T('rotulo', 'Rótulo'), T('valor', 'Valor', { type: 'number' }), T('prefixo', 'Prefixo'), T('sufixo', 'Sufixo'), T('decimais', 'Casas decimais', { type: 'number' })], hint: 'Os 4 números do topo do site e da prestação de contas (1º: votos 2026 · 2º: votos 2024 · 3º: emendas · 4º: municípios).' },
  assembleia: { label: 'Contadores da Assembleia', tipo: 'lista', campos: [T('rotulo', 'Rótulo'), T('valor', 'Valor', { type: 'number' })], hint: 'Deixe o valor vazio para aparecer "—" (a informar).' },
  zona_extra: { label: 'Zona da Mata — destaque', tipo: 'obj', campos: [T('valor', 'Valor em destaque'), T('rotulo', 'Rótulo')] },
  contato: { label: 'Contato (WhatsApp)', tipo: 'obj', campos: [T('whatsapp', 'Número com DDI+DDD (só dígitos)'), T('mensagem', 'Mensagem inicial', { type: 'textarea' })] },
  redes: { label: 'Redes sociais', tipo: 'obj', campos: ['instagram', 'facebook', 'youtube', 'threads', 'x', 'tiktok'].map(k => T(k, k[0].toUpperCase() + k.slice(1) + ' (URL completa)', { type: 'url' })) }
};

/* ---------- estado ---------- */
let MUN = null; // {codigo:{n}}
const munList = async () => (MUN ||= Object.entries((await (await fetch('../data/mapa-mg.json')).json()).m).map(([id, m]) => ({ id, n: m.n })));
const msg = (t, ok = true) => { const el = $('#msgbar'); if (!el) return; el.className = 'msg ' + (ok ? 'ok' : 'err'); el.textContent = t; setTimeout(() => (el.className = 'msg'), 4000); };

/* ---------- login ---------- */
async function boot() {
  const { data } = await sb.auth.getSession();
  if (!data.session) { $('#login').hidden = false; $('#app').hidden = true; return; }
  const { data: perfil } = await sb.from('profiles').select('role').eq('id', data.session.user.id).maybeSingle();
  if (!perfil) { $('#login').hidden = false; $('#loginMsg').className = 'msg err'; $('#loginMsg').textContent = 'Seu usuário não tem permissão neste painel.'; await sb.auth.signOut(); return; }
  $('#login').hidden = true; $('#app').hidden = false;
  menu(); go(location.hash.slice(1) || 'numeros');
}
$('#formLogin').addEventListener('submit', async e => {
  e.preventDefault();
  const { error } = await sb.auth.signInWithPassword({ email: $('#email').value.trim(), password: $('#senha').value });
  if (error) { $('#loginMsg').className = 'msg err'; $('#loginMsg').textContent = 'E-mail ou senha incorretos.'; return; }
  boot();
});
$('#sair').addEventListener('click', async () => { await sb.auth.signOut(); location.reload(); });

function menu() {
  $('#menu').innerHTML = `<div class="grp">Números e textos</div>${Object.entries(CONFIGS).map(([k, c]) => `<button data-k="${k}">${esc(c.label)}</button>`).join('')}
    <div class="grp">Conteúdos</div>${Object.entries(TIPOS).map(([k, c]) => `<button data-k="${k}">${esc(c.label)}</button>`).join('')}`;
  $('#menu').onclick = e => { const b = e.target.closest('button'); if (b) go(b.dataset.k); };
}
function go(k) {
  if (!CONFIGS[k] && !TIPOS[k]) k = 'numeros';
  location.hash = k; $$('#menu button').forEach(b => b.classList.toggle('on', b.dataset.k === k));
  CONFIGS[k] ? viewConfig(k) : viewTipo(k);
}

/* ---------- campos ---------- */
function fieldHtml(c, v = '', id) {
  const val = v ?? '';
  const full = c.full ? ' full' : '';
  let inp;
  switch (c.type) {
    case 'textarea': inp = `<textarea id="${id}">${esc(val)}</textarea>`; break;
    case 'select': inp = `<select id="${id}"><option value="">—</option>${c.opts.map(o => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`; break;
    case 'municipio': inp = `<input id="${id}" list="dl-mun" value="${esc(val)}" autocomplete="off" placeholder="Digite o nome do município"><div class="hint">Escolha da lista para vincular ao mapa.</div>`; break;
    case 'image': inp = `<input id="${id}" value="${esc(val)}" placeholder="URL da imagem"><input type="file" accept="image/*" data-up="${id}" style="margin-top:6px">${val ? `<img class="thumb" src="${esc(val)}" alt="">` : ''}`; break;
    case 'imagens': inp = `<textarea id="${id}">${esc(val)}</textarea><input type="file" accept="image/*" data-up="${id}" data-append="1" style="margin-top:6px"><div class="hint">Envie um arquivo para adicionar a URL automaticamente.</div>`; break;
    default: inp = `<input id="${id}" type="${c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : c.type === 'url' ? 'url' : 'text'}" ${c.type === 'number' ? 'step="any"' : ''} value="${esc(val)}">`;
  }
  return `<div class="${full.trim()}"><label for="${id}">${esc(c.label)}</label>${inp}</div>`;
}
async function upload(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from('mandato').upload(path, file, { cacheControl: '31536000', contentType: file.type });
  if (error) throw error;
  return sb.storage.from('mandato').getPublicUrl(path).data.publicUrl;
}
function wireUploads(root) {
  $$('input[type=file][data-up]', root).forEach(f => f.addEventListener('change', async () => {
    if (!f.files[0]) return;
    try {
      msg('Enviando imagem…'); const url = await upload(f.files[0]); const t = $('#' + f.dataset.up);
      t.value = f.dataset.append ? (t.value ? t.value.trim() + '\n' : '') + url : url; msg('Imagem enviada.');
    } catch (e) { msg('Erro no envio: ' + e.message, false); }
  }));
}
const wrap = (title, body) => { $('#view').innerHTML = `<h1>${esc(title)}</h1><div class="msg" id="msgbar"></div>${body}<datalist id="dl-mun"></datalist>`; munList().then(l => ($('#dl-mun').innerHTML = l.map(m => `<option value="${esc(m.n)}" label="${m.id}">`).join(''))); };
const resolveMun = async name => { const l = await munList(); const m = l.find(x => x.n.toLowerCase() === String(name).trim().toLowerCase()); return m ? { municipio: m.n, codigo_ibge: m.id } : { municipio: name, codigo_ibge: '' }; };

/* ---------- configurações ---------- */
async function viewConfig(k) {
  const c = CONFIGS[k];
  const { data } = await sb.from('mandato_config').select('valor').eq('chave', k).maybeSingle();
  const cur = data?.valor ?? DEFAULTS[k];
  let body;
  if (c.tipo === 'lista') {
    body = `<div class="card"><p class="hint">${esc(c.hint || '')}</p>${cur.map((r, i) => `<div class="cfgrow" style="grid-template-columns:repeat(${c.campos.length},1fr)">${c.campos.map(f => `<div><label>${esc(f.label)}</label><input data-i="${i}" data-f="${f.name}" ${f.type === 'number' ? 'type="number" step="any"' : ''} value="${esc(r[f.name] ?? '')}"></div>`).join('')}</div>`).join('')}
      <button class="btn" id="salvarCfg">Salvar</button></div>`;
  } else {
    body = `<div class="card"><div class="grid">${c.campos.map(f => fieldHtml({ ...f, full: 1 }, cur[f.name], 'f_' + f.name)).join('')}</div><button class="btn" id="salvarCfg" style="margin-top:18px">Salvar</button></div>`;
  }
  wrap(c.label, body);
  $('#salvarCfg').onclick = async () => {
    let valor;
    if (c.tipo === 'lista') {
      valor = cur.map((r, i) => { const o = { ...r }; c.campos.forEach(f => { const v = $(`[data-i="${i}"][data-f="${f.name}"]`).value; o[f.name] = f.type === 'number' ? (v === '' ? null : Number(v)) : v; }); return o; });
    } else { valor = {}; c.campos.forEach(f => (valor[f.name] = $('#f_' + f.name).value.trim())); }
    const { error } = await sb.from('mandato_config').upsert({ chave: k, valor, updated_at: new Date().toISOString() });
    msg(error ? 'Erro: ' + error.message : 'Salvo! O site já usa os novos valores.', !error);
  };
}

/* ---------- itens ---------- */
async function viewTipo(k, edit = null) {
  const t = TIPOS[k];
  const { data, error } = await sb.from('mandato_itens').select('*').eq('tipo', k).order('ordem').order('created_at', { ascending: false });
  const list = data || [];
  const d = edit?.dados || {};
  wrap(t.label, `<div class="card"><h3 style="margin:0 0 6px">${edit ? 'Editando' : 'Novo cadastro'}</h3><div class="grid">
    <div class="full"><label for="f_titulo">${esc(t.titulo)}</label><input id="f_titulo" value="${esc(edit?.titulo || '')}"></div>
    ${t.campos.map(c => fieldHtml(c, d[c.name], 'f_' + c.name)).join('')}
    <div><label for="f_ordem">Ordem (menor aparece primeiro)</label><input id="f_ordem" type="number" value="${edit?.ordem ?? 0}"></div>
    <div><label for="f_pub">Visibilidade</label><select id="f_pub"><option value="1" ${edit?.publicado === false ? '' : 'selected'}>Publicado</option><option value="0" ${edit?.publicado === false ? 'selected' : ''}>Rascunho</option></select></div>
    </div><div style="margin-top:18px;display:flex;gap:10px"><button class="btn" id="salvar">${edit ? 'Atualizar' : 'Cadastrar'}</button>${edit ? '<button class="btn sec" id="cancel">Cancelar</button>' : ''}</div></div>
    <div class="card"><h3 style="margin:0">Cadastrados (${list.length})</h3>${error ? `<div class="msg err" style="display:block">Não foi possível ler os dados. Execute o arquivo supabase/mandato.sql no Supabase. (${esc(error.message)})</div>` : ''}
    ${list.map(r => `<div class="row"><div><b>${esc(r.titulo || '(sem título)')}<span class="pill ${r.publicado ? '' : 'off'}">${r.publicado ? 'publicado' : 'rascunho'}</span></b><small>${esc(r.dados?.municipio || r.dados?.categoria || r.dados?.data || '')}</small></div>
      <div class="acts"><button class="btn sec sm" data-e="${r.id}">Editar</button><button class="btn warn sm" data-d="${r.id}">Excluir</button></div></div>`).join('') || '<p class="hint">Nada cadastrado ainda.</p>'}</div>`);
  wireUploads($('#view'));
  if (edit) $('#cancel').onclick = () => viewTipo(k);
  $('#salvar').onclick = async () => {
    const dados = {};
    for (const c of t.campos) {
      const v = $('#f_' + c.name).value.trim();
      if (c.type === 'municipio') Object.assign(dados, v ? await resolveMun(v) : {});
      else dados[c.name] = c.type === 'number' && v !== '' ? Number(v) : v;
    }
    const row = { tipo: k, titulo: $('#f_titulo').value.trim(), dados, ordem: Number($('#f_ordem').value) || 0, publicado: $('#f_pub').value === '1', updated_at: new Date().toISOString() };
    const q = edit ? sb.from('mandato_itens').update(row).eq('id', edit.id) : sb.from('mandato_itens').insert(row);
    const { error: e2 } = await q;
    if (e2) return msg('Erro: ' + e2.message, false);
    await viewTipo(k); msg('Salvo!');
  };
  $('#view').onclick = async e => {
    const ed = e.target.closest('[data-e]'), de = e.target.closest('[data-d]');
    if (ed) { viewTipo(k, list.find(x => x.id === ed.dataset.e)); scrollTo(0, 0); }
    if (de && confirm('Excluir definitivamente este item?')) { await sb.from('mandato_itens').delete().eq('id', de.dataset.d); viewTipo(k); }
  };
}

boot();
