// icons.jsx — clean 1.6px stroke line icons. Exposed on window.Icon.
// Usage: <Icon name="inbox" size={20} />
(function () {
  const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };

  const paths = {
    inbox: <><path d="M3 13l2.5-7.5A2 2 0 017.4 4h9.2a2 2 0 011.9 1.5L21 13" {...P}/><path d="M3 13h5l1.2 2.4a1 1 0 00.9.6h3.8a1 1 0 00.9-.6L16 13h5v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5z" {...P}/></>,
    contacts: <><path d="M16 19v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 17.5V19" {...P}/><circle cx="10" cy="8" r="3.2" {...P}/><path d="M19.5 19v-1.2a3 3 0 00-2.3-2.9M15.5 5.3a3 3 0 010 5.4" {...P}/></>,
    properties: <><path d="M4 11.5L12 5l8 6.5" {...P}/><path d="M6 10.5V19a1 1 0 001 1h10a1 1 0 001-1v-8.5" {...P}/><path d="M10 20v-4.5a1 1 0 011-1h2a1 1 0 011 1V20" {...P}/></>,
    home: <><path d="M3.5 11L12 4l8.5 7" {...P}/><path d="M5.5 9.7V19a1 1 0 001 1h11a1 1 0 001-1V9.7" {...P}/><path d="M9.5 20v-5a1 1 0 011-1h3a1 1 0 011 1v5" {...P}/></>,
    dashboard: <><path d="M4 14a8 8 0 0116 0" {...P}/><path d="M12 14l3.5-3.5" {...P}/><circle cx="12" cy="14" r="1.3" fill="currentColor" stroke="none"/><path d="M4 18h16" {...P}/></>,
    bell: <><path d="M6.5 10a5.5 5.5 0 0111 0c0 4 1.5 5 1.5 5H5s1.5-1 1.5-5z" {...P}/><path d="M10.2 19a2 2 0 003.6 0" {...P}/></>,
    kit: <><rect x="4" y="4" width="7" height="7" rx="1.6" {...P}/><rect x="13" y="4" width="7" height="7" rx="1.6" {...P}/><rect x="4" y="13" width="7" height="7" rx="1.6" {...P}/><circle cx="16.5" cy="16.5" r="3.5" {...P}/></>,
    search: <><circle cx="11" cy="11" r="6" {...P}/><path d="M20 20l-3.5-3.5" {...P}/></>,
    phone: <path d="M6.5 4h3l1.2 3.5-1.8 1.4a11 11 0 005 5l1.4-1.8L19 17.5V20a1 1 0 01-1.1 1A15 15 0 014 7.1 1 1 0 015 6V4z" {...P}/>,
    mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2.2" {...P}/><path d="M4 7l8 5.5L20 7" {...P}/></>,
    note: <><path d="M5 4.5h14a1 1 0 011 1V18l-3.5 1.5L13 18l-3.5 1.5L6 18l-1 .6V5.5a1 1 0 011-1z" {...P}/><path d="M8.5 9h7M8.5 12.5h4.5" {...P}/></>,
    send: <path d="M5 12l15-7-6 15-2.5-5.5L5 12z" {...P}/>,
    plus: <path d="M12 5v14M5 12h14" {...P}/>,
    chevronDown: <path d="M6 9l6 6 6-6" {...P}/>,
    chevronRight: <path d="M9 6l6 6-6 6" {...P}/>,
    chevronLeft: <path d="M15 6l-6 6 6 6" {...P}/>,
    close: <path d="M6 6l12 12M18 6L6 18" {...P}/>,
    check: <path d="M5 12.5l4.5 4.5L19 7" {...P}/>,
    filter: <path d="M4 6h16M7 12h10M10 18h4" {...P}/>,
    bed: <><path d="M4 8v9M4 12h16v5M20 12v-1.5a2.5 2.5 0 00-2.5-2.5H9" {...P}/><path d="M4 17v1M20 17v1" {...P}/></>,
    bath: <><path d="M5 11V6.5A2 2 0 017 4.5a2 2 0 012 2" {...P}/><path d="M4 11h16v2a4 4 0 01-4 4H8a4 4 0 01-4-4v-2z" {...P}/><path d="M7 17l-1 2M17 17l1 2" {...P}/></>,
    area: <><rect x="4.5" y="4.5" width="15" height="15" rx="1.5" {...P}/><path d="M8 4.5v3M4.5 8h3M16 16.5v3M16.5 16h3" {...P}/></>,
    eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" {...P}/><circle cx="12" cy="12" r="2.6" {...P}/></>,
    share: <><circle cx="6" cy="12" r="2.4" {...P}/><circle cx="17" cy="6" r="2.4" {...P}/><circle cx="17" cy="18" r="2.4" {...P}/><path d="M8.2 11l6.6-3.8M8.2 13l6.6 3.8" {...P}/></>,
    logout: <><path d="M15 16l4-4-4-4M19 12H9" {...P}/><path d="M11 5H6a1 1 0 00-1 1v12a1 1 0 001 1h5" {...P}/></>,
    settings: <><circle cx="12" cy="12" r="3" {...P}/><path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4M17.7 17.7l-1.4-1.4M7.7 7.7L6.3 6.3" {...P}/></>,
    bulb: <><path d="M9 16.5a5 5 0 116 0c-.5.4-.7 1-.7 1.6V19h-4.6v-.9c0-.6-.2-1.2-.7-1.6z" {...P}/><path d="M9.6 21h4.8" {...P}/></>,
    sparkle: <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4z" {...P}/>,
    map: <><path d="M9 5L4 7v12l5-2 6 2 5-2V5l-5 2-6-2z" {...P}/><path d="M9 5v12M15 7v12" {...P}/></>,
    location: <><path d="M12 21s7-5.5 7-11A7 7 0 005 10c0 5.5 7 11 7 11z" {...P}/><circle cx="12" cy="10" r="2.5" {...P}/></>,
    calendar: <><rect x="4" y="5.5" width="16" height="14" rx="2" {...P}/><path d="M4 9.5h16M8.5 3.5v3.5M15.5 3.5v3.5" {...P}/></>,
    clock: <><circle cx="12" cy="12" r="7.5" {...P}/><path d="M12 8v4.2l2.8 1.8" {...P}/></>,
    trend: <><path d="M4 16l4.5-4.5 3 3L20 7" {...P}/><path d="M15 7h5v5" {...P}/></>,
    user: <><circle cx="12" cy="8.5" r="3.5" {...P}/><path d="M5.5 20a6.5 6.5 0 0113 0" {...P}/></>,
    lock: <><rect x="5" y="10.5" width="14" height="9.5" rx="2.2" {...P}/><path d="M8 10.5V8a4 4 0 018 0v2.5" {...P}/><circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none"/></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" {...P}/>,
    dot: <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>,
    grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" {...P}/><rect x="13" y="4" width="7" height="7" rx="1.5" {...P}/><rect x="4" y="13" width="7" height="7" rx="1.5" {...P}/><rect x="13" y="13" width="7" height="7" rx="1.5" {...P}/></>,
    list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" {...P}/>,
    arrowRight: <path d="M5 12h14M13 6l6 6-6 6" {...P}/>,
    euro: <><path d="M16 7.5A5 5 0 008 11a5 5 0 008 3.5" {...P}/><path d="M5 10.5h7M5 13.5h6" {...P}/></>,
    star: <path d="M12 4l2.3 4.7 5.2.8-3.7 3.6.9 5.1L12 16l-4.6 2.4.9-5.1L4.6 9.5l5.2-.8L12 4z" {...P}/>,
    download: <><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5" {...P}/><path d="M5 19h14" {...P}/></>,
    edit: <><path d="M5 19l-.8.8.8-3.6L15.5 6.7a1.8 1.8 0 012.5 0l.3.3a1.8 1.8 0 010 2.5L8 20l-3 .8z" {...P}/></>,
    tag: <><path d="M4 12.5V5.5A1.5 1.5 0 015.5 4h7l7.5 7.5a1.5 1.5 0 010 2.1l-5.9 5.9a1.5 1.5 0 01-2.1 0L4 12.5z" {...P}/><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none"/></>,
    handshake: <><path d="M3 8l3.5-1.5L12 9l5.5-2.5L21 8" {...P}/><path d="M12 9l-3 3a1.5 1.5 0 002.2 2l.8-.8.8.8a1.5 1.5 0 002.2-2L12 9z" {...P}/><path d="M3 8v6a1 1 0 001 1h2M21 8v6a1 1 0 01-1 1h-2" {...P}/></>,
    trash: <><path d="M5 7h14M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7M7 7l.8 12a1 1 0 001 1h6.4a1 1 0 001-1L17 7" {...P}/></>,
  };

  function Icon({ name, size = 20, className = '', style = {} }) {
    const p = paths[name];
    if (!p) return null;
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className}
           style={style} aria-hidden="true">{p}</svg>
    );
  }
  window.Icon = Icon;
})();
