// Vercel Function — envia o formulário de Contato/Solicitação por e-mail via Resend.
// Usa a variável de ambiente RESEND_API_KEY configurada no painel da Vercel.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { nome, email, bairroCidade, assunto, descricao, protocolo } = req.body || {};

    if (!nome || !descricao) {
      res.status(400).json({ error: 'Nome e descrição são obrigatórios.' });
      return;
    }

    const GABINETE_EMAIL = process.env.GABINETE_EMAIL || 'contato@robertalopesdm.com.br';
    const FROM_EMAIL = process.env.RESEND_FROM || 'Site Roberta Lopes <contato@robertalopesdm.com.br>';

    const html = `
      <h2>Nova solicitação pelo site${protocolo ? ' — protocolo ' + protocolo : ''}</h2>
      <p><strong>Nome:</strong> ${nome}</p>
      ${bairroCidade ? `<p><strong>Local:</strong> ${bairroCidade}</p>` : ''}
      ${assunto ? `<p><strong>Assunto:</strong> ${assunto}</p>` : ''}
      <p><strong>Descrição:</strong><br>${String(descricao).replace(/\n/g, '<br>')}</p>
      ${email ? `<p><strong>E-mail do solicitante:</strong> ${email}</p>` : ''}
    `;

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [GABINETE_EMAIL],
        reply_to: email || undefined,
        subject: `Nova solicitação do site${assunto ? ' — ' + assunto : ''}${protocolo ? ' (' + protocolo + ')' : ''}`,
        html
      })
    });

    if (!resendResp.ok) {
      const details = await resendResp.text();
      res.status(502).json({ error: 'Falha ao enviar e-mail', details });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
