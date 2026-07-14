// Busca conteúdo cadastrado no painel administrativo (Supabase) e substitui
// o conteúdo estático das seções Notícias, Galeria, Downloads e Apoios.
// Se não houver nenhum registro publicado, mantém o conteúdo padrão do HTML.

document.addEventListener('DOMContentLoaded', async function () {
  if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return;
  const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  function fmtData(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function youtubeEmbedUrl(url) {
    const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : null;
  }

  // ---------- NOTÍCIAS ----------
  try {
    const grid = document.querySelector('.noticias-grid');
    if (grid) {
      const { data } = await sb.from('noticias').select('*').eq('publicado', true)
        .order('created_at', { ascending: false }).limit(6);
      if (data && data.length) {
        grid.innerHTML = data.map(n => `
          <div class="noticia-card">
            <span class="noticia-tag">${n.categoria}</span>
            <h4>${n.titulo}</h4>
            <p>${n.descricao}</p>
          </div>`).join('');
      }
    }
  } catch (e) { /* mantém conteúdo estático em caso de falha */ }

  // ---------- GALERIA ----------
  try {
    const grid = document.querySelector('.galeria-grid');
    if (grid) {
      const { data } = await sb.from('galeria').select('*').eq('publicado', true)
        .order('created_at', { ascending: false }).limit(12);
      if (data && data.length) {
        grid.innerHTML = data.map(g => `
          <div class="galeria-item"><img src="${g.image_url}" alt="${(g.legenda || '').replace(/"/g, '')}"></div>`).join('');
      }
    }
  } catch (e) { /* mantém conteúdo estático em caso de falha */ }

  // ---------- DOWNLOADS ----------
  try {
    const grid = document.querySelector('.download-grid');
    if (grid) {
      const { data } = await sb.from('downloads').select('*').eq('publicado', true)
        .order('created_at', { ascending: false });
      if (data && data.length) {
        grid.innerHTML = data.map(d => `
          <a class="download-card" href="${d.file_url}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;">
            <div class="icon">📄</div>
            <div><h4>${d.titulo}</h4><p>${d.descricao || ''}</p></div>
          </a>`).join('');
      }
    }
  } catch (e) { /* mantém conteúdo estático em caso de falha */ }

  // ---------- APOIOS ----------
  try {
    const grid = document.querySelector('.apoios-grid');
    if (grid) {
      const { data } = await sb.from('apoios').select('*').eq('publicado', true)
        .order('created_at', { ascending: false });
      if (data && data.length) {
        grid.innerHTML = data.map(a => {
          if (a.tipo === 'foto') {
            return `<div class="apoio-card"><img src="${a.midia_url}" alt="">${a.legenda ? `<p>${a.legenda}</p>` : ''}</div>`;
          }
          const embed = youtubeEmbedUrl(a.midia_url) || a.midia_url;
          return `<div class="apoio-card">
            <div class="video-embed"><iframe src="${embed}" title="Vídeo de apoio" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>
            ${a.legenda ? `<p>${a.legenda}</p>` : ''}
          </div>`;
        }).join('');
      }
    }
  } catch (e) { /* mantém conteúdo estático em caso de falha */ }
});
