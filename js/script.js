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

});
