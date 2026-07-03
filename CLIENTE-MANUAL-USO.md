# 📖 ZADI — Manual de Uso

Tu web inmobiliaria está conectada con Google Sheets y Google Drive. Aquí te explicamos cómo usarla.

---

## **📌 Panorama General**

Tu web funciona así:

```
Google Sheet (propiedades)
       ↓
   Web se actualiza automáticamente
       ↓
Clientes ven catálogo + mapa
       ↓
Rellenan formulario
       ↓
Datos aparecen en Google Sheet (interesados)
```

**Tú solo necesitas:**
1. Rellenar el Google Sheet con propiedades
2. Subir imágenes a Google Drive
3. La web se actualiza sola

---

## **1️⃣ AGREGAR UNA NUEVA PROPIEDAD**

### Paso 1: Abre Google Sheet
```
https://docs.google.com/spreadsheets/
Abre: Inmobiliaria
Hoja: Propiedades
```

### Paso 2: Nueva fila
Agrega una fila con:

```
ID Referencia: INM-004 (único, ej: INM-001, INM-002...)
Nombre Propietario: [Tu nombre]
Zona: [Barrio/zona]
Tipo Inmueble: Piso / Casa / Villa / Ático / etc
Habitaciones: 3
Baños: 2
Metros Cuadrados: 110
Ascensor: Sí / No
Precio Propietario (€): 400000
Precio Venta (€): 495000
Comisión Agente (%): 5
Comisión en €: [automático]
Estado: Disponible / Vendido / Alquilado
Observaciones: Descripción de la propiedad
Dirección: Calle X, número, código postal, ciudad
```

### Paso 3: Crear carpeta de imágenes en Drive

1. Abre Google Drive
2. Dentro de `Tito-Propiedades`
3. Crea una carpeta: `INM-004` (mismo ID que en el Sheet)
4. Dentro, crea: `IMAGENES`
5. Sube las fotos

Estructura:
```
Tito-Propiedades/
  └─ INM-004/
      └─ IMAGENES/
          ├─ foto1.jpg
          ├─ foto2.jpg
          └─ foto3.jpg
```

### Paso 4: Espera 30 segundos
La web se actualiza automáticamente. Tu propiedad ya aparece en:
- Listado de propiedades
- Mapa interactivo
- Formulario de interés

---

## **2️⃣ EDITAR UNA PROPIEDAD**

1. Abre Google Sheet
2. Encuentra la fila de la propiedad (ID Referencia)
3. Modifica los datos que quieras
4. Guarda automáticamente
5. La web se actualiza en 30 segundos

---

## **3️⃣ ELIMINAR UNA PROPIEDAD**

### En Google Sheet:
1. Abre la hoja "Propiedades"
2. Click derecho en la fila
3. "Eliminar fila"

### En Google Drive:
1. Abre `Tito-Propiedades`
2. Elimina la carpeta con el ID de la propiedad (ej: `INM-004`)

**Listo.** La propiedad desaparece de la web automáticamente.

---

## **4️⃣ VER INTERESADOS**

Los clientes que rellenan el formulario "Estoy interesado" aparecen aquí:

1. Abre Google Sheet
2. Hoja: `Interesados`
3. Verás:
   - **Fecha:** Cuándo se registraron
   - **Nombre y Apellidos:** Del cliente
   - **Email:** Para contactar
   - **Teléfono:** Para llamar
   - **Inmueble:** Qué propiedad les interesó
   - **Visita:** Cuándo visitará (si está anotado)
   - **Contactado:** Sí/No (tú lo rellenas cuando contactes)

---

## **5️⃣ SUBIR IMÁGENES**

### Paso 1: Abre Google Drive
```
https://drive.google.com/
Carpeta: Tito-Propiedades
Subcarpeta: [ID de la propiedad]
```

### Paso 2: Dentro de IMAGENES
1. Haz click en el botón **"+ Nuevo"**
2. Selecciona **"Subir archivos"**
3. Elige las fotos de tu ordenador
4. Listo, se suben automáticamente

**Formatos soportados:** JPG, PNG, GIF, WebP

**Tamaño máximo:** 25 MB por imagen

---

## **6️⃣ COSAS QUE DEBES SABER**

### ✅ La web se actualiza automáticamente
- Si cambias un dato en el Sheet → la web se actualiza en 30 segundos
- Si subes una imagen en Drive → aparece en la web automáticamente
- No necesitas tocar código ni hacer nada técnico

### ✅ Todos los datos están seguros
- Todo está en tu Google Drive (no tú cuenta personal)
- Solo tú tienes acceso
- Los datos se sincronizan en tiempo real

### ✅ El mapa funciona automáticamente
- La web convierte automáticamente la dirección a ubicación en el mapa
- Ejemplo: `Calle X, 10, 38001 Santa Cruz` → aparece marcado en el mapa

### ⚠️ Cosas importantes
- El `ID Referencia` debe ser único (INM-001, INM-002, etc)
- El nombre de la carpeta en Drive debe coincidir con el `ID Referencia`
- La columna "Dirección" debe ser completa (calle + número + ciudad)

---

## **7️⃣ TROUBLESHOOTING**

### "Mi propiedad no aparece en la web"
1. ✅ ¿Está rellenada toda la información en el Sheet?
2. ✅ ¿El ID Referencia es único?
3. ✅ ✅ ¿La carpeta en Drive coincide con el ID?
4. Espera 30 segundos y recarga la página (Ctrl+F5)

### "Las imágenes no se ven"
1. ✅ ¿Están en la carpeta correcta? `Tito-Propiedades/[ID]/IMAGENES/`
2. ✅ ¿Son JPG o PNG?
3. ✅ ¿No pesan más de 25 MB?

### "El mapa muestra una ubicación incorrecta"
1. Revisa que la dirección esté bien escrita
2. Agrega más detalles si es necesario
3. Recarga la página

---

## **💬 ¿Necesitas ayuda?**

Contacta al equipo técnico si:
- La web no se actualiza después de 2 minutos
- Las imágenes no se ven
- Hay un error en la web

Cuéntanos qué pasó y cuál es el ID de la propiedad afectada.

---

## **✨ Resumen rápido**

```
Agregar propiedad:
1. Rellena fila en Sheet
2. Crea carpeta en Drive
3. Sube imágenes
4. Listo ✅

Editar propiedad:
1. Modifica datos en Sheet
2. La web se actualiza sola ✅

Eliminar propiedad:
1. Borra fila en Sheet
2. Elimina carpeta en Drive
3. Listo ✅
```

---

**¡Disfruta tu web inmobiliaria! 🏠**
