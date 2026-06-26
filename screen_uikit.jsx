// screen_uikit.jsx
(function () {
  const { useState } = React;
  const { Button, IconButton, Input, Select, Toggle, Tabs, StatusBadge, Avatar, Tooltip, Spinner, Icon, Modal } = window;

  const COLORS = [
    { nm: 'Primario', hx: '#2E75B6', v: 'var(--blue)' },
    { nm: 'Azul oscuro', hx: '#1e5a96', v: 'var(--blue-700)' },
    { nm: 'Secundario', hx: '#F5A623', v: 'var(--orange)' },
    { nm: 'Éxito', hx: '#5cb338', v: 'var(--green)' },
    { nm: 'Error', hx: '#e5544b', v: 'var(--red)' },
    { nm: 'Texto', hx: '#1f2d3d', v: 'var(--ink)' },
    { nm: 'Texto sec.', hx: '#51606f', v: 'var(--ink-2)' },
    { nm: 'Fondo', hx: '#f5f6f7', v: 'var(--bg)' },
  ];
  const TYPES = [
    { n: 'Display / H1', c: 't-h1', m: '30px · 700' },
    { n: 'Título / H2', c: 't-h2', m: '22px · 700' },
    { n: 'Subtítulo / H3', c: 't-h3', m: '17px · 600' },
    { n: 'Cuerpo', c: 't-body', m: '14px · 400' },
    { n: 'Pequeño', c: 't-sm', m: '13px · 400' },
  ];

  function Sec({ title, children }) {
    return <div className="uikit-sec"><h2>{title}</h2>{children}</div>;
  }

  function UIKitScreen() {
    const [tab, setTab] = useState('todos');
    const [tog, setTog] = useState(true);
    const [tog2, setTog2] = useState(false);
    const [modal, setModal] = useState(false);
    const [sel, setSel] = useState('opt1');

    return (
      <div className="page">
        <div className="page-head">
          <div className="ph-l">
            <h1 className="t-h1">UI Kit</h1>
            <span className="sub">Librería de componentes de ZADI · sistema de diseño</span>
          </div>
        </div>

        <Sec title="Color">
          <div className="swatches">
            {COLORS.map((c) => (
              <div className="swatch" key={c.nm}>
                <div className="chip" style={{ background: c.v }} />
                <div className="meta"><div className="nm">{c.nm}</div><div className="hx">{c.hx}</div></div>
              </div>
            ))}
          </div>
        </Sec>

        <Sec title="Tipografía">
          <div className="kit-card">
            {TYPES.map((t) => (
              <div className="type-spec" key={t.n}>
                <span className="ts-meta">{t.m}</span>
                <span className={t.c}>{t.n} — Inmuebles ZADI</span>
              </div>
            ))}
            <div className="type-spec" style={{ borderBottom: 'none' }}>
              <span className="ts-meta">mono · datos</span>
              <span className="mono" style={{ fontSize: 16 }}>745.000 € · +34 612 884 209</span>
            </div>
          </div>
        </Sec>

        <Sec title="Botones">
          <div className="kit-card">
            <div className="kit-row">
              <Button variant="primary">Primario</Button>
              <Button variant="secondary">Secundario</Button>
              <Button variant="success" icon="check">Éxito</Button>
              <Button variant="danger" icon="trash">Eliminar</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <div className="kit-row">
              <Button variant="primary" size="sm" icon="plus">Pequeño</Button>
              <Button variant="primary" icon="send">Mediano</Button>
              <Button variant="primary" size="lg" iconRight="arrowRight">Grande</Button>
              <Button variant="primary" disabled>Deshabilitado</Button>
              <IconButton name="settings" bordered />
              <IconButton name="bell" bordered />
            </div>
          </div>
        </Sec>

        <Sec title="Formularios">
          <div className="kit-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
            <Input label="Nombre" placeholder="Laura Giménez" />
            <Input label="Email" icon="mail" placeholder="laura@email.com" />
            <Input label="Con error" placeholder="000" error="Campo obligatorio" />
            <div className="field">
              <label>Ciudad</label>
              <Select value={sel} onChange={(e) => setSel(e.target.value)}
                options={[{ value: 'opt1', label: 'Barcelona' }, { value: 'opt2', label: 'Madrid' }, { value: 'opt3', label: 'Valencia' }]} />
            </div>
          </div>
        </Sec>

        <Sec title="Badges & Estados">
          <div className="kit-card">
            <div className="kit-row">
              <StatusBadge status="nuevo" pulse /><StatusBadge status="contactado" />
              <StatusBadge status="interesado" /><StatusBadge status="cerrado" />
            </div>
            <div className="kit-row">
              <Avatar name="Laura Giménez" color="#2E75B6" />
              <Avatar name="Marc Soler" color="#F5A623" />
              <Avatar name="Carmen Ruiz" color="#5cb338" />
              <span className="score-pill"><Icon name="star" size={12} />92</span>
            </div>
          </div>
        </Sec>

        <Sec title="Controles">
          <div className="kit-card" style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span className="t-eyebrow">Toggles</span>
              <div style={{ display: 'flex', gap: 14 }}>
                <Toggle on={tog} onChange={setTog} /><Toggle on={tog2} onChange={setTog2} blue />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span className="t-eyebrow">Tabs</span>
              <Tabs value={tab} onChange={setTab} options={[{ value: 'todos', label: 'Todos' }, { value: 'act', label: 'Activos' }, { value: 'arch', label: 'Archivo' }]} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span className="t-eyebrow">Tooltip & Loading</span>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <Tooltip label="Compartir con lead"><IconButton name="share" bordered /></Tooltip>
                <Spinner dark />
              </div>
            </div>
          </div>
        </Sec>

        <Sec title="Overlays & Feedback">
          <div className="kit-card">
            <div className="kit-row">
              <Button variant="primary" onClick={() => setModal(true)}>Abrir modal</Button>
            </div>
            <div className="kit-row" style={{ marginTop: 4 }}>
              <span className="login-err" style={{ margin: 0 }}><Icon name="close" size={15} />Mensaje de error</span>
              <span className="login-err" style={{ margin: 0, background: 'var(--green-50)', color: 'var(--green-600)' }}><Icon name="check" size={15} />Guardado con éxito</span>
              <span className="login-err" style={{ margin: 0, background: 'var(--orange-50)', color: 'var(--orange-600)' }}><Icon name="bulb" size={15} />Advertencia</span>
            </div>
          </div>
        </Sec>

        <Modal open={modal} onClose={() => setModal(false)} width={440}>
          <div className="modal-head">
            <h2 className="t-h2" style={{ margin: 0 }}>Ejemplo de modal</h2>
            <IconButton name="close" onClick={() => setModal(false)} />
          </div>
          <div className="modal-body">
            <p className="t-body" style={{ color: 'var(--ink-2)', margin: 0 }}>
              Los modales usan blur de fondo y animación de entrada. Pulsa Esc o haz clic fuera para cerrar.
            </p>
          </div>
          <div className="modal-foot">
            <Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={() => setModal(false)}>Confirmar</Button>
          </div>
        </Modal>
      </div>
    );
  }

  window.UIKitScreen = UIKitScreen;
})();
