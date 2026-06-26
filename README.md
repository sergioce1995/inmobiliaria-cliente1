# Paula Gutiérrez — Web + CRM Inmobiliario

Web pública (catálogo de propiedades, mapa, captación) + CRM interno (leads, propiedades, captaciones, calendario de visitas, dashboard) para la inmobiliaria de Paula Gutiérrez (Tenerife).

## Stack
- **Backend:** Node.js + Express, SQLite (`pg.db`)
- **Frontend:** React 18 + Babel standalone (sin build), Leaflet (mapa)

## Arranque local
```bash
npm install
npm start          # arranca el servidor en http://localhost:8000
# o, en desarrollo (libera el puerto 8000 antes):
npm run dev
```
- Web pública: `http://localhost:8000/`
- CRM: `http://localhost:8000/crm`

## Notas
- La base de datos (`pg.db`), las imágenes subidas (`public/propiedades/`) y las credenciales no se versionan (ver `.gitignore`). Son datos/secretos locales.
- La integración con Google Sheets/Drive está desactivada; todo se gestiona desde el CRM (SQLite).
