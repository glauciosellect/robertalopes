const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

let CURRENT_USER = null;
let CURRENT_ROLE = null;
let EDITING_NOTICIA_ID = null;

// ---------- AUTENTICAÇÃO ----------
async function boot() {
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    window.location.href = 'login.html';
    return;
  }
  CURRENT_USER = data.session.user;

  const { data: perfil, error } = await sb.from('profiles').select('*').eq('id', CURRENT_USER.id).single();
  if (error || !perfil) {
    document.getElementById('roleBadge').textContent = 'perfil não encontrado';
    return;
  }
  CURRENT_ROLE = perfil.role;
  document.getElementById('roleBadge').textContent = CURRENT_ROLE === 'admin' ? 'Administrador' : 'Colaborador';
  if (CURRENT_ROLE === 'admin') {
    document.getElementById('navColaboradores').style.display = 'block';
  }

  carregarNoticias();
  carregarGaleria();
  carregarDownloads();
  carregarApoios();
  if (CURRENT_ROLE === 'admin') carregarColaboradores();
}
boot();

document.getElementById('btnLogout').addEventListener('click', async () => {
  await sb.auth.signOut();
  window.location.href = 'login.html';
});

// ---------- NAVEGAÇÃO ENTRE PAINÉIS ----------
document.querySelectorAll('.admin-nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-nav button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + btn.dataset.panel).classList.add('active');
  });
});

function fmtData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ---------- NOTÍCIAS ----------
async function carregarNoticias() {
  const { data, error } = await sb.from('noticias').select('*').order('created_at', { ascending: false });
  const lista = document.getElementById('lista-noticias');
  lista.innerHTML = '';
  if (error || !data || !data.length) {
    lista.innerHTML = '<div class="admin-empty">Nenhuma notícia publicada ainda.</div>';
    return;
  }
  data.forEach(n => {
    const el = document.createElement('div');
    el.className = 'admin-item';
    el.innerHTML = `
      <div class="info">
        <strong>${n.titulo}</strong>
        <span>${n.categoria} · ${fmtData(n.created_at)}</span>
        <p style="margin-top:6px;font-size:13px;color:#555;">${n.descricao}</p>
      </div>
      <div class="admin-item-actions">
        <button data-edit="${n.id}">Editar</button>
        <button class="danger" data-del="${n.id}">Excluir</button>
      </div>`;
    lista.appendChild(el);
  });

  lista.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Excluir esta notícia?')) return;
    await sb.from('noticias').delete().eq('id', b.dataset.del);
    carregarNoticias();
  }));
  lista.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => {
    const item = data.find(x => x.id === b.dataset.edit);
    document.getElementById('n-categoria').value = item.categoria;
    document.getElementById('n-titulo').value = item.titulo;
    document.getElementById('n-descricao').value = item.descricao;
    EDITING_NOTICIA_ID = item.id;
    document.getElementById('btnPostarNoticia').textContent = 'Salvar edição';
    document.getElementById('btnCancelarNoticia').style.display = 'inline-block';
  }));
}

document.getElementById('btnPostarNoticia').addEventListener('click', async () => {
  const categoria = document.getElementById('n-categoria').value.trim();
  const titulo = document.getElementById('n-titulo').value.trim();
  const descricao = document.getElementById('n-descricao').value.trim();
  if (!categoria || !titulo || !descricao) { alert('Preencha categoria, título e descrição.'); return; }

  if (EDITING_NOTICIA_ID) {
    await sb.from('noticias').update({ categoria, titulo, descricao }).eq('id', EDITING_NOTICIA_ID);
  } else {
    await sb.from('noticias').insert({ categoria, titulo, descricao, created_by: CURRENT_USER.id });
  }
  document.getElementById('n-categoria').value = '';
  document.getElementById('n-titulo').value = '';
  document.getElementById('n-descricao').value = '';
  EDITING_NOTICIA_ID = null;
  document.getElementById('btnPostarNoticia').textContent = 'Postar';
  document.getElementById('btnCancelarNoticia').style.display = 'none';
  carregarNoticias();
});

document.getElementById('btnCancelarNoticia').addEventListener('click', () => {
  document.getElementById('n-categoria').value = '';
  document.getElementById('n-titulo').value = '';
  document.getElementById('n-descricao').value = '';
  EDITING_NOTICIA_ID = null;
  document.getElementById('btnPostarNoticia').textContent = 'Postar';
  document.getElementById('btnCancelarNoticia').style.display = 'none';
});

