# ZADI CRM — Integración con la web y los portales

Notas para pasarle a Claude Code (o a tu equipo de desarrollo) cuando construyáis el backend real.
El prototipo actual es solo la interfaz; aquí va cómo conectar los datos de verdad.

---

## 1. Resumen de cómo encaja todo

El **CRM es la fuente de la verdad**. Tanto la web pública de ZADI como los portales leen/escriben
contra el mismo backend. Hay tres flujos:

| Flujo | Dirección | ¿Viable? | Cómo |
|---|---|---|---|
| Lead "Estoy interesado" en la web | Web → CRM | ✅ Fácil | La web hace POST a la API del CRM al enviar el formulario |
| Publicar tus propiedades | CRM → Web | ✅ Fácil | La web lee las propiedades desde la misma base de datos / API del CRM |
| Publicar tus propiedades en portales | CRM → Idealista / Fotocasa | ✅ Medio | Feed XML estándar o API del portal |
| Recibir leads de portales | Idealista / Fotocasa → CRM | ✅ Medio | API de leads del portal o parseo del email de aviso |
| Importar propiedades de OTROS (que no son tuyas) | Portales → CRM | ⚠️ No recomendable | Requiere scraping; frágil y normalmente contra los términos del portal |

**Conclusión práctica (lo que tú propones, y es correcto):**
- Mete **todas tus propiedades en el CRM**. El CRM las publica en la web y en los portales.
- Para **redes sociales**: el post de Instagram lleva a la ficha de la web → ahí el usuario pulsa
  "Estoy interesado" → entra como lead al CRM. No hace falta "conectar" Instagram técnicamente.
- **No** intentes traer al CRM propiedades publicadas por terceros en otros sitios: eso sí es
  complicado y poco fiable. El CRM gestiona TU cartera, no la de otros.

---

## 2. ¿Una propiedad que añado en el CRM aparece sola en la web?

**Sí, si se construye así:** la web no tiene su propia base de datos de propiedades, sino que
**lee la del CRM**. Cuando creas una propiedad y subes fotos en el CRM:

1. Se guarda en la base de datos (con un campo `publicada_en_web: true/false`).
2. La web pública consulta `GET /api/propiedades?publicada=true` y la muestra al instante.
3. El mismo registro alimenta el feed para portales.

Así, el alta es **una sola vez** y aparece en web (y opcionalmente en portales) automáticamente.
En el prototipo ya verás en cada propiedad un indicador **"Web"** (verde = publicada) para reflejar
este campo.

---

## 2bis. "Vende tu propiedad" (captación) — Web → CRM

La web tiene un apartado **"Vende tu propiedad / Solicitar valoración"** donde un PROPIETARIO
(no un comprador) rellena un formulario: nombre, teléfono, email, dirección, tipo de inmueble
(piso, ático, villa, chalet, local, garaje, terreno…), m²/habitaciones y notas adicionales.

Estas solicitudes **no son leads de compra ni propiedades confirmadas todavía**, así que entran al
CRM en una bandeja propia: **Captación** (estado inicial `pendiente`). El flujo de estados es:

`pendiente` → `valorada` (le mandas tu valoración) → `captada` (acepta, firma encargo) → pasa a
**Propiedades** como cartera vuestra. O `descartada` si no encaja.

En el CRM (pantalla **Captación**) el agente: revisa la solicitud, contacta al propietario,
**introduce una valoración estimada**, cambia el estado y, cuando el propietario acepta, pulsa
**"Captar propiedad"** para convertirla en una propiedad de cartera (lista para subir fotos y publicar).

**Integración (igual de fácil que el "Estoy interesado"):** el formulario de la web hace
`POST /api/captaciones` con los campos del propietario + inmueble. El registro entra como
`estado: "pendiente"`. Es el mismo mecanismo que el lead de compra, solo que va a otra tabla/bandeja.

---

## 3. Portales: cómo se conecta de verdad

- **Publicar (salida):** los portales aceptan un **feed** de tus inmuebles. Lo habitual es generar
  un XML en el formato del portal (Idealista, Fotocasa) o usar un **agregador/feed estándar**
  (p. ej. el formato de Inmovilla / Resales Online) que reenvía a varios portales a la vez.
  El CRM genera ese feed periódicamente con tus propiedades marcadas como "publicar en portales".
- **Recibir leads (entrada):** cuando alguien contacta desde Idealista/Fotocasa, el portal te avisa.
  Dos vías: (a) la **API de leads** del portal (si tu plan la incluye) que el CRM consulta por webhook;
  (b) **parsear el email** de notificación del portal y crear el lead automáticamente. En ambos casos
  el lead entra con `origen: "Idealista"` / `"Fotocasa"`, como ya se ve en el CRM.

---

## 4. Cómo cargan sus propiedades (importación masiva + alta manual)

La inmobiliaria debe tener **las dos opciones, no una u otra**:

