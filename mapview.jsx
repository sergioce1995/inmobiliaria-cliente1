// ZADI — Map view (Leaflet + OpenStreetMap)
// Renders custom price markers, syncs with active property, and shows a
// side list of properties **visible in the current map viewport** (i.e.
// pan / zoom narrows the list; map markers always reflect the active filters).

const { useState: _useState, useEffect: _useEffect, useRef: _useRef, useMemo: _useMemo, useCallback: _useCallback } = React;

function MapView({ properties, activeId, setActiveId, onOpen, favorites, onFav }) {
  const mapRef = _useRef(null);
  const containerRef = _useRef(null);
  const markersRef = _useRef({});
  const layerRef = _useRef(null);
  // bounds version — bumped on every moveend/zoomend so the visible-list memo recomputes
  const [boundsVersion, setBoundsVersion] = _useState(0);
  const skipNextFitRef = _useRef(false);

  // Init map once
  _useEffect(() => {
    if (mapRef.current || !containerRef.current || !window.L) return;
    const L = window.L;
    const map = L.map(containerRef.current, {
      center: [28.28, -16.55],
      zoom: 10,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap, © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    // Bump version on movement so the visible-list memo recomputes.
    const onMove = () => setBoundsVersion(v => v + 1);
    map.on('moveend', onMove);
    map.on('zoomend', onMove);

    setTimeout(() => { map.invalidateSize(); onMove(); }, 60);

    return () => {
      map.off('moveend', onMove);
      map.off('zoomend', onMove);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when properties change (filters changed externally)
  _useEffect(() => {
    const L = window.L;
    if (!mapRef.current || !L || !layerRef.current) return;
    layerRef.current.clearLayers();
    markersRef.current = {};

    properties.forEach(p => {
      const html = `<div class="zadi-marker ${p.type === 'alquiler' ? 'alquiler' : ''}" data-id="${p.id}">€${fmtPrice(p.price)}<span class="marker-m2">${p.m2}m²</span></div>`;
      const icon = L.divIcon({
        className: 'zadi-marker-wrap',
        html, iconSize: null, iconAnchor: [0, 0],
      });
      const m = L.marker([p.lat, p.lng], { icon, riseOnHover: true });
      m.on('click', () => setActiveId(p.id));
      m.addTo(layerRef.current);
      markersRef.current[p.id] = m;
    });

    // Fit bounds — but only if no active property (avoid jarring jump after open detail)
    if (properties.length > 0 && !activeId && !skipNextFitRef.current) {
      const bounds = L.latLngBounds(properties.map(p => [p.lat, p.lng]));
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 12, animate: false });
      }
    }
    skipNextFitRef.current = false;
  }, [properties]);

  // Highlight active marker + pan (don't refit on activation)
  _useEffect(() => {
    if (!mapRef.current) return;
    Object.entries(markersRef.current).forEach(([id, m]) => {
      const el = m.getElement()?.querySelector('.zadi-marker');
      if (el) el.classList.toggle('active', id === activeId);
    });
    if (activeId) {
      const p = properties.find(x => x.id === activeId);
      if (p) {
        skipNextFitRef.current = true;
        mapRef.current.flyTo([p.lat, p.lng], Math.max(mapRef.current.getZoom(), 13), { duration: 0.6 });
      }
    }
  }, [activeId, properties]);

  // Properties visible in the current viewport (intersect filtered + bounds).
  // boundsVersion is a dependency so this recomputes on every pan/zoom.
  const visibleInMap = _useMemo(() => {
    void boundsVersion;
    const map = mapRef.current;
    if (!map) return properties;
    const b = map.getBounds();
    if (!b) return properties;
    return properties.filter(p => b.contains([p.lat, p.lng]));
  }, [properties, boundsVersion]);

  const activeProperty = _useMemo(
    () => properties.find(p => p.id === activeId),
    [activeId, properties]
  );

  // If the user pans away from the active property, keep it active but it
  // simply won't appear in the side list — that's the expected behavior.

  const resetView = () => {
    const L = window.L;
    if (!mapRef.current || !L || properties.length === 0) return;
    const bounds = L.latLngBounds(properties.map(p => [p.lat, p.lng]));
    if (bounds.isValid()) {
      mapRef.current.flyToBounds(bounds, { padding: [60, 60], maxZoom: 12, duration: 0.5 });
    }
  };

  return (
    <div className="mapview">
      <aside className="maplist" aria-label="Listado lateral">
        <div className="maplist-header">
          <b>
            {visibleInMap.length} {visibleInMap.length === 1 ? 'propiedad visible' : 'propiedades visibles'}
          </b>
          <span>
            {visibleInMap.length < properties.length
              ? `${properties.length - visibleInMap.length} fuera de la vista · `
              : ''}
            Mueve el mapa para descubrir más
          </span>
          {visibleInMap.length < properties.length && (
            <button onClick={resetView} className="btn-text"
              style={{ marginTop: '0.4rem', padding: 0, color: 'var(--accent-ink)' }}>
              Ver todo el catálogo →
            </button>
          )}
        </div>
        {visibleInMap.map(p => (
          <div key={p.id}
            className={`miniprop ${activeId === p.id ? 'active' : ''}`}
            onClick={() => setActiveId(p.id)}
            onDoubleClick={() => onOpen(p)}>
            <div className="miniprop-img">
              <Placeholder tone={p.tone} kind={p.kind} />
              {p.photo && <img src={p.photo} alt="" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />}
            </div>
            <div className="miniprop-body">
              <div className="miniprop-title">{p.title}</div>
              <div className="miniprop-meta">{p.area} · {p.rooms}h · {p.m2}m²</div>
              <div className="miniprop-price">€{fmtPrice(p.price)}{p.type === 'alquiler' && <small style={{fontWeight:500,fontSize:'0.75rem',color:'var(--ink-3)'}}> /mes</small>}</div>
            </div>
          </div>
        ))}
        {visibleInMap.length === 0 && (
          <div style={{ padding: '2rem 0.5rem', textAlign: 'center', color: 'var(--ink-3)' }}>
            <div style={{ fontFamily: 'Syne', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.4rem' }}>
              Nada en esta zona
            </div>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>
              {properties.length > 0 ? 'Aleja el zoom o mueve el mapa.' : 'Ajusta los filtros para ver propiedades.'}
            </p>
            {properties.length > 0 && (
              <button onClick={resetView} className="btn-text" style={{ marginTop: '0.75rem' }}>
                Ver todas ({properties.length}) →
              </button>
            )}
          </div>
        )}
      </aside>
      <div className="map-canvas">
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        {activeProperty && (
          <MapPropertyCard
            p={activeProperty}
            onClose={() => setActiveId(null)}
            onOpen={() => onOpen(activeProperty)}
            fav={favorites.has(activeProperty.id)}
            onFav={onFav}
          />
        )}
      </div>
    </div>
  );
}

// Floating preview card on the map (more controllable than leaflet popup)
function MapPropertyCard({ p, onClose, onOpen, fav, onFav }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: '1.25rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(420px, calc(100% - 2rem))',
      background: 'var(--surface-2)',
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-3)',
      border: '1px solid var(--line)',
      overflow: 'hidden',
      zIndex: 500,
      animation: 'card-in 0.25s cubic-bezier(0.2,0.7,0.3,1)',
      display: 'grid',
      gridTemplateColumns: '140px 1fr',
    }}>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <Placeholder tone={p.tone} kind={p.kind} />
        {p.photo && <img src={p.photo} alt="" loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.target.style.display = 'none'; }} />}
        <span className={`badge ${p.type === 'alquiler' ? 'alquiler' : ''}`} style={{
          top: '0.5rem', left: '0.5rem', fontSize: '0.62rem', padding: '0.2rem 0.5rem',
        }}>
          {p.type === 'compra' ? 'Compra' : 'Alquiler'}
        </span>
      </div>
      <div style={{ padding: '0.85rem 1rem 0.85rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0, position: 'relative' }}>
        <button onClick={onClose} className="icon-btn" style={{
          position: 'absolute', top: '0.4rem', right: '0.4rem',
          width: 28, height: 28, background: 'rgba(255,255,255,0.85)',
        }} aria-label="Cerrar">
          <Icon.Close />
        </button>
        <div className="card-title" style={{ fontSize: '0.95rem', WebkitLineClamp: 2, paddingRight: '1.6rem' }}>{p.title}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--ink-3)' }}><Icon.Pin /> {p.area}</div>
        <div style={{
          fontFamily: 'Syne', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em',
          marginTop: '0.15rem',
        }}>
          €{fmtPrice(p.price)}{p.type === 'alquiler' && <small style={{fontSize:'0.72rem',fontWeight:500,color:'var(--ink-3)'}}> /mes</small>}
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.78rem', color: 'var(--ink-2)', marginTop: '0.2rem' }}>
          <span><Icon.Bed /> {p.rooms}</span>
          <span><Icon.Bath /> {p.baths}</span>
          <span><Icon.Area /> {p.m2}m²</span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.55rem' }}>
          <button className="btn-primary" style={{ flex: 1, height: 36, fontSize: '0.82rem' }} onClick={onOpen}>Ver detalles</button>
          <button className="icon-btn" onClick={() => onFav(p.id)} aria-label="Favorito" data-on={fav}>
            <Icon.Heart filled={fav} />
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MapView });
