// screen_notifications.jsx
(function () {
  const { useState } = React;
  const { Toggle, Button, Icon } = window;

  function SettingRow({ title, desc, on, onChange, blue }) {
    return (
      <div className="setting-row">
        <div className="sr-l">
          <div className="t">{title}</div>
          <div className="d">{desc}</div>
        </div>
        <Toggle on={on} onChange={onChange} blue={blue} />
      </div>
    );
  }

  function NotificationsScreen({ notifications, toast }) {
    const [settings, setSettings] = useState({
      emailNew: true, emailClosed: true, emailDigest: false,
      appNew: true, appVisits: true, appShares: false,
    });
    const [freq, setFreq] = useState('diaria');
    const set = (k) => (v) => setSettings((s) => ({ ...s, [k]: v }));

    return (
      <div className="page">
        <div className="page-head">
          <div className="ph-l">
            <h1 className="t-h1">Notificaciones</h1>
            <span className="sub">Decide qué te avisamos y con qué frecuencia</span>
          </div>
          <Button variant="primary" icon="bell" onClick={() => toast('Notificación de prueba enviada')}>
            Enviar prueba
          </Button>
        </div>

        <div className="notif-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="panel">
              <div className="panel-head"><h3>Email</h3></div>
              <SettingRow title="Nuevos leads" desc="Recibe un correo en cuanto llega un lead." on={settings.emailNew} onChange={set('emailNew')} />
              <SettingRow title="Operaciones cerradas" desc="Cuando se firma una venta o reserva." on={settings.emailClosed} onChange={set('emailClosed')} />
              <SettingRow title="Resumen periódico" desc="Un digest con la actividad de tu cartera." on={settings.emailDigest} onChange={set('emailDigest')} />
            </div>

            <div className="panel">
              <div className="panel-head"><h3>En la aplicación</h3></div>
              <SettingRow title="Nuevos leads" desc="Aviso instantáneo dentro de ZADI." on={settings.appNew} onChange={set('appNew')} blue />
              <SettingRow title="Visitas confirmadas" desc="Cuando un lead agenda una visita." on={settings.appVisits} onChange={set('appVisits')} blue />
              <SettingRow title="Aperturas de dossier" desc="Cuando un lead abre algo que compartiste." on={settings.appShares} onChange={set('appShares')} blue />
            </div>

            <div className="panel">
              <div className="panel-head"><h3>Frecuencia del resumen</h3></div>
              <div className="freq-seg">
                {['diaria', 'semanal', 'mensual'].map((f) => (
                  <button key={f} className={freq === f ? 'active' : ''} onClick={() => setFreq(f)}>
                    {f[0].toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Historial reciente</h3></div>
            <div className="timeline">
              {notifications.map((n, i) => (
                <div className="tl-item" key={i}>
                  <div className="tl-ic" style={{ background: 'var(--blue-50)', color: 'var(--blue)' }}>
                    <Icon name={n.icon} size={17} />
                  </div>
                  <div>
                    <div className="tl-txt">{n.txt}</div>
                    <div className="tl-date">{n.fecha}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  window.NotificationsScreen = NotificationsScreen;
})();
