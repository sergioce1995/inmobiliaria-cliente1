# 📋 ZADI — Setup Inicial (30 minutos)

Bienvenido. Esta guía te ayudará a configurar tu web inmobiliaria con ZADI.

**Prerequisitos:**
- Cuenta Google (Gmail)
- Acceso a Google Drive
- Acceso a Google Cloud Console

---

## **PASO 1: Crear Proyecto en Google Cloud**

### 1.1 Ir a Google Cloud Console
```
https://console.cloud.google.com/
```

### 1.2 Crear nuevo proyecto
1. Click en **"Seleccionar un proyecto"** (arriba)
2. Click en **"NUEVO PROYECTO"**
3. Nombre: `ZADI [Tu Inmobiliaria]`
4. Click en **"CREAR"**
5. Espera a que se cree (1-2 minutos)

### 1.3 Activar APIs necesarias
1. Ve a **"APIs y servicios"** → **"Biblioteca"**
2. Busca y activa:
   - **Google Sheets API**
   - **Google Drive API**
   - **Geocoding API**

(Busca cada una y click en "Activar")

---

## **PASO 2: Crear Service Account**

### 2.1 Crear credenciales
1. Ve a **"APIs y servicios"** → **"Credenciales"**
2. Click en **"+ CREAR CREDENCIALES"**
3. Selecciona **"Cuenta de servicio"**

### 2.2 Rellenar formulario
1. **Nombre de la cuenta:**
   ```
   zadi-[tu-inmobiliaria]
   ```

2. **Descripción:**
   ```
   API para conectar Drive y Sheets con web inmobiliaria
   ```

3. Click en **"CREAR Y CONTINUAR"**

### 2.3 Agregar permisos
1. **Rol:** Selecciona **"Editor"**
2. Click en **"CONTINUAR"**
3. Click en **"CREAR CLAVE"**
4. Formato: **"JSON"**
5. Click en **"CREAR"**

Se descargará un archivo `[nombre]-[id].json`. **Guárdalo en un lugar seguro.**

---

## **PASO 3: Preparar Google Sheet**

### 3.1 Crear Google Sheet
1. Ve a https://docs.google.com/spreadsheets/
2. Click en **"+ CREAR"**
3. Nombre: `Inmobiliaria`

### 3.2 Crear 2 hojas
1. Renombra la primera hoja a: `Propiedades`
2. Crea una segunda hoja: `Interesados`

### 3.3 Estructura Hoja "Propiedades"
Copia estas columnas exactamente (en orden):

```
A: ID Referencia
B: Nombre Propietario
C: Zona
D: Tipo Inmueble
E: Habitaciones
F: Baños
G: Metros Cuadrados
H: Ascensor
I: Precio Propietario (€)
J: Precio Venta (€)
K: Comisión Agente (%)
L: Comisión en €
M: Estado
N: Observaciones
O: Dirección
```

### 3.4 Estructura Hoja "Interesados"
Copia estas columnas:

```
A: Fecha
B: Nombre
C: Apellidos
D: Email
E: Teléfono
F: Inmueble
G: Visita
H: Contactado
```

(Se rellenará automáticamente cuando interesados completen el formulario en la web)

---

## **PASO 4: Agregar ejemplo de propiedad**

En la hoja "Propiedades", primera fila de datos:

```
ID Referencia: INM-001
Nombre Propietario: [Tu nombre]
Zona: Santa Cruz
Tipo Inmueble: Piso
Habitaciones: 3
Baños: 2
Metros Cuadrados: 110
Ascensor: Sí
Precio Propietario (€): 400000
Precio Venta (€): 495000
Comisión Agente (%): 5
Comisión en €: 24750
Estado: Disponible
Observaciones: Ático luminoso con terraza
Dirección: C. de Fernando Primo de Rivera, 60, 38006 Santa Cruz de Tenerife
```

---

## **PASO 5: Preparar Google Drive**

### 5.1 Crear estructura de carpetas
En tu Google Drive, crea esta estructura:

```
Tito-Propiedades/
  ├─ INM-001/
  │   └─ IMAGENES/
  │       ├─ foto1.jpg
  │       └─ foto2.jpg
  ├─ INM-002/
  │   └─ IMAGENES/
  │       └─ foto.jpg
  └─ INM-003/
      └─ IMAGENES/
          └─ foto.jpg
```

**Importante:** El nombre de la carpeta principal (`INM-001`, `INM-002`, etc) debe coincidir con el `ID Referencia` del Sheet.

### 5.2 Subir imágenes
1. Para cada propiedad (INM-001, INM-002, etc)
2. Crea carpeta: `IMAGENES`
3. Sube las fotos allí

---

## **PASO 6: Compartir con ZADI**

### 6.1 Obtener email de servicio
Abre el archivo JSON que descargaste en el Paso 2.2, busca la línea:
```
"client_email": "..."
```

Copia ese email (algo como: `zadi-xxx@xxx.iam.gserviceaccount.com`)

### 6.2 Compartir Google Sheet
1. Abre tu Sheet "Inmobiliaria"
2. Click en **"Compartir"** (arriba derecha)
3. Pega el email del servicio
4. Permiso: **"Editor"**
5. Click en **"Compartir"**

### 6.3 Compartir Google Drive
1. Abre tu carpeta **"Tito-Propiedades"** en Drive
2. Click derecho → **"Compartir"**
3. Pega el email del servicio
4. Permiso: **"Editor"**
5. Click en **"Compartir"**

---

## **PASO 7: Entregar a ZADI**

Envía estos datos al equipo técnico:

1. El archivo JSON descargado (Paso 2.2)
2. ID del Google Sheet
   - Está en la URL: `https://docs.google.com/spreadsheets/d/[ESTE_ID]/edit`
3. ID de la carpeta Drive "Tito-Propiedades"
   - Está en la URL: `https://drive.google.com/drive/folders/[ESTE_ID]`

Nosotros configuraremos tu web y te la entregaremos lista.

---

## **¿Listo?**

Tu web estará en vivo en `https://[tunombre].zadi.es`

Ahora puedes:
- ✅ Agregar/eliminar propiedades (rellena el Sheet)
- ✅ Subir imágenes (en las carpetas de Drive)
- ✅ Ver interesados (en la hoja "Interesados")
- ✅ Todo se actualiza automáticamente

**¿Preguntas?** Consulta el manual de uso.