// ---------- GALERIA ----------
async function carregarGaleria() {
  const { data, error } = await sb.from('galeria').select('*').order('created_at', { ascending: false });
  const lista = document.getElementById('lista-galeria');
  lista.innerHTML = '';
  if (error || !data || !data.length) {
    lista.innerHTML = '<div class="admin-empty">Nenhuma foto na galeria ainda.</div>';
    return;
  }
  data.forEach(g => {
    const el = document.createElement('div');
    el.className = 'admin-item';
    el.innerHTML = `
      <div class="info">
        <img src="${g.image_url}" alt="">
        <span>${g.legenda || ''}</span>
      </div>
      <div class="admin-item-actions">
        <button class="danger" data-del="${g.id}">Excluir</button>
      </div>`;
    lista.appendChild(el);
  });
  lista.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Excluir esta foto?')) return;
    await sb.from('galeria').delete().eq('id', b.dataset.del);
    carregarGaleria();
  }));
}

document.getElementById('btnPostarGaleria').addEventListener('click', async () => {
  const file = document.getElementById('g-arquivo').files[0];
  const legenda = document.getElementById('g-legenda').value.trim();
  if (!file) { alert('Escolha uma foto.'); return; }

  const nomeArquivo = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.\-]/g, '_');
  const { error: upErr } = await sb.storage.from('galeria').upload(nomeArquivo, file);
  if (upErr) { alert('Erro ao enviar a foto: ' + upErr.message); return; }

  const { data: pub } = sb.storage.from('galeria').getPublicUrl(nomeArquivo);
  await sb.from('galeria').insert({ image_url: pub.publicUrl, legenda, created_by: CURRENT_USER.id });

  document.getElementById('g-arquivo').value = '';
  document.getElementById('g-legenda').value = '';
  carregarGaleria();
});

// ---------- DOWNLOADS ----------
async function carregarDownloads() {
  const { data, error } = await sb.from('downloads').select('*').order('created_at', { ascending: false });
  const lista = document.getElementById('lista-downloads');
  lista.innerHTML = '';
  if (error || !data || !data.length) {
    lista.innerHTML = '<div class="admin-empty">Nenhum documento anexado ainda.</div>';
    return;
  }
  data.forEach(d => {
    const el = document.createElement('div');
    el.className = 'admin-item';
    el.innerHTML = `
      <div class="info">
        <strong>${d.titulo}</strong>
        <span>${d.descricao || ''}</span><br>
        <a href="${d.file_url}" target="_blank" style="font-size:12px;">Ver arquivo →</a>
      </div>
      <div class="admin-item-actions">
        <button class="danger" data-del="${d.id}">Excluir</button>
      </div>`;
    lista.appendChild(el);
  });
  lista.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Excluir este documento?')) return;
    await sb.from('downloads').delete().eq('id', b.dataset.del);
    carregarDownloads();
  }));
}

document.getElementById('btnPostarDownload').addEventListener('click', async () => {
  const file = document.getElementById('d-arquivo').files[0];
  const titulo = document.getElementById('d-titulo').value.trim();
  const descricao = document.getElementById('d-descricao').value.trim();
  if (!file || !titulo) { alert('Escolha um arquivo e digite um título.'); return; }

  const nomeArquivo = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.\-]/g, '_');
  const { error: upErr } = await sb.storage.from('downloads').upload(nomeArquivo, file);
  if (upErr) { alert('Erro ao enviar o arquivo: ' + upErr.message); return; }

  const { data: pub } = sb.storage.from('downloads').getPublicUrl(nomeArquivo);
  await sb.from('downloads').insert({ titulo, descricao, file_url: pub.publicUrl, created_by: CURRENT_USER.id });

  document.getElementById('d-arquivo').value = '';
  document.getElementById('d-titulo').value = '';
  document.getElementById('d-descricao').value = '';
  carregarDownloads();
});

// ---------- APOIOS ----------
document.getElementById('a-tipo').addEventListener('change', (e) => {
  const isFoto = e.target.value === 'foto';
  document.getElementById('a-foto-wrap').style.display = isFoto ? 'block' : 'none';
  document.getElementById('a-video-wrap').style.display = isFoto ? 'none' : 'block';
});

