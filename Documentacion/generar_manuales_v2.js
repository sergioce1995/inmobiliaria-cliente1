const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
         AlignmentType, BorderStyle, WidthType, ShadingType, HeadingLevel, PageBreak } = require('docx');
const fs = require('fs');

// Helper: create borders
function createBorders(color = "CCCCCC") {
  const border = { style: BorderStyle.SINGLE, size: 1, color };
  return { top: border, bottom: border, left: border, right: border };
}

function createHeaderCell(text, color = "2E75B6") {
  return new TableCell({
    borders: createBorders(color),
    shading: { fill: color, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 22 })]
    })]
  });
}

function createCell(text) {
  return new TableCell({
    borders: createBorders(),
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun(text)]
    })]
  });
}

// ============ MANUAL CLIENTE ============

const manualCliente = new Document({
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // PORTADA
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 600, after: 200 },
        children: [new TextRun({ text: "ZADI", size: 72, bold: true, color: "2E75B6" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [new TextRun({ text: "Tu Inmobiliaria Online", size: 40, color: "44546A" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [new TextRun({ text: "Manual para Clientes", size: 28, italic: true, color: "7F8FA3" })]
      }),

      new Paragraph({ children: [new TextRun("")] }),
      new Paragraph({ children: [new TextRun("")] }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 600 },
        children: [new TextRun({ text: "Guía Sencilla para Gestionar tus Propiedades", size: 24, bold: true })]
      }),

      // PÁGINA 2
      new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("¿Qué es ZADI?")]
      }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("ZADI es tu plataforma de inmobiliaria online. Con ZADI puedes:")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun("✓ Mostrar todas tus propiedades en una web profesional y bonita")]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun("✓ Ubicar cada propiedad en un mapa interactivo")]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun("✓ Recibir solicitudes de clientes interesados automáticamente")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("✓ Gestionar todo desde Google Sheets (sin código)")]
      }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: "Lo mejor: Todo se actualiza automáticamente. Cuando cambias datos en Google Sheets, los clientes ven los cambios al instante en la web.", italic: true, bold: true })]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Configurar Google Drive")]
      }),

      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("Las imágenes de tus propiedades viven en Google Drive. Aquí te explicamos cómo organizarlas:")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Estructura de carpetas")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: "Crea EXACTAMENTE esta estructura:", bold: true })]
      }),

      createFolderStructureTable(),

      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: "📌 Importante:", bold: true })]
      }),

      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("• Carpeta principal: 'Tito-Propiedades' (mayúsculas exactas)")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("• Cada propiedad: carpeta con código (INM-001, INM-002, etc)")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("• Dentro de cada propiedad: carpeta 'IMAGENES' (mayúsculas)")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("• Aquí van TODAS las fotos de esa propiedad")]
      }),

      new Paragraph({
        pageBreakBefore: true,
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Usar Google Sheets")]
      }),

      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("Google Sheets es donde añades y editas tus propiedades. Es como un Excel pero en la nube.")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Paso 1: Hacer una COPIA")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: "¡CRUCIAL! No edites el Sheet que te pasamos. Tienes que hacer una copia primero.", bold: true })]
      }),

      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("1. Abre el link que te pasamos")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("2. Busca el botón azul 'Make a copy' (Hacer una copia)")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("3. Haz click → Google crea una copia EN TU CUENTA")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("4. ¡Esa copia es tuya! Edita libremente")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Paso 2: Rellenar datos en 'Propiedades'")]
      }),

      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("En la hoja 'Propiedades' añades tus inmuebles. Estas columnas son las principales:")]
      }),

      createPropertiesTable(),

      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: "💡 Consejos para llenar bien:", bold: true })]
      }),

      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("• ID Referencia: Mismo código que la carpeta en Drive (INM-001, etc)")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("• Dirección: Completa (calle, número, código postal, ciudad)")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("• Precio: Solo números, SIN puntos (escribe 200000, no 200.000)")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("• Observaciones: Describe características (reformado, jardín, etc)")]
      }),

      new Paragraph({
        pageBreakBefore: true,
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Hoja 'Interesados'")]
      }),

      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("Los clientes que completen el formulario 'Estoy interesado' en la web aparecerán AQUÍ AUTOMÁTICAMENTE.")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: "Columnas (se rellenan solas, excepto 'Estado'):", bold: true })]
      }),

      createInteresadosTable(),

      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: "Cómo funciona:", bold: true })]
      }),

      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("1. Cliente ve propiedad en la web")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("2. Hace click 'Estoy interesado'")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("3. Rellena formulario (nombre, email, teléfono)")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("4. Sus datos aparecen AUTOMÁTICAMENTE aquí")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("5. Tú rellenas 'Estado' cuando lo contactes")]
      }),

      new Paragraph({
        pageBreakBefore: true,
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("La Web ZADI")]
      }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("Tu web se actualiza automáticamente. Los clientes pueden ver:")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("📋 Vista Listado")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("Todas las propiedades en tarjetas con foto, precio, zona, habitaciones, baños. Pueden navegar fotos con flechitas. Opción guardar favoritos.")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("🗺️ Vista Mapa")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("Todas tus propiedades ubicadas en el mapa. Panel lateral con listado de propiedades. Click = ver detalles.")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("🏠 Detalles de Propiedad")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("Todas las fotos en carousel. Descripción completa. Características detalladas. Botón 'Estoy interesado'.")]
      }),

      new Paragraph({
        pageBreakBefore: true,
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("✅ Checklist: Primeros Pasos")]
      }),

      new Paragraph({
        spacing: { before: 100, after: 200 },
        children: [new TextRun("Sigue estos pasos para que todo funcione:")]
      }),

      createChecklistTable(),

      new Paragraph({
        spacing: { before: 400, after: 100 },
        children: [new TextRun({ text: "¿Necesitas ayuda?", size: 28, bold: true, color: "2E75B6" })]
      }),
      new Paragraph({
        children: [new TextRun("Contacta con el equipo técnico si tienes dudas. Estamos para ayudarte.")]
      })
    ]
  }]
});

