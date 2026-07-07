// ZADI — main app
// Glues header / hero / filters / list / map / detail / sell into a single page.
// Owns: filters, favorites, view (listado|mapa), active property, modal, tweaks.

const PALETTES = {
  warm:  { name: 'Marrón pastel',   colors: ['#a88574', '#f5f1ed', '#d4c5b9', '#2a2520'] },
  sage:  { name: 'Salvia & oliva',  colors: ['#8a9a7b', '#f1f2ed', '#c8d1bc', '#2a2f26'] },
  terra: { name: 'Terracota cálido',colors: ['#c87858', '#faf0e9', '#e8c4ad', '#3d2a1f'] },
};

// ── Google Sheets endpoint (interest form) ──────────────────────────────
// To wire the "Estoy interesado" form to a Google Sheet:
//  1. Create a new Sheet.
//  2. Extensions → Apps Script. Paste:
//
//       function doPost(e) {
//         const data = JSON.parse(e.postData.contents);
//         const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
//         sheet.appendRow([
//           new Date(), data.nombre, data.apellidos, data.email, data.telefono,
//           data.propertyId, data.propertyTitle, data.operacion, data.precio,
//           data.zona, data.ciudad, data.m2, data.habitaciones
//         ]);
//         return ContentService.createTextOutput('ok');
//       }
//
//  3. Deploy → New deployment → Type: Web app → Execute as: Me →
//     Who has access: Anyone → Deploy. Copy the URL.
//  4. Replace `null` below with that URL (as a string).
//
// While null, the form runs in demo mode (logs payload to console).
window.ZADI_SHEETS_URL = null;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": ["#a88574", "#f5f1ed", "#d4c5b9", "#2a2520"],
  "density": "regular",
  "displayFont": "Syne",
  "cardLayout": "vertical",
  "sheetsUrl": ""
}/*EDITMODE-END*/;

