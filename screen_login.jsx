// screen_login.jsx
(function () {
  const { useState } = React;
  const { Button, FloatInput, Spinner, Icon } = window;

  function LoginScreen({ onLogin }) {
    const [email, setEmail] = useState('info@pgasesorainmobiliaria.com');
    const [pass, setPass] = useState('');
    const [pass2, setPass2] = useState('');
    const [mode, setMode] = useState('login'); // 'login' | 'setup'
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
      e.preventDefault();
      setErr('');
      if (!email.includes('@')) { setErr('Introduce un email válido.'); return; }

      if (mode === 'setup') {
        if (pass.length < 6) { setErr('La contraseña debe tener al menos 6 caracteres.'); return; }
        if (pass !== pass2) { setErr('Las contraseñas no coinciden.'); return; }
        setLoading(true);
        try {
          const res = await fetch('/api/auth/setup', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass }),
          });
          const data = await res.json();
          if (res.ok) { onLogin(); return; }
          setErr(data.error || 'No se pudo crear la contraseña.');
        } catch { setErr('Error de conexión. Inténtalo de nuevo.'); }
        finally { setLoading(false); }
        return;
      }

      // mode login
      if (!pass) { setErr('Introduce tu contraseña.'); return; }
      setLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass }),
        });
        if (res.status === 409) {
          // Primer acceso: la cuenta existe pero no tiene contraseña
          setMode('setup'); setPass(''); setPass2('');
          setErr('');
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (res.ok) { onLogin(); return; }
        setErr(data.error || 'Email o contraseña incorrectos.');
      } catch { setErr('Error de conexión. Inténtalo de nuevo.'); }
      finally { setLoading(false); }
    };

    const isSetup = mode === 'setup';

    return (
      <div className="login-stage">
        <form className="login-card" onSubmit={submit}>
          <div className="login-logo">PG</div>
          <h1>{isSetup ? 'Crea tu contraseña' : 'Bienvenida de nuevo'}</h1>
          <p className="lc-sub">
            {isSetup
              ? 'Es tu primer acceso. Elige una contraseña para tu cuenta.'
              : 'Tu CRM inmobiliario. Inicia sesión para continuar.'}
          </p>

          {err && <div className="login-err"><Icon name="close" size={15} />{err}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FloatInput label="Correo electrónico" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            <FloatInput label={isSetup ? 'Nueva contraseña' : 'Contraseña'} type="password" value={pass}
              onChange={(e) => setPass(e.target.value)} autoComplete={isSetup ? 'new-password' : 'current-password'} />
            {isSetup && (
              <FloatInput label="Repite la contraseña" type="password" value={pass2}
                onChange={(e) => setPass2(e.target.value)} autoComplete="new-password" />
            )}
          </div>

          {!isSetup && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '14px 0 22px' }}>
              <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}>¿Olvidaste tu contraseña?</a>
            </div>
          )}

          <Button variant="primary" size="lg" className="block" type="submit" disabled={loading} style={isSetup ? { marginTop: 22 } : null}>
            {loading ? <><Spinner /> {isSetup ? 'Creando…' : 'Accediendo…'}</> : (isSetup ? 'Crear contraseña y entrar' : 'Iniciar sesión')}
          </Button>

          {isSetup && (
            <div className="login-foot">
              <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); setErr(''); setPass(''); setPass2(''); }}>← Volver</a>
            </div>
          )}
        </form>
      </div>
    );
  }

  window.LoginScreen = LoginScreen;
})();
