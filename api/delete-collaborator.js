// Vercel Function — exclui um colaborador (conta de login) via Supabase Auth Admin.
// Usa a variável de ambiente SUPABASE_SERVICE_ROLE_KEY (secreta, nunca exposta ao navegador).

const SUPABASE_URL = 'https://qpompukdfrnyoaiqfdvp.supabase.co';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { userId, callerAccessToken } = req.body || {};
    if (!userId || !callerAccessToken) {
      res.status(400).json({ error: 'userId e sessão são obrigatórios.' });
      return;
    }

    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${callerAccessToken}`, apikey: SERVICE_KEY }
    });
    if (!userResp.ok) {
      res.status(401).json({ error: 'Sessão inválida.' });
      return;
    }
    const caller = await userResp.json();

    const profResp = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${caller.id}&select=role`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
    });
    const profs = await profResp.json();
    if (!profs[0] || profs[0].role !== 'admin') {
      res.status(403).json({ error: 'Apenas o administrador pode excluir colaboradores.' });
      return;
    }
    if (caller.id === userId) {
      res.status(400).json({ error: 'Não é possível excluir a própria conta por aqui.' });
      return;
    }

    const delResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
    });

    if (!delResp.ok) {
      const details = await delResp.text();
      res.status(502).json({ error: 'Falha ao excluir colaborador.', details });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