// ============ MANUAL TÉCNICO ============

const manualTecnico = new Document({
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // PORTADA
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 600, after: 200 },
        children: [new TextRun({ text: "ZADI", size: 72, bold: true, color: "C55A11" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [new TextRun({ text: "Setup Técnico", size: 40, color: "6F5D55" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [new TextRun({ text: "Configuración para Proveedores", size: 28, italic: true, color: "A68775" })]
      }),

      new Paragraph({ children: [new TextRun("")] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 600 },
        children: [new TextRun({ text: "Guía de Instalación y Configuración", size: 24, bold: true })]
      }),

      new Paragraph({
        pageBreakBefore: true,
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Resumen")]
      }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("Este documento describe la configuración técnica para desplegar ZADI para cada cliente. 4 fases principales:")]
      }),

      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("1. Google Cloud Setup: Proyecto, APIs, credenciales")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("2. Google Sheets & Drive: Estructura de datos")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("3. Desplegar Node.js")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("4. Entregar acceso a cliente")]
      }),

      new Paragraph({
        pageBreakBefore: true,
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("FASE 1: Google Cloud")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("1.1 Crear Proyecto")]
      }),

      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("1. Ir a https://console.cloud.google.com/")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("2. Click 'Select a Project' → 'NEW PROJECT'")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("3. Nombre: ZADI-[NombreInmobiliaria]")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("4. Click 'CREATE'")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("1.2 Activar APIs")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun("Ir a: APIs & Services → Library")]
      }),

      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("• Buscar 'Google Sheets API' → click 'Enable'")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("• Buscar 'Google Drive API' → click 'Enable'")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("• Buscar 'Geocoding API' → click 'Enable'")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("1.3 Crear Service Account")]
      }),

      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("1. APIs & Services → Credentials")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("2. Click '+ CREATE CREDENTIALS' → 'Service Account'")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("3. Nombre: zadi-[inmobiliaria]")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("4. Click 'CREATE AND CONTINUE'")]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun("5. Rol: 'Editor' → 'CONTINUE' → 'DONE'")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("1.4 Crear JSON Key")]
      }),

      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("1. En Credentials, click en la Service Account creada")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("2. Tab 'Keys' → 'ADD KEY' → 'Create new key'")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("3. Formato: JSON")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("4. Click 'CREATE'")]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun("5. Guardar en: C:\\INMOBILIARIA\\PRUEBA\\google-credentials.json")]
      }),

      new Paragraph({
        pageBreakBefore: true,
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("FASE 2: Google Sheets & Drive")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("2.1 Crear Google Sheet")]
      }),

      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("1. Ir a https://sheets.google.com/")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("2. '+ New' → nuevo Sheet")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("3. Nombre: 'Inmobiliaria [Cliente]'")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("4. Primera hoja → renombrar a 'Propiedades'")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("5. Agregar segunda hoja → 'Interesados'")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("2.2 Estructura Propiedades")]
      }),

      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("Columnas en este ORDEN exacto:")]
      }),

      createTechPropertiesTable(),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200 },
        children: [new TextRun("2.3 Estructura Interesados")]
      }),

      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun("Columnas en este ORDEN exacto:")]
      }),

      createTechInteresadosTable(),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200 },
        children: [new TextRun("2.4 Compartir")]
      }),

      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("1. Abrir Sheet → Click 'Share'")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("2. Pegar email del service account")]
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun("3. Permiso: 'Editor' → 'Share'")]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun("4. Repetir para la carpeta Drive")]
      }),

      new Paragraph({
        pageBreakBefore: true,
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("FASE 3: Servidor")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("3.1 Actualizar server.js")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun("Abrir: C:\\INMOBILIARIA\\PRUEBA\\server.js")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun("Actualizar líneas 30-31:")]
      }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("const SHEET_ID = '[ID del Google Sheet]';")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("const DRIVE_FOLDER_ID = '[ID de la carpeta Drive]';")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("3.2 Instalar dependencias")]
      }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("npm install")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("3.3 Ejecutar servidor")]
      }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("npm run dev")]
      }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("Servidor en: http://localhost:8000")]
      }),

      new Paragraph({
        pageBreakBefore: true,
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Checklist Setup")]
      }),

      createTechChecklistTable()
    ]
  }]
});