function youtubeEmbedUrl(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

async function carregarApoios() {
  const { data, error } = await sb.from('apoios').select('*').order('created_at', { ascending: false });
  const lista = document.getElementById('lista-apoios');
  lista.innerHTML = '';
  if (error || !data || !data.length) {
    lista.innerHTML = '<div class="admin-empty">Nenhum apoio publicado ainda.</div>';
    return;
  }
  data.forEach(a => {
    const el = document.createElement('div');
    el.className = 'admin-item';
    const midia = a.tipo === 'foto'
      ? `<img src="${a.midia_url}" alt="">`
      : `<span style="font-size:12px;">🎬 vídeo: <a href="${a.midia_url}" target="_blank">${a.midia_url}</a></span>`;
    el.innerHTML = `
      <div class="info">${midia}<span>${a.legenda || ''}</span></div>
      <div class="admin-item-actions"><button class="danger" data-del="${a.id}">Excluir</button></div>`;
    lista.appendChild(el);
  });
  lista.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Excluir este apoio?')) return;
    await sb.from('apoios').delete().eq('id', b.dataset.del);
    carregarApoios();
  }));
}

document.getElementById('btnPostarApoio').addEventListener('click', async () => {
  const tipo = document.getElementById('a-tipo').value;
  const legenda = document.getElementById('a-legenda').value.trim();

  if (tipo === 'foto') {
    const file = document.getElementById('a-arquivo').files[0];
    if (!file) { alert('Escolha uma foto.'); return; }
    const nomeArquivo = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.\-]/g, '_');
    const { error: upErr } = await sb.storage.from('apoios').upload(nomeArquivo, file);
    if (upErr) { alert('Erro ao enviar a foto: ' + upErr.message); return; }
    const { data: pub } = sb.storage.from('apoios').getPublicUrl(nomeArquivo);
    await sb.from('apoios').insert({ tipo, midia_url: pub.publicUrl, legenda, created_by: CURRENT_USER.id });
  } else {
    const link = document.getElementById('a-youtube').value.trim();
    if (!link || !youtubeEmbedUrl(link)) { alert('Cole um link válido do YouTube.'); return; }
    await sb.from('apoios').insert({ tipo, midia_url: link, legenda, created_by: CURRENT_USER.id });
  }

  document.getElementById('a-arquivo').value = '';
  document.getElementById('a-youtube').value = '';
  document.getElementById('a-legenda').value = '';
  carregarApoios();
});

// ---------- COLABORADORES (somente admin) ----------
async function carregarColaboradores() {
  const { data, error } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
  const lista = document.getElementById('lista-colaboradores');
  lista.innerHTML = '';
  if (error || !data || !data.length) {
    lista.innerHTML = '<div class="admin-empty">Nenhum colaborador cadastrado ainda.</div>';
    return;
  }
  data.forEach(p => {
    const el = document.createElement('div');
    el.className = 'admin-item';
    el.innerHTML = `
      <div class="info">
        <strong>${p.email}</strong>
        <span>${p.role === 'admin' ? 'Administrador' : 'Colaborador'} · desde ${fmtData(p.created_at)}</span>
      </div>
      <div class="admin-item-actions">
        ${p.id !== CURRENT_USER.id ? `<button class="danger" data-del="${p.id}">Excluir</button>` : '<span style="font-size:12px;color:#8a7360;">você</span>'}
      </div>`;
    lista.appendChild(el);
  });
  lista.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Excluir este colaborador? Ele perderá o acesso imediatamente.')) return;
    const { data: sess } = await sb.auth.getSession();
    const r = await fetch('/api/delete-collaborator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: b.dataset.del, callerAccessToken: sess.session.access_token })
    });
    const j = await r.json();
    if (!r.ok) { alert('Erro: ' + (j.error || 'não foi possível excluir')); return; }
    carregarColaboradores();
  }));
}

document.getElementById('btnConvidar').addEventListener('click', async () => {
  const email = document.getElementById('c-email').value.trim();
  if (!email) { alert('Digite um e-mail.'); return; }
  const { data: sess } = await sb.auth.getSession();
  const r = await fetch('/api/invite-collaborator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      callerAccessToken: sess.session.access_token,
      redirectTo: window.location.origin + '/admin/set-password.html'
    })
  });
  const j = await r.json();
  if (!r.ok) { alert('Erro ao convidar: ' + (j.error || 'tente novamente')); return; }
  document.getElementById('c-email').value = '';
  alert('Convite enviado para ' + email);
  carregarColaboradores();
});
