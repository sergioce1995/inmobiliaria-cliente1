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

    const sinContactar = interesados.filter((l) => l.estado === 'nuevo');
    const propVisits = visits.filter((v) => v.property_id === property.id);
    const conVisita = propVisits.filter((v) => v.status !== 'cancelada');
    const sinVisita = interesados.filter((l) => !conVisita.some((v) => v.lead_id === l.id));
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
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 0 } },
          React.createElement('div', { style: { textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: 20, fontWeight: 700, color: 'var(--ink)' } }, sinContactar.length),
            React.createElement('div', { style: { fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 } }, 'Sin contactar'),
            React.createElement('button', { style: { fontSize: 12, fontWeight: 600, color: '#e5544b', border: 'none', background: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' } }, 'Contactar →')
          ),
          React.createElement('div', { style: { textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: 20, fontWeight: 700, color: '#f59e0b' } }, sinVisita.length),
            React.createElement('div', { style: { fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 } }, 'Sin visita'),
            React.createElement('button', { style: { fontSize: 12, fontWeight: 600, color: '#f59e0b', border: 'none', background: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' } }, 'Agendar →')
          ),
          React.createElement('div', { style: { textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: 20, fontWeight: 700, color: 'var(--green)' } }, conVisita.length),
            React.createElement('div', { style: { fontSize: 11, color: 'var(--ink-3)' } }, 'Con visita')
          ),
          React.createElement('div', { style: { textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: 20, fontWeight: 700, color: '#a78bfa' } }, compatibles.length),
            React.createElement('div', { style: { fontSize: 11, color: 'var(--ink-3)' } }, 'Compatibles')
          )
        )
      ),
      React.createElement('div', { className: 'detail-body' },
        React.createElement('div', { style: { marginBottom: 24 } },
          React.createElement('h3', { style: { fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: '0 0 12px' } }, 'Interesados registrados'),
          interesados.length > 0
            ? React.createElement('ul', { style: { margin: 0, padding: '0 0 0 20px', fontSize: 13, color: 'var(--ink-2)' } },
                interesados.slice(0, 5).map((l) =>
                  React.createElement('li', { key: l.id, style: { marginBottom: 6 } },
                    l.nombre, ' · ', React.createElement('span', { style: { fontSize: 12, color: 'var(--ink-3)' } }, l.estado || 'sin estado')
                  )
                ),
                interesados.length > 5 && React.createElement('li', { style: { color: 'var(--ink-4)', fontStyle: 'italic' } }, '... y ' + (interesados.length - 5) + ' más')
              )
            : React.createElement('p', { style: { margin: 0, fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic' } }, 'Sin interesados registrados aún')
        ),
        React.createElement('div', { style: { padding: '14px', background: 'linear-gradient(135deg, #f3f0ff 0%, #fef3c7 100%)', borderRadius: 10, border: '1px solid var(--line)' } },
          React.createElement('h3', { style: { fontSize: 14, fontWeight: 700, color: '#a78bfa', margin: '0 0 8px' } }, '✨ Contactos compatibles'),
          compatibles.length > 0
            ? React.createElement('ul', { style: { margin: 0, padding: '0 0 0 20px', fontSize: 13, color: 'var(--ink-2)' } },
                compatibles.slice(0, 5).map((l) =>
                  React.createElement('li', { key: l.id, style: { marginBottom: 6 } },
                    l.nombre, ' · ', React.createElement('span', { style: { fontSize: 12, color: 'var(--ink-3)' } }, 'perfil estimado')
                  )
                ),
                compatibles.length > 5 && React.createElement('li', { style: { color: 'var(--ink-4)', fontStyle: 'italic' } }, '... y ' + (compatibles.length - 5) + ' más')
              )
            : React.createElement('p', { style: { margin: 0, fontSize: 13, color: 'var(--ink-3)' } }, 'Aquí se mostrarán los contactos de tu base de datos que puedan ser compatibles con esta propiedad.')
        )
      )
    );
  }

  window.PropertyDetail = PropertyDetail;
})();
