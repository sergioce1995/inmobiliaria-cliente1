// components.jsx — shared UI kit. Exports components to window.
(function () {
  const { useState, useEffect, useRef } = React;
  const Icon = window.Icon;

  // ---------- Button ----------
  function Button({ variant = 'primary', size, icon, iconRight, children, className = '', ...rest }) {
    const cls = `btn btn-${variant}${size ? ' ' + size : ''} ${className}`;
    return (
      <button className={cls} {...rest}>
        {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
        {children}
        {iconRight && <Icon name={iconRight} size={size === 'sm' ? 16 : 18} />}
      </button>
    );
  }

  function IconButton({ name, size = 19, bordered, className = '', ...rest }) {
    return (
      <button className={`icon-btn${bordered ? ' bordered' : ''} ${className}`} {...rest}>
        <Icon name={name} size={size} />
      </button>
    );
  }

  // ---------- Badge ----------
  const STATUS_LABEL = { nuevo: 'Nuevo', contactado: 'Contactado', visita: 'Visita', negociacion: 'Negociación', cerrado: 'Cerrado', perdido: 'Perdido' };
  function StatusBadge({ status, pulse }) {
    return (
      <span className={`badge badge-${status}${pulse && status === 'nuevo' ? ' pulse' : ''}`}>
        <span className="bdot" />{STATUS_LABEL[status] || status}
      </span>
    );
  }

  // ---------- Avatar ----------
  function Avatar({ name, color = '#2E75B6', size = 38 }) {
    const initials = (name || '?').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    return (
      <span className="avatar" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
        {initials}
      </span>
    );
  }

  // ---------- Input ----------
  function Input({ label, icon, error, className = '', textarea, ...rest }) {
    const El = textarea ? 'textarea' : 'input';
    return (
      <div className="field">
        {label && <label>{label}</label>}
        <div className="input-wrap">
          {icon && <span className="ic-left"><Icon name={icon} size={18} /></span>}
          <El className={`input${icon ? ' has-left' : ''}${error ? ' error' : ''} ${className}`} {...rest} />
        </div>
        {error && <span className="field-error"><Icon name="close" size={13} />{error}</span>}
      </div>
    );
  }

  // ---------- Floating-label input (login) ----------
  function FloatInput({ label, type = 'text', value, onChange, icon, ...rest }) {
    return (
      <div className="fl">
        <input type={type} value={value} onChange={onChange} placeholder=" "
               className={value ? 'filled' : ''} {...rest} />
        <label>{label}</label>
        <span className="underline" />
      </div>
    );
  }

  // ---------- Select ----------
  function Select({ value, onChange, options, className = '', ...rest }) {
    return (
      <span className="select-wrap">
        <select className={`select ${className}`} value={value} onChange={onChange} {...rest}>
          {options.map((o) => (
            <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
          ))}
        </select>
        <Icon name="chevronDown" size={16} />
      </span>
    );
  }

  // ---------- Toggle ----------
  function Toggle({ on, onChange, blue }) {
    return <button className={`toggle${on ? ' on' : ''}${blue ? ' blue' : ''}`} onClick={() => onChange(!on)} aria-pressed={on} />;
  }

  // ---------- Tabs ----------
  function Tabs({ value, onChange, options }) {
    return (
      <div className="tabs">
        {options.map((o) => (
          <button key={o.value ?? o} className={`tab${(o.value ?? o) === value ? ' active' : ''}`}
                  onClick={() => onChange(o.value ?? o)}>{o.label ?? o}</button>
        ))}
      </div>
    );
  }

  // ---------- Tooltip ----------
  function Tooltip({ label, children, wide }) {
    return <span className="tip">{children}<span className={`tip-bubble${wide ? ' wide' : ''}`}>{label}</span></span>;
  }

  // ---------- Modal ----------
  function Modal({ open, onClose, children, width }) {
    useEffect(() => {
      if (!open) return;
      const h = (e) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', h);
      return () => window.removeEventListener('keydown', h);
    }, [open, onClose]);
    if (!open) return null;
    return (
      <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal" style={width ? { maxWidth: width } : null}>{children}</div>
      </div>
    );
  }

  // ---------- Toast ----------
  function useToasts() {
    const [toasts, setToasts] = useState([]);
    const push = (msg) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, msg }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
    };
    const node = (
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            <span className="tcheck"><Icon name="check" size={14} /></span>{t.msg}
          </div>
        ))}
      </div>
    );
    return [push, node];
  }

  // ---------- Spinner ----------
  function Spinner({ dark }) { return <span className={`spinner${dark ? ' dark' : ''}`} />; }

  Object.assign(window, {
    Button, IconButton, StatusBadge, Avatar, Input, FloatInput, Select,
    Toggle, Tabs, Tooltip, Modal, useToasts, Spinner, STATUS_LABEL,
  });
})();