function App() {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Cargar propiedades desde API (polling cada 10s para reflejar cambios en tiempo real)
  React.useEffect(() => {
    const loadProperties = async () => {
      try {
        const response = await fetch(`/api/paula/properties?t=${Date.now()}`);
        const result = await response.json();
        // El servidor ya devuelve el shape que la web espera (id, title, type, kind, area, price, rooms, baths, m2, lat, lng, photo, photos, description, address)
        const adapted = (result.properties || []).map((p, i) => ({
          ...p,
          // alias / defaults para mantener compatibilidad con los componentes:
          rooms: p.rooms ?? p.habitaciones ?? 0,
          baths: p.baths ?? p.banos ?? 0,
          m2: p.m2 ?? p.metros_cuadrados ?? 0,
          area: p.area || p.zona || p.ciudad || 'Tenerife',
          city: p.city || 'Tenerife',
          tone: p.tone ?? (i * 47) % 360,
          furnished: p.furnished ?? false,
          images: p.images || p.photos || [],
        }));
        setData(adapted);
      } catch (err) {
        console.error('Error cargando propiedades:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    loadProperties();
    const interval = setInterval(loadProperties, 10000); // Recargar cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  // Filters
  const [filters, setFilters] = React.useState({
    type: 'compra',
    area: '',
    minPrice: '',
    maxPrice: '',
    rooms: '',
    kind: '',
    furnished: '',
    sort: 'novedad',
  });
  const [view, setView] = React.useState('listado');
  const [active, setActive] = React.useState(null);
  const [openProperty, setOpenPropertyRaw] = React.useState(null);
  // Opening the detail view from the map should also dismiss the floating
  // marker card so the two surfaces never overlap.
  const setOpenProperty = React.useCallback((p) => {
    setOpenPropertyRaw(p);
    if (p) setActive(null);
  }, []);
  const [favorites, setFavorites] = React.useState(() => new Set());
  const [toast, setToast] = React.useState('');

  // Apply palette to root
  React.useEffect(() => {
    const [accent, bg, soft, ink] = t.palette;
    const root = document.documentElement;
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--bg', bg);
    root.style.setProperty('--soft', soft);
    root.style.setProperty('--ink', ink);
    root.style.setProperty('--display-font', t.displayFont);
    root.setAttribute('data-density', t.density);
    root.setAttribute('data-layout', t.cardLayout);
  }, [t.palette, t.density, t.displayFont, t.cardLayout]);

  // Wire Sheets URL from tweaks (so the user can paste it without editing files).
  React.useEffect(() => {
    window.ZADI_SHEETS_URL = (t.sheetsUrl && t.sheetsUrl.trim()) || null;
  }, [t.sheetsUrl]);

  // Show/hide toast
  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(id);
  }, [toast]);

  const showToast = (msg) => setToast(msg);

  const toggleFav = (id) => {
    setFavorites(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  // Filter + sort properties (real-time)
  const filtered = React.useMemo(() => {
    let out = data.filter(p => p.type === filters.type);
    if (filters.area) {
      const q = filters.area.trim().toLowerCase();
      out = out.filter(p =>
        p.area.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
      );
    }
    if (filters.minPrice) out = out.filter(p => p.price >= Number(filters.minPrice));
    if (filters.maxPrice) out = out.filter(p => p.price <= Number(filters.maxPrice));
    if (filters.rooms) out = out.filter(p => p.rooms >= Number(filters.rooms));
    if (filters.kind) out = out.filter(p => p.kind === filters.kind);
    if (filters.furnished && filters.type === 'alquiler') {
      out = out.filter(p => filters.furnished === 'si' ? p.furnished : !p.furnished);
    }
    // sort
    switch (filters.sort) {
      case 'precio-asc': out = [...out].sort((a, b) => a.price - b.price); break;
      case 'precio-desc': out = [...out].sort((a, b) => b.price - a.price); break;
      case 'm2': out = [...out].sort((a, b) => b.m2 - a.m2); break;
      default: break;
    }
    return out;
  }, [data, filters]);

  const onScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando propiedades...</div>;
  }

  return (
    <>
      <Header favorites={favorites.size} onScrollTo={onScrollTo} />

      <Hero count={data.length} onScrollTo={onScrollTo} />

      <div id="catalogo">
        <FilterBar
          filters={filters} setFilters={setFilters}
          view={view} setView={setView}
          count={filtered.length}
        />

        {view === 'listado' ? (
          <div className="container results">
            <ListView
              properties={filtered}
              favorites={favorites}
              onFav={toggleFav}
              onOpen={setOpenProperty}
            />
          </div>
        ) : (
          <MapView
            properties={filtered}
            activeId={active}
            setActiveId={setActive}
            onOpen={setOpenProperty}
            favorites={favorites}
            onFav={toggleFav}
          />
        )}
      </div>

      <SellSection onToast={showToast} />

      <AboutSection />

      <Footer />

      {openProperty && (
        <DetailModal
          property={openProperty}
          fav={favorites.has(openProperty.id)}
          onFav={toggleFav}
          onClose={() => setOpenProperty(null)}
          onToast={showToast}
        />
      )}

      <Toast msg={toast} />

      <ZadiTweaks t={t} setTweak={setTweak} />
    </>
  );
}

function AboutSection() {
  return (
    <section id="sobre" className="section" style={{
      background: 'color-mix(in oklab, var(--accent) 8%, var(--bg))',
      paddingBlock: 'var(--section-pad)',
    }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: '1rem' }}>Sobre Paula Gutiérrez</div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', marginBottom: '1.25rem' }}>
            Profesionalidad y valor humano
          </h2>
          <p style={{ color: 'var(--ink-2)', fontSize: '1rem', marginBottom: '1.5rem', maxWidth: '46ch' }}>
            Somos un equipo pequeño con base en Tenerife. Trabajamos con pocas propiedades, todas verificadas, y un proceso transparente para compradores, inquilinos y propietarios.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
            <div>
              <div style={{ fontFamily: 'Syne', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.025em' }}>2018</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fundada en</div>
            </div>
            <div>
              <div style={{ fontFamily: 'Syne', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.025em' }}>1.200+</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Operaciones</div>
            </div>
          </div>
        </div>
        <div style={{
          aspectRatio: '5/4',
          borderRadius: 'var(--r-xl)',
          overflow: 'hidden',
          background: `linear-gradient(135deg,
            color-mix(in oklab, var(--accent) 50%, white),
            color-mix(in oklab, var(--accent) 70%, var(--ink)))`,
          position: 'relative',
          boxShadow: 'var(--shadow-3)',
        }}>
          <img
            src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=80&auto=format&fit=crop"
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.92 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="contacto" className="footer">
      <div className="container footer-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span className="logo" style={{ fontSize: '1.2rem', cursor: 'default' }}>Paula Gutiérrez</span>
          <span>· Inmobiliaria en Tenerife</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <span>info@pgasesorainmobiliaria.com</span>
          <span>+34 638 56 10 80</span>
          <span>Calle el chorro, 9 · La Laguna</span>
          <span>Privacidad</span>
          <span>Cookies</span>
        </div>
      </div>
    </footer>
  );
}

function ZadiTweaks({ t, setTweak }) {
  const paletteOptions = Object.values(PALETTES).map(p => p.colors);
  const fontOptions = ['Syne', 'Instrument Serif', 'DM Serif Display'];
  return (
    <TweaksPanel title="Tweaks · ZADI">
      <TweakSection label="Paleta" />
      <TweakColor
        label="Color base"
        value={t.palette}
        options={paletteOptions}
        onChange={(v) => setTweak('palette', v)}
      />
      <TweakSection label="Tipografía & layout" />
      <TweakSelect
        label="Fuente display"
        value={t.displayFont}
        options={fontOptions}
        onChange={(v) => setTweak('displayFont', v)}
      />
      <TweakRadio
        label="Densidad"
        value={t.density}
        options={['compact', 'regular', 'comfy']}
        onChange={(v) => setTweak('density', v)}
      />
      <TweakRadio
        label="Cards"
        value={t.cardLayout}
        options={[
          { value: 'vertical', label: 'Grid' },
          { value: 'horizontal', label: 'Lista' },
        ]}
        onChange={(v) => setTweak('cardLayout', v)}
      />
      <TweakSection label="Integración Google Sheets" />
      <TweakText
        label="URL del Apps Script"
        value={t.sheetsUrl}
        placeholder="https://script.google.com/…"
        onChange={(v) => setTweak('sheetsUrl', v)}
      />
      <div style={{
        fontSize: '10.5px',
        color: 'rgba(41,38,27,.55)',
        lineHeight: 1.45,
        padding: '0 2px',
      }}>
        {t.sheetsUrl
          ? '✓ Conectado. Los envíos irán a tu hoja.'
          : 'Sin URL: modo demo (no envía). Mira la consola para ver el payload.'}
      </div>
    </TweaksPanel>
  );
}

Object.assign(window, { App });
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