### A) Carga rápida masiva (para arrancar con toda la cartera de golpe)
Pensado para inmobiliarias que YA tienen sus inmuebles en otro sitio. De mejor a peor:

| Método | ¿Incluye fotos? | Notas |
|---|---|---|
| Importar **feed XML** que ya envían a portales | ✅ Sí (URLs en el feed → el CRM las descarga) | Lo ideal. Toda la cartera en un clic |
| Importar export de su **gestor actual** (Inmovilla, Witei…) | ✅ Normalmente sí | XML/CSV estándar con URLs de imagen |
| Subir **CSV / Excel** | ⚠️ Solo si hay columna con URLs de foto; si no, fotos a mano | Para quien solo tiene una hoja de cálculo |

Flujo de la importación masiva en el CRM:
1. Pantalla "Importar propiedades" → subir archivo (XML/CSV) o pegar la URL del feed.
2. **Mapeo de campos**: el CRM muestra una previsualización y deja emparejar columnas
   (precio, zona, m², fotos, etc.) antes de confirmar.
3. **Descarga de imágenes**: si el feed/export trae URLs de fotos, el CRM las baja y las guarda
   automáticamente. Si no hay URLs, la propiedad entra sin fotos y se marca "faltan fotos".
4. **Deduplicación** por referencia de inmueble, para no duplicar al reimportar.

### B) Alta manual (para inmuebles nuevos del día a día)
Formulario de "Añadir propiedad" en el CRM: rellenar datos + **subir fotos arrastrando** (como los
huecos de imagen del prototipo). Es el camino normal una vez hecha la importación inicial.

> ⚠️ No usar scraping de los anuncios publicados en Idealista/web. Importar siempre desde el
> **origen de los datos** (su gestor o su feed), no desde el anuncio.

---

## 5. Prompt para Claude Code

> Construye el backend del CRM inmobiliario ZADI. El frontend ya existe (React). Necesito:
>
> **Modelo de datos** (PostgreSQL): `leads` (nombre, email, tel, ciudad, presupuesto, origen,
> estado [nuevo|contactado|interesado|cerrado], propiedad_id, score, created_at, interacciones[]),
> `propiedades` (titulo, zona, ciudad, precio, comision_pct, hab, banos, m2, estado, publicada_web,
> publicada_portales, fotos[], views, shares), `interacciones` (lead_id, tipo [llamada|email|nota],
> texto, fecha).
>
> **API REST**:
> - `POST /api/leads` — alta de lead desde el formulario "Estoy interesado" de la web. Debe
>   asociar el lead a la `propiedad_id` que estaba viendo y ponerlo en estado `nuevo`.
> - `POST /api/captaciones` — alta desde el formulario "Vende tu propiedad / Solicitar valoración".
>   Guarda los datos del propietario + inmueble en estado `pendiente`. Endpoint `PUT` para fijar
>   `valor_estimado` y cambiar estado (`pendiente`→`valorada`→`captada`/`descartada`). Al pasar a
>   `captada`, crear el registro en `propiedades` (sin publicar todavía) a partir de la captación.
> - `GET /api/propiedades?publicada_web=true` — lo que consume la web pública.
> - `GET/POST/PUT /api/propiedades` — gestión desde el CRM (incluida subida de fotos a S3/Cloudinary).
>   Al crear/editar con `publicada_web=true`, la web debe reflejarlo sin paso manual.
> - `PUT /api/leads/:id` — cambiar estado y añadir notas.
>
> **Carga de propiedades (DOS vías obligatorias)**:
> - **Importación masiva**: endpoint `POST /api/propiedades/import` que acepte un **feed XML**
>   (formato Idealista/Fotocasa o agregador) o un **CSV**. Debe: previsualizar y mapear columnas,
>   **descargar automáticamente las imágenes** desde las URLs del feed a S3/Cloudinary, y
>   **deduplicar por referencia** de inmueble. Si el CSV no trae URLs de foto, crear la propiedad
>   sin fotos y marcarla "faltan fotos".
> - **Alta manual**: `POST /api/propiedades` con formulario y subida de fotos por arrastre.
>
> **Integración con portales**:
> - Generador de **feed XML** de propiedades con `publicada_portales=true`, en el formato de
>   Idealista y Fotocasa (o vía agregador estándar). Cron que lo regenera al cambiar la cartera.
> - **Ingesta de leads de portales**: endpoint webhook `POST /api/leads/portal` para la API de leads
>   del portal, y/o un parser del email de aviso (Idealista/Fotocasa) que cree el lead con el `origen`
>   correcto. Deduplicar por email/teléfono.
>
> **Importante**: el CRM es la única fuente de la verdad de las propiedades. La web NO tiene BD propia.
> No implementes scraping de propiedades de terceros.
>
> Entrega: esquema de BD + migraciones, los endpoints, el importador masivo (con descarga de
> imágenes), el generador de feed y el webhook de leads, con tests básicos.
