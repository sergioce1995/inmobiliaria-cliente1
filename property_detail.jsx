// property_detail.jsx
(function () {
  const { useState } = React;
  const { Icon } = window;
  const fmtEur = window.fmtEur;

  function PropertyDetail({ property, leads = [], visits = [], properties = [], onClose }) {
    const interesados = leads.filter((l) => {
      try {
        const ips = JSON.parse(l.interes_propiedades || '[]');
        if (Array.isArray(ips)) return ips.some((ip) => (typeof ip === 'object' ? ip.id : ip) === property.id);
      } catch {}
      return false;
    });

    const sinContactar = interesados.filter((l) => l.status === 'nuevo');
    const propVisits = visits.filter((v) => v.property_id === property.id);
    const compatibles = window.compatibleLeads ? window.compatibleLeads(property, leads, properties) : [];

    return React.createElement('div', { className: 'card detail', key: property.id },
      React.createElement('div', { className: 'detail-head' },
        React.createElement('div', null,
          React.createElement('h2', { className: 't-h2', style: { margin: 0, marginBottom: 4 } }, property.titulo),
          React.createElement('div', { style: { fontSize: 13, color: 'var(--ink-3)' } }, property.zona || property.ciudad || 'Sin ubicación')
        ),
        onClose && React.createElement('button', { className: 'icon-btn', onClick: onClose },
          React.createElement(Icon, { name: 'close', size: 19 })
        )
      ),
      React.createElement('div', { style: { background: 'linear-gradient(135deg, var(--blue-50) 0%, var(--green-50) 100%)', padding: '16px', margin: '16px 0', borderRadius: 12, border: '1px solid var(--line)' } },
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 } },
          React.createElement('div', { style: { textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: 24, fontWeight: 700, color: 'var(--ink)' } }, interesados.length),
            React.createElement('div', { style: { fontSize: 12, color: 'var(--ink-3)' } }, 'Interesados')
          ),
          React.createElement('div', { style: { textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: 24, fontWeight: 700, color: '#e5544b' } }, sinContactar.length),
            React.createElement('div', { style: { fontSize: 12, color: 'var(--ink-3)' } }, 'Sin contactar')
          ),
          React.createElement('div', { style: { textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: 24, fontWeight: 700, color: 'var(--green)' } }, propVisits.length),
            React.createElement('div', { style: { fontSize: 12, color: 'var(--ink-3)' } }, 'Visitas')
          ),
          React.createElement('div', { style: { textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: 24, fontWeight: 700, color: '#a78bfa' } }, compatibles.length),
            React.createElement('div', { style: { fontSize: 12, color: 'var(--ink-3)' } }, 'Compatibles')
          )
        )
      ),
      React.createElement('div', { className: 'detail-body' },
        React.createElement('p', null, 'Ficha de propiedad: ' + property.titulo),
        React.createElement('p', null, 'Interesados: ' + interesados.length),
        React.createElement('p', null, 'Visitas: ' + propVisits.length),
        React.createElement('p', null, 'Compatibles: ' + compatibles.length)
      )
    );
  }

  window.PropertyDetail = PropertyDetail;
})();
