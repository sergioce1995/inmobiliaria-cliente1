# Prompt para Claude Code — Aplicar el diseño de ZADI CRM a mi CRM real

Copia y pega lo siguiente en Claude Code, junto con los archivos de esta carpeta.

---

## Contexto

Tengo **dos cosas**:

1. **Mi CRM actual (este repositorio).** Funciona: ya está conectado con la web del cliente,
   tiene la integración real, y le he cargado **propiedades reales del cliente** y datos reales.
   El problema es que **el diseño es muy básico**.

2. **Un prototipo de diseño de alta fidelidad** (los archivos que adjunto: `ZADI CRM.html`,
   `styles.css`, `components.css`, `app.css`, `screens.css`, y los `.jsx` / `.js`).
   Es un CRM inmobiliario muy bien diseñado, pero con **datos de prueba inventados**.

## Lo que quiero

**Quédate con el DISEÑO del prototipo y aplícalo a mi CRM real.** Es decir:

- Adopta toda la **identidad visual** del prototipo: paleta de colores, tipografía, espaciados,
  sombras, radios, componentes (botones, inputs, badges, tarjetas, modales, tablas, toggles,
  cajones/drawers), la barra lateral, el header, los gráficos y las micro-interacciones.
- Aplica ese diseño a **mis pantallas reales**, que se alimentan de **mis datos reales** y de la
  integración con la web que ya tengo montada. **No uses los datos del prototipo.**
- **Elimina por completo los datos de prueba** del prototipo (todo lo que hay en `data.js`:
  leads, contactos, propiedades, valoraciones, analíticas, notificaciones inventadas).
- **La base de datos debe quedar limpia / conectada a la real.** Las propiedades que se vean
  deben ser **las que ya tiene el cliente en mi CRM**, no las de ejemplo. Lo mismo con leads,
  contactos y captaciones: vienen de mi backend real, no del archivo de prueba.

**Resumen:** el prototipo aporta el "cómo se ve" y el "cómo se comporta"; mi CRM aporta los datos,
la base de datos y la integración. Une ambos.

## Cómo está hecho el prototipo (para que sepas portarlo, no copiarlo tal cual)

Es un prototipo, así que está montado de forma sencilla y **debes adaptarlo a mi stack real**:

- **React 18 vía Babel en el navegador** (`<script type="text/babel">`) y componentes colgados de
  `window`. En mi proyecto real, **conviértelo a componentes React normales** (con imports/exports,
  build con Vite/Next/CRA o el que yo use) en vez de globals de `window` y Babel en runtime.
- **Estado simulado con `useState`** sembrado desde `data.js`. Sustitúyelo por **mi capa de datos
  real** (llamadas a mi API / base de datos, hooks de fetching, store, etc.).
- **Mapa de archivos del prototipo**:
  - `styles.css` → **design tokens** (variables CSS de color, tipografía, sombras, radios, espaciado,
    animaciones). Es la base del sistema visual: pórtalo tal cual.
  - `components.css` + `components.jsx` → **UI kit** (Button, IconButton, Input, Select, Toggle,
    Tabs, Badge, Avatar, Tooltip, Modal, Toast, Spinner).
  - `app.css` + `app.jsx` → **shell**: barra lateral colapsable, header, navegación entre pantallas,
    panel de Tweaks (el panel de Tweaks es solo para el prototipo; **puedes eliminarlo**).
  - `screens.css` → estilos de cada pantalla.
  - `icons.jsx` → set de iconos SVG de línea (`<Icon name="…">`).
  - `charts.jsx` → **gráficos hechos a mano en SVG** (sparkline, donut, embudo, barras, barras
    horizontales). Sin dependencias. Pórtalos o cámbialos por mi librería de charts si prefiero.
  - Pantallas: `screen_login.jsx`, `screen_inbox.jsx` (bandeja de leads + detalle),
    `screen_contacts.jsx` (base de datos: tabla + filtros + drawer de detalle),
    `screen_properties.jsx` (cartera + compartir + comisión), `screen_dashboard.jsx`
    (Rendimiento + Operaciones e ingresos con multifiltro interactivo + simulador),
    `screen_valoraciones.jsx` (**Captación**: solicitudes de "Vende tu propiedad"),
    `screen_notifications.jsx`, `screen_uikit.jsx` (catálogo de componentes; **opcional, puedes
    omitirlo** en producción).
  - `lead_detail.jsx` → panel de detalle de lead compartido (bandeja + base de datos).
  - `data.js` → **DATOS DE PRUEBA. ELIMÍNALO** y enchufa mis datos reales.
  - `image-slot.js` → hueco de imagen para fotos de propiedad (en producción usa mi subida de fotos).

## Funcionalidades de diseño que quiero conservar (con MIS datos)

1. **Bandeja de leads**: tarjetas con color por estado, ordenar/filtrar por estado, panel de detalle
   con historial de interacciones, cambio de estado y añadir notas.
2. **Base de datos**: tabla moderna con búsqueda, filtros (ciudad, presupuesto, **estado**), orden
   por columnas, y **clic en fila → cajón de detalle** con cambio de estado manual.
   (Estado del lead unificado y compartido entre Bandeja y Base de datos.)
3. **Propiedades**: grid con precio, specs, **comisión (% y €)**, indicador de publicada en web,
   y "Compartir con lead". Aquí deben salir **las propiedades reales del cliente**.
4. **Captación** (Vende tu propiedad): solicitudes de valoración como propiedades pendientes, con
   estados pendiente→valorada→captada→descartada, valoración estimada y "Captar propiedad".
5. **Dashboard IA**: pestaña **Rendimiento** (embudo, fuentes, tendencia, sugerencias accionables
   que navegan a la base de datos filtrada, simulador de ingresos por comisión) y pestaña
   **Operaciones e ingresos** (herramienta de análisis con **multifiltro combinable** por régimen
   /tipo/zona/mes, gráficos donde haces clic para filtrar, y tabla de detalle). Conéctalo a mis
   operaciones reales.
6. **Notificaciones**, **login** y el **sistema de UI** (colores/tipografía/componentes).

## Importante

- **No rompas mi integración con la web ni mi base de datos.** Solo cambia la capa visual y conéctala
  a mis datos. Si una pantalla del prototipo no tiene equivalente en mis datos, déjala preparada pero
  vacía (con su *empty state*), no la rellenes con datos inventados.
- Respeta accesibilidad (contraste, focus, tamaños de toque) y que sea responsive.
- Pregúntame por mi stack (framework, gestor de estado, forma de las APIs) antes de decidir cómo
  portar los componentes, si no queda claro en el repositorio.

Empieza proponiéndome un **plan de migración** (qué archivos creas, cómo mapeas mis datos a cada
pantalla y qué del prototipo descartas) antes de tocar código.
