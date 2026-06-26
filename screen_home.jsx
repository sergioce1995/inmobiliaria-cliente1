// screen_home.jsx — Inicio: asistente comercial.
// Siguiente acción + cola de acciones + actividad reciente.
(function () {
  const { useState } = React;
  const { Icon, Avatar, Button } = window;

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

  const PRIORITY = {
    alta:         { label: 'Prioridad máxima', cls: 'alta',         icon: 'phone' },
    media:        { label: 'Importante',       cls: 'media',        icon: 'calendar' },
    oportunidad:  { label: 'Oportunidad',      cls: 'oportunidad',  icon: 'send' },
    seguimiento:  { label: 'Seguimiento',      cls: 'seguimiento',  icon: 'clock' },
  };

  function HomeScreen({ homeData, onGo, onAction, user = {} }) {
    const { summary = [], recommendations = [], activity = [] } = homeData || {};
    const [dismissed, setDismissed] = useState(new Set());

    const now = new Date();
    const hour = now.getHours();
    const greet = hour < 6 ? 'Buenas noches' : hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
    const fecha = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const firstName = (user.nombre || 'Usuario').split(' ')[0];

    const go = (action) => { if (!action) return; onAction ? onAction(action) : onGo(action.screen); };
    const dismiss = (idx) => setDismissed((s) => new Set([...s, idx]));

    const activeRecs = recommendations.filter((_, i) => !dismissed.has(i));
    const nextAction = activeRecs[0];
    const queue = activeRecs.slice(1);

    const leadsNuevos = summary.find((s) => s.label === 'Leads nuevos');
    const visitasHoy = summary.find((s) => s.label === 'Visitas hoy');

    const potentialVisitas = activeRecs.filter((r) => r.priority === 'alta' || r.priority === 'media').length;
    const potentialNeg = activeRecs.filter((r) => r.priority === 'seguimiento').length;

    return (
      <div className="page">
        <div className="page-head">
          <div className="ph-l">
            <h1 className="t-h1">{greet}, {firstName}</h1>
            <span className="sub" style={{ textTransform: 'capitalize' }}>{fecha}</span>
          </div>
        </div>

        {/* ── 2 KPIs accionables ── */}
        <div className="home-kpi-row">
          <button className="home-kpi-btn" onClick={() => go(leadsNuevos && leadsNuevos.action)}>
            <div className="home-kpi-val tnum">{leadsNuevos ? leadsNuevos.value : 0}</div>
            <div className="home-kpi-label">Leads nuevos</div>
          </button>
          <button className="home-kpi-btn" onClick={() => go(visitasHoy && visitasHoy.action)}>
            <div className="home-kpi-val tnum">{visitasHoy ? visitasHoy.value : 0}</div>
            <div className="home-kpi-label">Visitas hoy</div>
          </button>
        </div>

        {/* ── Bloque motivacional ── */}
        {activeRecs.length > 0 && (
          <div className="home-impact">
            <Icon name="sparkle" size={14} />
            <span>Hoy podrías generar <strong>{potentialVisitas} visita{potentialVisitas !== 1 ? 's' : ''}</strong>
            {potentialNeg > 0 && <> y <strong>{potentialNeg} negociación{potentialNeg !== 1 ? 'es' : ''}</strong></>}
            {' '}si completas las {activeRecs.length} acciones.</span>
          </div>
        )}

        {/* ── SIGUIENTE ACCIÓN (hero) ── */}
        {nextAction ? (() => {
          const pr = PRIORITY[nextAction.priority] || PRIORITY.media;
          const origIdx = recommendations.indexOf(nextAction);
          return (
            <div className={`home-hero home-hero-${pr.cls}`}>
              <div className="home-hero-header">
                <span className="home-hero-badge">{pr.label}</span>
                <span className="home-hero-step">{dismissed.size + 1} de {recommendations.length}</span>
              </div>
              <div className="home-hero-body">
                <div className="home-hero-icon"><Icon name={nextAction.icon || pr.icon} size={28} /></div>
                <div className="home-hero-content">
                  <div className="home-hero-accion">{nextAction.accion}</div>
                  <div className="home-hero-motivo">{nextAction.motivo}</div>
                  {nextAction.impacto && <div className="home-hero-impacto"><Icon name="sparkle" size={12} />{nextAction.impacto}</div>}
                </div>
              </div>
              <div className="home-hero-actions">
                <button className="home-hero-cta" onClick={() => go(nextAction.action)}>
                  {nextAction.cta} <Icon name="arrowRight" size={16} />
                </button>
                <button className="home-hero-done" onClick={() => dismiss(origIdx)}>
                  <Icon name="check" size={16} /> Hecho
                </button>
              </div>
            </div>
          );
        })() : (
          <div className="home-hero home-hero-done-all">
            <div className="home-hero-body" style={{ justifyContent: 'center', textAlign: 'center', padding: '40px 20px' }}>
              <div><Icon name="check" size={32} style={{ color: 'var(--green)' }} /></div>
              <div className="home-hero-accion" style={{ marginTop: 12 }}>Todo al día</div>
              <div className="home-hero-motivo">Has completado todas las acciones recomendadas. Buen trabajo.</div>
            </div>
          </div>
        )}

        {/* ── Cola de acciones (las siguientes, compactas) ── */}
        {queue.length > 0 && (
          <div className="home-queue">
            <div className="home-queue-head">
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>Siguientes acciones</span>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{queue.length} pendiente{queue.length !== 1 ? 's' : ''}</span>
            </div>
            {queue.map((r, i) => {
              const pr = PRIORITY[r.priority] || PRIORITY.media;
              const origIdx = recommendations.indexOf(r);
              return (
                <div className={`home-q-item home-q-${pr.cls}`} key={origIdx}>
                  <span className={`home-q-dot home-q-dot-${pr.cls}`} />
                  <div className="home-q-main">
                    <div className="home-q-accion">{r.accion}</div>
                    <div className="home-q-motivo">{r.motivo}</div>
                  </div>
                  <div className="home-q-btns">
                    <button className="home-q-cta" onClick={() => go(r.action)}>{r.cta}</button>
                    <button className="home-q-done" onClick={() => dismiss(origIdx)} title="Marcar como hecho"><Icon name="check" size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Actividad reciente (humanizada) ── */}
        <div className="panel home-activity">
          <div className="panel-head">
            <h3>Actividad reciente</h3>
          </div>
          {activity.length === 0 ? (
            <div className="home-act-empty">Aún no hay actividad que mostrar.</div>
          ) : (
            <div className="home-act-list">
              {activity.map((a, i) => (
                <button className="home-act-item" key={i} onClick={() => a.action ? go(a.action) : (a.screen && onGo(a.screen))}>
                  <span className="home-act-ic"><Icon name={a.icon} size={16} /></span>
                  <span className="home-act-txt">{a.txt}</span>
                  <span className="home-act-time">{relTime(a.ts)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  window.HomeScreen = HomeScreen;
})();
