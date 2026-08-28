// Roberta Lopes — Landing Page scripts

document.addEventListener('DOMContentLoaded', function () {

  // Header solid on scroll
  const header = document.getElementById('siteHeader');
  function onScroll() {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll);
  onScroll();

  // Mobile nav
  const burger = document.getElementById('burgerBtn');
  const mobileNav = document.getElementById('mobileNav');
  const overlay = document.getElementById('overlay');
  const closeBtn = document.getElementById('mobileNavClose');

  function openNav() {
    mobileNav.classList.add('open');
    overlay.classList.add('show');
  }
  function closeNav() {
    mobileNav.classList.remove('open');
    overlay.classList.remove('show');
  }
  if (burger) burger.addEventListener('click', openNav);
  if (closeBtn) closeBtn.addEventListener('click', closeNav);
  if (overlay) overlay.addEventListener('click', closeNav);
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));

  // Footer year
  const anoEl = document.getElementById('ano');
  if (anoEl) anoEl.textContent = new Date().getFullYear();

  // Cadastro form -> feedback (sem backend configurado ainda)
  const form = document.getElementById('formCadastro');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.textContent = 'Cadastro recebido! ✓';
      form.reset();
      setTimeout(() => { btn.textContent = original; }, 3000);
    });
  }

  // ---------------------------------------------------------
  // Lightbox dos cards de Golaço (amplia a imagem ao clicar)
  // ---------------------------------------------------------
  const golacoLightbox = document.getElementById('golacoLightbox');
  const golacoLightboxImg = document.getElementById('golacoLightboxImg');
  const golacoLightboxClose = document.getElementById('golacoLightboxClose');

  function openGolacoLightbox(imgEl) {
    if (!golacoLightbox || !imgEl) return;
    golacoLightboxImg.src = imgEl.src;
    golacoLightboxImg.alt = imgEl.alt || '';
    golacoLightbox.classList.add('open');
  }
  function closeGolacoLightbox() {
    if (!golacoLightbox) return;
    golacoLightbox.classList.remove('open');
    golacoLightboxImg.src = '';
  }
  document.querySelectorAll('.golaco-card').forEach(card => {
    card.addEventListener('click', () => openGolacoLightbox(card.querySelector('img')));
    card.addEventListener('keypress', e => {
      if (e.key === 'Enter' || e.key === ' ') openGolacoLightbox(card.querySelector('img'));
    });
  });
  if (golacoLightboxClose) golacoLightboxClose.addEventListener('click', closeGolacoLightbox);
  if (golacoLightbox) golacoLightbox.addEventListener('click', e => {
    if (e.target === golacoLightbox) closeGolacoLightbox();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeGolacoLightbox();
  });

  // ---------------------------------------------------------
  // WhatsApp do gabinete — TROCAR pelo número real (formato 55DDNÚMERO)
  // ---------------------------------------------------------
  const GABINETE_WHATSAPP = '5532900000000'; // <-- placeholder, substituir

  const btnWhatsGabinete = document.getElementById('btnWhatsGabinete');
  if (btnWhatsGabinete) {
    btnWhatsGabinete.href = 'https://wa.me/' + GABINETE_WHATSAPP +
      '?text=' + encodeURIComponent('Olá! Vim pelo site e gostaria de falar com o gabinete da vereadora Roberta Lopes.');
  }

  // ---------------------------------------------------------
  // Solicitação do eleitor — busca de CEP (ViaCEP) + protocolo (protótipo)
  // ---------------------------------------------------------
  const cepInput = document.getElementById('cep');
  const bairroCidadeInput = document.getElementById('bairroCidade');

  if (cepInput) {
    cepInput.addEventListener('blur', function () {
      const cep = cepInput.value.replace(/\D/g, '');
      if (cep.length !== 8) return;
      bairroCidadeInput.value = 'Buscando...';
      fetch('https://viacep.com.br/ws/' + cep + '/json/')
        .then(r => r.json())
        .then(data => {
          if (data.erro) {
            bairroCidadeInput.value = '';
            bairroCidadeInput.placeholder = 'CEP não encontrado — preencha manualmente';
            bairroCidadeInput.readOnly = false;
          } else {
            bairroCidadeInput.value = (data.bairro ? data.bairro + ' — ' : '') + data.localidade + '/' + data.uf;
          }
        })
        .catch(() => {
          bairroCidadeInput.value = '';
          bairroCidadeInput.placeholder = 'Não foi possível buscar — preencha manualmente';
          bairroCidadeInput.readOnly = false;
        });
    });
  }

  // CEP automático do formulário "Junte-se a Nós"
  const cepCadastroInput = document.getElementById('cepCadastro');
  const bairroCidadeCadastroInput = document.getElementById('bairroCidadeCadastro');

  if (cepCadastroInput) {
    cepCadastroInput.addEventListener('blur', function () {
      const cep = cepCadastroInput.value.replace(/\D/g, '');
      if (cep.length !== 8) return;
      bairroCidadeCadastroInput.value = 'Buscando...';
      fetch('https://viacep.com.br/ws/' + cep + '/json/')
        .then(r => r.json())
        .then(data => {
          if (data.erro) {
            bairroCidadeCadastroInput.value = '';
            bairroCidadeCadastroInput.placeholder = 'CEP não encontrado — preencha manualmente';
            bairroCidadeCadastroInput.readOnly = false;
          } else {
            bairroCidadeCadastroInput.value = (data.bairro ? data.bairro + ' — ' : '') + data.localidade + '/' + data.uf;
          }
        })
        .catch(() => {
          bairroCidadeCadastroInput.value = '';
          bairroCidadeCadastroInput.placeholder = 'Não foi possível buscar — preencha manualmente';
          bairroCidadeCadastroInput.readOnly = false;
        });
    });
  }

  const formSolicitacao = document.getElementById('formSolicitacao');
  if (formSolicitacao) {
    formSolicitacao.addEventListener('submit', function (e) {
      e.preventDefault();

      const ano = new Date().getFullYear();
      const numeroAleatorio = Math.floor(100000 + Math.random() * 900000);
      const protocolo = 'RL-' + ano + '-' + numeroAleatorio;

      const dados = new FormData(formSolicitacao);
      const nome = dados.get('nome') || '';
      const assunto = dados.get('assunto') || '';
      const descricao = dados.get('descricao') || '';
      const bairroCidade = dados.get('bairroCidade') || '';

      // Envia a solicitação por e-mail para o gabinete
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, assunto, descricao, bairroCidade, protocolo })
      }).catch(() => {});

      document.getElementById('protocoloNumero').textContent = protocolo;
      document.getElementById('protocoloResultado').style.display = 'block';

      const btnWhatsSolicitacao = document.getElementById('btnWhatsSolicitacao');
      if (btnWhatsSolicitacao) {
        const texto = 'Solicitação (protocolo ' + protocolo + ')\n' +
          'Nome: ' + nome + '\n' +
          'Local: ' + bairroCidade + '\n' +
          'Assunto: ' + assunto + '\n' +
          'Descrição: ' + descricao;
        btnWhatsSolicitacao.href = 'https://wa.me/' + GABINETE_WHATSAPP + '?text=' + encodeURIComponent(texto);
      }

      formSolicitacao.reset();
    });
  }

  // ---------------------------------------------------------
  // Modal rápido "Junte-se a Nós" — Nome, E-mail, WhatsApp, Mensagem
  // ---------------------------------------------------------
  const joinOverlay = document.getElementById('joinModalOverlay');
  const joinClose = document.getElementById('joinModalClose');
  const joinForm = document.getElementById('joinModalForm');
  const joinFeedback = document.getElementById('joinModalFeedback');
  const joinTriggers = document.querySelectorAll('.js-join-modal');

  function openJoinModal(e) {
    if (e) e.preventDefault();
    if (!joinOverlay) return;
    joinOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeJoinModal() {
    if (!joinOverlay) return;
    joinOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  joinTriggers.forEach(el => el.addEventListener('click', openJoinModal));
  if (joinClose) joinClose.addEventListener('click', closeJoinModal);
  if (joinOverlay) joinOverlay.addEventListener('click', e => {
    if (e.target === joinOverlay) closeJoinModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeJoinModal();
  });

  if (joinForm) {
    joinForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = joinForm.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Enviando...';

      const dados = new FormData(joinForm);
      const nome = dados.get('nome') || '';
      const email = dados.get('email') || '';
      const whatsapp = dados.get('whatsapp') || '';
      const mensagem = dados.get('mensagem') || '';

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email,
          whatsapp,
          assunto: 'Junte-se a Nós (site)',
          descricao: mensagem || 'Cadastro rápido pelo botão Junte-se a Nós (sem mensagem livre).'
        })
      })
        .then(() => {
          if (joinFeedback) {
            joinFeedback.textContent = 'Recebemos seus dados! Em breve o gabinete entra em contato.';
            joinFeedback.style.display = 'block';
          }
          joinForm.reset();
          joinForm.style.display = 'none';
        })
        .catch(() => {
          if (joinFeedback) {
            joinFeedback.textContent = 'Não foi possível enviar agora. Tente novamente em instantes.';
            joinFeedback.style.display = 'block';
          }
        })
        .finally(() => {
          btn.disabled = false;
          btn.textContent = original;
          setTimeout(() => {
            closeJoinModal();
            joinForm.style.display = '';
            if (joinFeedback) joinFeedback.style.display = 'none';
          }, 2800);
        });
    });
  }

  // ---------------------------------------------------------
  // Movimento — scroll reveal + contadores animados
  // ---------------------------------------------------------
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const revealSelectors = [
    '.section-head', '.pilar-card', '.golaco-card', '.extra-card', '.stat-card',
    '.acoes-card', '.pl-card', '.noticia-card', '.download-card', '.agenda-item',
    '.rede-card', '.apoio-card', '.video-card', '.recursos-row', '.tl-item',
    '.hero-copy', '.hero-media', '.sobre-media', '.sobre-copy', '.cadastro-box',
    '.contato-info', '.solicitacao-box', '.cta-badge', '.recursos-intro'
  ];

  const revealGroups = {};
  revealSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (el.hasAttribute('data-reveal')) return;
      el.setAttribute('data-reveal', '');
      const parent = el.parentElement;
      const key = sel + '::' + (parent ? Array.prototype.indexOf.call(parent.children, el) : 0);
      revealGroups[sel] = revealGroups[sel] || new Map();
      if (!revealGroups[sel].has(parent)) revealGroups[sel].set(parent, 0);
      const idx = revealGroups[sel].get(parent);
      revealGroups[sel].set(parent, idx + 1);
      el.style.transitionDelay = prefersReducedMotion ? '0s' : Math.min(idx * 80, 400) + 'ms';
    });
  });

  const revealTargets = document.querySelectorAll('[data-reveal]');

  function animateCount(el) {
    const raw = el.textContent.trim();
    if (!/^[0-9][0-9.]*$/.test(raw)) return; // só números "puros" tipo 7.924 ou 22
    const target = parseInt(raw.replace(/\./g, ''), 10);
    if (!target || target <= 0) return;
    const hasThousandDot = raw.indexOf('.') !== -1;
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      el.textContent = hasThousandDot ? current.toLocaleString('pt-BR') : String(current);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = raw;
    }
    requestAnimationFrame(tick);
  }

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          if (entry.target.classList.contains('stat-card') || entry.target.classList.contains('hero-copy')) {
            entry.target.querySelectorAll('strong').forEach(animateCount);
          }
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(el => io.observe(el));
  }

});