// ============ HELPER TABLES ============

function createFolderStructureTable() {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        borders: createBorders("DDDDDD"),
        shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 150, right: 150 },
        children: [
          new Paragraph({ spacing: { after: 50 }, children: [new TextRun("Tito-Propiedades/")] }),
          new Paragraph({ spacing: { after: 50 }, children: [new TextRun("├─ INM-001/")] }),
          new Paragraph({ spacing: { after: 50 }, children: [new TextRun("│   └─ IMAGENES/")] }),
          new Paragraph({ spacing: { after: 50 }, children: [new TextRun("│       ├─ foto1.jpg")] }),
          new Paragraph({ spacing: { after: 50 }, children: [new TextRun("│       └─ foto2.jpg")] }),
          new Paragraph({ spacing: { after: 50 }, children: [new TextRun("├─ INM-002/")] }),
          new Paragraph({ spacing: { after: 50 }, children: [new TextRun("│   └─ IMAGENES/")] }),
          new Paragraph({ spacing: { after: 50 }, children: [new TextRun("│       └─ foto1.jpg")] })
        ]
      })]
    })]
  });
}

function createPropertiesTable() {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3120, 6240],
    rows: [
      new TableRow({
        children: [
          createHeaderCell("COLUMNA", "2E75B6"),
          createHeaderCell("QUÉ VA AQUÍ", "2E75B6")
        ]
      }),
      new TableRow({
        children: [
          createCell("ID Referencia"),
          createCell("Código único (INM-001, INM-002)")
        ]
      }),
      new TableRow({
        children: [
          createCell("Nombre Propietario"),
          createCell("Quién posee la propiedad")
        ]
      }),
      new TableRow({
        children: [
          createCell("Zona"),
          createCell("Barrio o zona (Santa Cruz, etc)")
        ]
      }),
      new TableRow({
        children: [
          createCell("Tipo Inmueble"),
          createCell("Piso, Casa, Villa, Ático, etc")
        ]
      }),
      new TableRow({
        children: [
          createCell("Habitaciones"),
          createCell("Número entero")
        ]
      }),
      new TableRow({
        children: [
          createCell("Baños"),
          createCell("Número entero")
        ]
      }),
      new TableRow({
        children: [
          createCell("Metros Cuadrados"),
          createCell("Número entero (m²)")
        ]
      }),
      new TableRow({
        children: [
          createCell("Precio Venta (€)"),
          createCell("Número sin puntos (200000)")
        ]
      }),
      new TableRow({
        children: [
          createCell("Dirección"),
          createCell("Completa: calle, número, código postal, ciudad")
        ]
      })
    ]
  });
}

