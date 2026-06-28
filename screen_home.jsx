// screen_home.jsx — Inicio: panel de recomendaciones dinámicas
(function () {
  const { useState } = React;
  const { Icon, Button } = window;

  function relTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    const min = Math.floor((Date.now() - d.getTime()) / 60000);
    if (min < 1) return 'ahora';
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} h`;
    const days = Math.floor(h / 24);
    if (days < 30) return `hace ${days} día${days > 1 ? 's' : ''}`;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  const REC_TYPE = {
    urgente:       { label: 'Urgente',        color: '#fee2e2', textColor: '#dc2626', icon: 'alert', borderColor: '#fca5a5' },
    importante:    { label: 'Importante',     color: '#fed7aa', textColor: '#ea580c', icon: 'flag', borderColor: '#fdba74' },
    oportunidad:   { label: 'Oportunidad',    color: '#dcfce7', textColor: '#15803d', icon: 'zap', borderColor: '#86efac' },
    seguimiento:   { label: 'Seguimiento',    color: '#dbeafe', textColor: '#0284c7', icon: 'clock', borderColor: '#7dd3fc' },
    compatibles:   { label: 'Compatibles',    color: '#f3e8ff', textColor: '#7c3aed', icon: 'users', borderColor: '#e9d5ff' },
  };

  function HomeScreen({ homeData, onGo, onAction, user = {} }) {
    const { summary = [], recommendations = [], activity = [] } = homeData || {};

    const now = new Date();
    const hour = now.getHours();
    const greet = hour < 6 ? 'Buenas noches' : hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
    const fecha = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const firstName = (user.nombre || 'Usuario').split(' ')[0];

    const go = (action) => { if (!action) return; onAction ? onAction(action) : onGo(action.screen); };

    // KPIs principales
    const kpiList = summary.slice(0, 3);
    const topRecs = recommendations.slice(0, 5);

    return (
      <div className="page hp-v2">
        {/* ── Header ── */}
        <div className="hp-header">
          <h1 className="hp-greet">{greet}, {firstName}</h1>
          <span className="hp-date">{fecha}</span>
        </div>

        {/* ── KPIs importantes ── */}
        {kpiList.length > 0 && (
          <div className="hp-kpis-grid">
            {kpiList.map((kpi, i) => (
              <button key={i} className="kpi-card" onClick={() => go(kpi.action)}>
                <span className="kpi-val tnum">{kpi.value}</span>
                <span className="kpi-lbl">{kpi.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Recomendaciones importantes ── */}
        {topRecs.length > 0 ? (
          <div className="hp-recs">
            <h2 className="hp-sec-title">Recomendaciones importantes</h2>
            <div className="hp-recs-list">
              {topRecs.map((rec, idx) => {
                const recType = REC_TYPE[rec.tipo] || REC_TYPE.importante;
                return (
                  <div key={idx} className="rec-card" style={{ borderLeft: `4px solid ${recType.borderColor}`, background: recType.color }}>
                    <div className="rec-header">
                      <div className="rec-badge" style={{ background: recType.textColor, color: '#fff' }}>
                        <Icon name={recType.icon} size={14} />
                        <span>{recType.label}</span>
                      </div>
                    </div>
                    <h3 className="rec-title" style={{ color: recType.textColor }}>{rec.accion}</h3>
                    <p className="rec-desc">{rec.motivo}</p>
                    {rec.impacto && (
                      <p className="rec-benefit">
                        <Icon name="sparkle" size={12} /> {rec.impacto}
                      </p>
                    )}
                    <button className="rec-btn" onClick={() => go(rec.action)} style={{ background: recType.textColor, color: '#fff' }}>
                      {rec.cta} <Icon name="arrowRight" size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="hp-empty">
            <div className="hp-empty-check"><Icon name="check" size={40} /></div>
            <h2 className="hp-empty-title">Todo al día</h2>
            <p className="hp-empty-msg">No hay recomendaciones pendientes. Buen trabajo.</p>
          </div>
        )}

        {/* ── Actividad reciente (opcional) ── */}
        {activity.length > 0 && (
          <div className="hp-activity">
            <h3 className="hp-sec-title">Actividad reciente</h3>
            <div className="hp-act-list">
              {activity.slice(0, 5).map((a, i) => (
                <button className="hp-act-row" key={i} onClick={() => a.action ? go(a.action) : (a.screen && onGo(a.screen))}>
                  <span className="hp-act-ic"><Icon name={a.icon} size={14} /></span>
                  <span className="hp-act-txt">{a.txt}</span>
                  <span className="hp-act-time">{relTime(a.ts)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  window.HomeScreen = HomeScreen;
})();