function createInteresadosTable() {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3120, 6240],
    rows: [
      new TableRow({
        children: [
          createHeaderCell("COLUMNA", "2E75B6"),
          createHeaderCell("DESCRIPCIÓN", "2E75B6")
        ]
      }),
      new TableRow({
        children: [
          createCell("Inmueble"),
          createCell("ID de la propiedad")
        ]
      }),
      new TableRow({
        children: [
          createCell("Nombre"),
          createCell("Nombre del cliente")
        ]
      }),
      new TableRow({
        children: [
          createCell("Apellidos"),
          createCell("Apellidos del cliente")
        ]
      }),
      new TableRow({
        children: [
          createCell("Email"),
          createCell("Email del cliente")
        ]
      }),
      new TableRow({
        children: [
          createCell("Teléfono"),
          createCell("Teléfono del cliente")
        ]
      }),
      new TableRow({
        children: [
          createCell("Fecha y hora"),
          createCell("Auto (cuándo completó)")
        ]
      }),
      new TableRow({
        children: [
          createCell("Estado"),
          createCell("Tú lo rellenas (Contactado, etc)")
        ]
      })
    ]
  });
}

function createChecklistTable() {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [700, 8660],
    rows: [
      new TableRow({
        children: [
          createHeaderCell("✓", "2E75B6"),
          createHeaderCell("PASO", "2E75B6")
        ]
      }),
      new TableRow({
        children: [
          createCell("☐"),
          createCell("Crear carpeta 'Tito-Propiedades'")
        ]
      }),
      new TableRow({
        children: [
          createCell("☐"),
          createCell("Crear subcarpetas INM-001, INM-002 (con IMAGENES)")
        ]
      }),
      new TableRow({
        children: [
          createCell("☐"),
          createCell("Hacer copia del Google Sheet")
        ]
      }),
      new TableRow({
        children: [
          createCell("☐"),
          createCell("Rellenar datos en 'Propiedades'")
        ]
      }),
      new TableRow({
        children: [
          createCell("☐"),
          createCell("Subir fotos en carpetas correctas")
        ]
      }),
      new TableRow({
        children: [
          createCell("☐"),
          createCell("¡Listo! Web se actualiza automáticamente")
        ]
      })
    ]
  });
}

function createTechPropertiesTable() {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    rows: [
      new TableRow({
        children: [
          createHeaderCell("COLUMNA", "C55A11"),
          createHeaderCell("TIPO", "C55A11")
        ]
      }),
      new TableRow({
        children: [
          createCell("A. ID Referencia"),
          createCell("Texto")
        ]
      }),
      new TableRow({
        children: [
          createCell("B. Nombre Propietario"),
          createCell("Texto")
        ]
      }),
      new TableRow({
        children: [
          createCell("C. Zona"),
          createCell("Texto")
        ]
      }),
      new TableRow({
        children: [
          createCell("D. Tipo Inmueble"),
          createCell("Texto")
        ]
      }),
      new TableRow({
        children: [
          createCell("E. Habitaciones"),
          createCell("Número")
        ]
      }),
      new TableRow({
        children: [
          createCell("F. Baños"),
          createCell("Número")
        ]
      }),
      new TableRow({
        children: [
          createCell("G. Metros Cuadrados"),
          createCell("Número")
        ]
      }),
      new TableRow({
        children: [
          createCell("H. Ascensor"),
          createCell("Sí/No")
        ]
      }),
      new TableRow({
        children: [
          createCell("I. Precio Venta (€)"),
          createCell("Número")
        ]
      }),
      new TableRow({
        children: [
          createCell("J. Comisión Agente (%)"),
          createCell("Número")
        ]
      }),
      new TableRow({
        children: [
          createCell("K. Estado"),
          createCell("Texto")
        ]
      }),
      new TableRow({
        children: [
          createCell("L. Observaciones"),
          createCell("Texto")
        ]
      }),
      new TableRow({
        children: [
          createCell("M. Dirección"),
          createCell("Texto")
        ]
      })
    ]
  });
}

function createTechInteresadosTable() {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3120, 6240],
    rows: [
      new TableRow({
        children: [
          createHeaderCell("COLUMNA", "C55A11"),
          createHeaderCell("TIPO", "C55A11")
        ]
      }),
      new TableRow({
        children: [
          createCell("A. Inmueble"),
          createCell("Texto (auto)")
        ]
      }),
      new TableRow({
        children: [
          createCell("B. Nombre"),
          createCell("Texto (auto)")
        ]
      }),
      new TableRow({
        children: [
          createCell("C. Apellidos"),
          createCell("Texto (auto)")
        ]
      }),
      new TableRow({
        children: [
          createCell("D. Email"),
          createCell("Email (auto)")
        ]
      }),
      new TableRow({
        children: [
          createCell("E. Teléfono"),
          createCell("Texto (auto)")
        ]
      }),
      new TableRow({
        children: [
          createCell("F. Fecha y hora"),
          createCell("Timestamp (auto)")
        ]
      }),
      new TableRow({
        children: [
          createCell("G. Estado"),
          createCell("Texto (manual)")
        ]
      })
    ]
  });
}

function createTechChecklistTable() {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [700, 8660],
    rows: [
      new TableRow({
        children: [
          createHeaderCell("✓", "C55A11"),
          createHeaderCell("CONFIGURACIÓN", "C55A11")
        ]
      }),
      new TableRow({
        children: [
          createCell("☐"),
          createCell("Google Cloud proyecto creado")
        ]
      }),
      new TableRow({
        children: [
          createCell("☐"),
          createCell("APIs activadas (Sheets, Drive)")
        ]
      }),
      new TableRow({
        children: [
          createCell("☐"),
          createCell("Service Account con JSON key")
        ]
      }),
      new TableRow({
        children: [
          createCell("☐"),
          createCell("Google Sheet creado")
        ]
      }),
      new TableRow({
        children: [
          createCell("☐"),
          createCell("Drive carpeta creada")
        ]
      }),
      new TableRow({
        children: [
          createCell("☐"),
          createCell("Permisos compartidos")
        ]
      }),
      new TableRow({
        children: [
          createCell("☐"),
          createCell("server.js actualizado")
        ]
      }),
      new TableRow({
        children: [
          createCell("☐"),
          createCell("npm install ejecutado")
        ]
      }),
      new TableRow({
        children: [
          createCell("☐"),
          createCell("Servidor funcionando")
        ]
      })
    ]
  });
}

// ============ GENERATE FILES ============

Promise.all([
  Packer.toBuffer(manualCliente).then(buffer => {
    fs.writeFileSync('ZADI-Manual-Cliente.docx', buffer);
    console.log('✅ ZADI-Manual-Cliente.docx creado');
  }),
  Packer.toBuffer(manualTecnico).then(buffer => {
    fs.writeFileSync('ZADI-Manual-Setup-Tecnico.docx', buffer);
    console.log('✅ ZADI-Manual-Setup-Tecnico.docx creado');
  })
]).catch(err => console.error('Error:', err));
