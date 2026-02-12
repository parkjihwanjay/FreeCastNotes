# FreeCastNotes — Plan de Desarrollo con Claude Code

## Proyecto
**Nombre**: FreeCastNotes
**Tagline**: "The Raycast Notes experience, free and open source."
**Repo**: `github.com/gastonmichelotti/freecastnotes` (o el user que prefieras)
**Licencia**: MIT
**Stack**: Tauri v2 + React + TipTap + TypeScript + Tailwind CSS

---

## Decisiones de Diseño Confirmadas

| Decisión | Valor |
|----------|-------|
| Imágenes en notas | No (V2) |
| Límite de notas | Sin límite |
| Sincronización cloud | No (V2) |
| Nombre | FreeCastNotes |
| Stack | Tauri v2 + TipTap |
| Action Panel (⌘K) | Sí, V1 |
| Tema | Dark only (V1) |
| Open Source | MIT License |

---

## Arquitectura del Proyecto

```
freecastnotes/
├── src-tauri/                    # Backend Rust (Tauri)
│   ├── src/
│   │   ├── main.rs              # Entry point Tauri
│   │   ├── lib.rs               # Setup, plugins, commands
│   │   ├── commands/            # Comandos Tauri (CRUD notas)
│   │   │   ├── mod.rs
│   │   │   └── notes.rs         # create, read, update, delete, list, search
│   │   ├── db/                  # Capa de datos
│   │   │   ├── mod.rs
│   │   │   └── sqlite.rs        # SQLite con tauri-plugin-sql
│   │   ├── hotkey.rs            # Global shortcut registration
│   │   └── window.rs            # Window management (floating, positioning)
│   ├── Cargo.toml
│   ├── tauri.conf.json          # Config Tauri (window, permissions, etc)
│   └── icons/                   # App icons
├── src/                          # Frontend React
│   ├── App.tsx                  # Root component
│   ├── main.tsx                 # Entry point React
│   ├── components/
│   │   ├── Editor/
│   │   │   ├── Editor.tsx       # TipTap editor wrapper
│   │   │   ├── FormatBar.tsx    # Barra de formato inferior
│   │   │   ├── extensions/      # Custom TipTap extensions
│   │   │   │   ├── TaskList.ts  # Task list con estilo Raycast
│   │   │   │   └── KeyboardShortcuts.ts
│   │   │   └── styles.css       # Estilos del editor
│   │   ├── Toolbar/
│   │   │   └── Toolbar.tsx      # Barra superior (título, botones)
│   │   ├── NotesBrowser/
│   │   │   ├── NotesBrowser.tsx # Panel de browse notes (⌘P)
│   │   │   └── NoteItem.tsx     # Item individual en la lista
│   │   ├── ActionPanel/
│   │   │   ├── ActionPanel.tsx  # Command palette (⌘K)
│   │   │   └── actions.ts       # Definición de acciones
│   │   └── Toast/
│   │       └── Toast.tsx        # Notificaciones transitorias
│   ├── hooks/
│   │   ├── useNotes.ts          # CRUD de notas (invoke Tauri commands)
│   │   ├── useEditor.ts         # Estado del editor
│   │   └── useKeyboard.ts      # Keyboard shortcuts handler
│   ├── stores/
│   │   └── appStore.ts          # Zustand store (estado global)
│   ├── lib/
│   │   ├── export.ts            # Export a MD/HTML/PlainText
│   │   └── utils.ts             # Utilidades
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   └── styles/
│       └── globals.css          # Tailwind + estilos globales
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
├── README.md                    # README público del proyecto OSS
├── CONTRIBUTING.md
├── LICENSE                      # MIT
└── .github/
    └── workflows/
        └── build.yml            # CI/CD: build para macOS
```

---

## Fases de Desarrollo

Cada fase es un milestone. Cada tarea dentro de la fase es un prompt independiente para Claude Code. Las tareas están ordenadas para que cada una construya sobre la anterior y sea testeable de forma aislada.

---

### FASE 0: Scaffolding y Setup
**Objetivo**: Proyecto funcional vacío con Tauri + React + TipTap corriendo.

**Tarea 0.1 — Inicializar proyecto Tauri v2 + React**
```
Inicializa un proyecto Tauri v2 con frontend React + TypeScript + Vite.
- Usa `create-tauri-app` o setup manual
- Configura Tailwind CSS v4
- Configura la ventana como: decorations=false (custom titlebar), 
  width=400, height=600, always_on_top=true, transparent=false,
  title="FreeCastNotes"
- El frontend debe mostrar un "Hello FreeCastNotes" centrado
- Verificar que `cargo tauri dev` funciona
```

**Tarea 0.2 — Custom Titlebar + Tema Oscuro Base**
```
Implementa un custom titlebar que replique el de Raycast Notes:
- Semáforo macOS (rojo/amarillo/verde) funcional en la esquina superior izquierda
- Título de la nota centrado en la toolbar
- Botones a la derecha: icono ⌘K (action panel), icono browse (lista), icono + (nueva nota)
- El fondo de toda la app debe ser tema oscuro (#1C1C1E background, #E5E5E7 texto)
- La toolbar debe tener data-tauri-drag-region para poder mover la ventana
- Botón rojo del semáforo debe ocultar la ventana (no cerrar la app)
```

**Tarea 0.3 — Instalar y configurar TipTap básico**
```
Instala TipTap y configúralo como editor principal:
- Paquetes: @tiptap/react, @tiptap/starter-kit, @tiptap/pm
- El editor debe ocupar todo el espacio debajo de la toolbar
- Placeholder "Start writing..." cuando está vacío
- Tema oscuro para el editor (fondo transparente, texto blanco)
- Verificar que se puede escribir texto básico
- El editor debe tener autofocus al abrir la app
```

---

### FASE 1: Editor Completo
**Objetivo**: Todos los formatos de texto funcionando con atajos y markdown input.

**Tarea 1.1 — Formatos de párrafo**
```
Agrega todas las extensiones de TipTap para formatos de párrafo:
- Heading (niveles 1-3) con atajos ⌥⌘1, ⌥⌘2, ⌥⌘3
  y markdown input rules (# ## ###)
- CodeBlock con atajo ⌥⌘C y markdown input (```)
- Blockquote con atajo ⇧⌘B y markdown input (>)
- BulletList con atajo ⇧⌘8 y markdown input (*, -, +)
- OrderedList con atajo ⇧⌘7 y markdown input (1.)
- TaskList con atajo ⇧⌘9 y markdown input ([ ] y [x])
- ListItem con soporte de nesting via Tab/Shift+Tab
- Horizontal rule con markdown input (--- y ___)
Los headings deben tener tamaños visualmente distintos (H1 grande, H2 mediano, H3 pequeño).
Los code blocks deben tener fondo más oscuro y fuente monospace.
Los blockquotes deben tener una barra vertical izquierda de color sutil.
Las task list deben tener checkboxes circulares rojos (no los default cuadrados).
```

**Tarea 1.2 — Formatos de texto inline**
```
Agrega las extensiones de formato inline de TipTap:
- Bold (⌘B) con markdown input (**text**)
- Italic (⌘I) con markdown input (*text*)
- Strike (⇧⌘S) con markdown input (~~text~~)  
- Underline (⌘U) — sin markdown input
- Code inline (⌘E) con markdown input (`text`)
- Link (⌘L) — al presionar debe mostrar un mini popup pidiendo URL
  con markdown input [text](url)
Todos los formatos deben ser visualmente distinguibles con estilos apropiados
para tema oscuro.
```

**Tarea 1.3 — Listas anidadas multi-nivel**
```
Mejora el comportamiento de listas para soportar anidamiento profundo:
- Tab indenta un nivel, Shift+Tab des-indenta
- Bullet lists: diferentes estilos de bullet por nivel:
  Nivel 1: disco relleno (●)
  Nivel 2: disco vacío (○)  
  Nivel 3: cuadrado relleno (■)
  Nivel 4: diamante (◆)
- Ordered lists: numeración anidada (1. → 1. → 1.)
  mantener la numeración correcta al agregar/eliminar items
- Task lists: soportar anidamiento con mismo estilo de checkbox
- Enter en un item de lista vacío debe salir de la lista
  (des-indentar hasta nivel 0, luego convertir a párrafo)
- Mínimo 4 niveles de anidamiento para todos los tipos de lista
- Los items de lista deben poder contener formatos inline (bold, italic, etc)
```

**Tarea 1.4 — Format Bar**
```
Implementa la barra de formato inferior del editor:
- Barra fija en la parte inferior de la ventana, por encima de todo
- Fondo semi-oscuro con borde superior sutil
- Iconos/botones de izquierda a derecha:
  H▾ (dropdown con H1, H2, H3) | B | I | S̶ | U̲ | <> (code) | 🔗 (link) |
  ≡ (blockquote) | • (bullet) | 1. (ordered) | ☐ (task)
- Cada botón debe reflejar el estado activo del formato actual
  (ej: si el cursor está en negrita, el botón B se ve "activo/highlighted")
- El dropdown de Headings muestra H1, H2, H3 con preview del tamaño
- Botón ⊗ al extremo derecho para cerrar/ocultar la barra
- Toggle con ⌥⌘, (mostrar/ocultar)
- Cada botón ejecuta el mismo comando que su atajo de teclado correspondiente
- Tooltips que muestran el nombre del formato + atajo al hacer hover
```

---

### FASE 2: Persistencia y Gestión de Notas
**Objetivo**: CRUD completo de notas con SQLite.

**Tarea 2.1 — SQLite + CRUD de notas en Rust**
```
Implementa la capa de persistencia con SQLite:
- Usa tauri-plugin-sql con SQLite
- Base de datos en ~/Library/Application Support/com.freecastnotes.app/notes.db
- Schema:
  CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    pin_order INTEGER NOT NULL DEFAULT -1
  );
  CREATE TABLE deleted_notes (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    deleted_at TEXT NOT NULL,
    original_created_at TEXT NOT NULL
  );
- Comandos Tauri (invocables desde frontend):
  - create_note() -> Note
  - get_note(id) -> Note
  - update_note(id, content) -> Note
  - delete_note(id) -> void (mueve a deleted_notes)
  - list_notes() -> Vec<Note> (ordenadas: pinned primero, luego por updated_at desc)
  - search_notes(query) -> Vec<Note>
  - toggle_pin(id) -> Note
  - duplicate_note(id) -> Note
  - list_deleted_notes() -> Vec<DeletedNote>
  - restore_note(id) -> Note
  - purge_deleted_notes() -> void (eliminar permanentemente los de >30 días)
- El content se almacena como JSON de TipTap (el output de editor.getJSON())
```

**Tarea 2.2 — Conectar editor con persistencia**
```
Conecta el editor TipTap con los comandos Tauri de notas:
- Al abrir la app, cargar la última nota editada (la más reciente por updated_at)
- Auto-save: guardar el contenido cada vez que cambia con debounce de 300ms
  usando editor.on('update') + invoke('update_note')
- La primera línea del contenido (primer nodo de texto) se usa como título
  y se muestra en la Toolbar
- Si la primera línea está vacía, mostrar "Untitled" como título
- Crear un hook useNotes() que maneje:
  - currentNote: la nota actualmente abierta
  - notes: lista de todas las notas
  - createNote(), deleteNote(), switchToNote(id), etc.
- Al crear una nota nueva, el editor se limpia y se enfoca automáticamente
- State management con Zustand
```

**Tarea 2.3 — Browse Notes Panel (⌘P)**
```
Implementa el panel de Browse Notes como overlay sobre el editor:
- Se abre con ⌘P o click en el icono de browse en la toolbar
- Es un panel superpuesto (no una ventana nueva) con fondo semi-transparente
- Componentes:
  1. Search input en la parte superior (placeholder "Search for notes...")
     - Filtra notas por título y contenido en tiempo real
  2. Header con conteo "X/Y Notes" y un ícono de info
  3. Lista de notas mostrando:
     - Nombre (primera línea del contenido, bold)
     - Metadata línea: "Current" o "Opened X ago" + "• Y Characters"
     - La nota actual tiene un indicador ● rojo y texto "Current"
     - Al hover: botones de pin (📌) y delete (🗑) a la derecha
  4. Notas pinneadas aparecen arriba con icono de pin
- Click en una nota cierra el panel y abre esa nota en el editor
- Esc cierra el panel sin cambiar de nota
- ⌘N dentro del panel crea nota nueva y cierra el panel
- Animación de aparición suave (fade in / slide)
```

---

### FASE 3: Action Panel y Funcionalidades Avanzadas
**Objetivo**: Command palette, export, navegación.

**Tarea 3.1 — Action Panel (⌘K)**
```
Implementa el Action Panel como command palette:
- Se abre con ⌘K o click en el icono ⌘ de la toolbar
- Overlay centrado con:
  1. Search input (placeholder "Search for actions...")
  2. Lista de acciones filtrable con iconos, nombre y atajo
- Acciones disponibles:
  - New Note (⌘N) → crea nota nueva
  - Duplicate Note (⌘D) → duplica la nota actual, muestra toast "Note duplicated"
  - Browse Notes (⌘P) → abre browse notes
  - Find in Note (⌘F) → activa find & replace del editor
  - Copy Note As... (⇧⌘C) → submenu con Markdown, HTML, Plain Text
  - Copy Deeplink (⇧⌘D) → copia freecastnotes://note/{id} al clipboard
  - Export... (⇧⌘E) → dialog de guardar archivo con formato seleccionable
  - Move List Item Up (⌃⇧↑) → si está en lista
  - Move List Item Down (⌃⇧↓) → si está en lista
  - Format... → submenu con opciones de formato
  - Enable Window Auto-sizing (⇧⌘/) → toggle
  - Hide Format Bar (⌥⌘,) → toggle
  - Delete Note (con confirmación) → elimina nota actual
  - Recently Deleted Notes → abre panel de notas eliminadas
- Enter o click ejecuta la acción seleccionada
- Esc cierra el panel
- Las acciones que no aplican en el contexto actual se muestran grayed out
```

**Tarea 3.2 — Export y Copy As**
```
Implementa las funciones de exportación:
- Copy Note As Markdown:
  - Usar editor.storage.markdown.getMarkdown() o custom serializer
  - Copiar al clipboard del sistema
  - Mostrar toast "Copied as Markdown"
- Copy Note As HTML:
  - Usar editor.getHTML()
  - Copiar al clipboard
  - Mostrar toast "Copied as HTML"
- Copy Note As Plain Text:
  - Usar editor.getText()
  - Copiar al clipboard  
  - Mostrar toast "Copied as Plain Text"
- Export... (guardar archivo):
  - Usar tauri dialog.save() para elegir ubicación
  - Formatos: .md, .html, .txt
  - Extensión según formato elegido
```

**Tarea 3.3 — Navegación de notas y pinning**
```
Implementa la navegación estilo browser entre notas:
- Mantener un historial de notas visitadas (stack de IDs)
- ⌘[ para ir atrás en el historial
- ⌘] para ir adelante en el historial
- ⇧⌘P para toggle pin en la nota actual
  - Mostrar toast "Note pinned" / "Note unpinned"
- ⌘0...⌘9 para acceso rápido a notas pinneadas
  (en el orden en que aparecen en Browse Notes)
- Al navegar, el editor carga el contenido de la nueva nota con transición suave
```

---

### FASE 4: Window Management y Hotkey Global
**Objetivo**: Comportamiento de ventana flotante con acceso global.

**Tarea 4.1 — Global Hotkey y Window Toggle**
```
Implementa el hotkey global y el comportamiento de ventana:
- Registrar hotkey global ⌥N usando tauri-plugin-global-shortcut
- Al presionar ⌥N:
  - Si la ventana está oculta → mostrarla y darle focus
  - Si la ventana está visible y tiene focus → ocultarla
  - Si la ventana está visible pero no tiene focus → darle focus
- La app NO debe aparecer en el Dock (configura LSUIElement=true en Info.plist
  o usa tauri config equivalente)
- La ventana debe ser de tipo "panel" (NSPanel) para que flote sobre otras apps
  sin robar el focus de la app actual permanentemente
- Esc oculta la ventana (además del hotkey)
- Recordar posición y tamaño de la ventana entre sesiones
  (guardar en localStorage o en SQLite)
```

**Tarea 4.2 — System Tray (Menu Bar)**
```
Implementa el icono en la barra de menú:
- Usa tauri-plugin-tray para agregar icono en la system tray
- Icono: un ícono simple de nota (diseñaremos después, usar placeholder)
- Click en el icono toggle la ventana (mismo comportamiento que ⌥N)
- Right-click muestra menú contextual:
  - "Show/Hide Notes" 
  - "New Note"
  - Separador
  - "Settings..." (para futuro)
  - "About FreeCastNotes"
  - Separador
  - "Quit"
```

**Tarea 4.3 — Auto-sizing de ventana**
```
Implementa el auto-sizing de la ventana:
- Por defecto, la ventana auto-ajusta su altura al contenido
  - Ancho fijo (400px)
  - Alto mínimo: 200px
  - Alto máximo: 80% de la pantalla
- El frontend calcula la altura del contenido y la envía al backend Tauri
  que redimensiona la ventana
- Toggle "Enable Window Auto-sizing" (⇧⌘/) para desactivar
  y permitir redimensionamiento manual del alto
- Cuando auto-size está desactivado, el usuario puede arrastrar
  el borde inferior para redimensionar
- Transición suave al cambiar de tamaño (animación)
```

---

### FASE 5: Polish y Preparación OSS
**Objetivo**: Pulir UX, crear assets, preparar para release público.

**Tarea 5.1 — Estilos y Polish visual**
```
Pulir todos los estilos para que se vean idénticos a Raycast Notes:
- Revisar cada elemento contra las capturas de referencia
- Task list checkboxes: deben ser círculos rojos, no cuadrados
  - Vacío: borde rojo, fondo transparente
  - Checked: fondo rojo relleno con checkmark blanco
- Bullet list: estilos por nivel (●, ○, ■, ◆) con colores sutiles
- Code block: fondo #0D0D0D, borde sutil, border-radius
- Blockquote: barra izquierda de 3px, color gris medio
- Headings: H1=28px bold, H2=22px bold, H3=18px bold
- Links: color azul-celeste, underline
- Selection: background color de selección acorde al tema
- Scrollbar: custom thin scrollbar en tema oscuro
- Animaciones: transiciones suaves en panels, toasts, hover states
- Focus ring: sutil para accesibilidad
```

**Tarea 5.2 — Toast system**
```
Implementa un sistema de toast notifications:
- Toasts aparecen en la parte superior de la ventana
- Duración: 2 segundos, luego fade out
- Estilos: fondo oscuro con borde sutil, texto blanco, bordes redondeados
- Se usa para: "Note duplicated", "Copied as Markdown", 
  "Note pinned", "Note deleted", etc.
- Máximo 1 toast visible a la vez (el nuevo reemplaza al anterior)
```

**Tarea 5.3 — Find in Note (⌘F)**
```
Implementa buscar y reemplazar dentro de la nota:
- ⌘F abre una barra de búsqueda sutil en la parte superior del editor
- Funcionalidades:
  - Buscar texto con highlight de matches
  - Navegar entre matches con ↑/↓ o Enter/Shift+Enter
  - Contador "X of Y matches"
  - Opción de reemplazar (toggle con botón)
  - Case sensitive toggle
- Esc cierra la barra de búsqueda
- Usa la extensión @tiptap/extension-search-and-replace o similar
```

**Tarea 5.4 — README, LICENSE y assets para GitHub**
```
Crea todos los archivos necesarios para el repositorio público:

README.md:
- Logo/banner del proyecto
- Descripción: "The Raycast Notes experience, free and open source. 
  Unlimited notes, zero cost."
- Screenshot/GIF de la app en acción
- Sección "Why?": Explicar que Raycast Notes es genial pero limitado 
  a 5 notas gratis
- Features list con checkmarks
- Installation: instrucciones de descarga (.dmg) y build from source
- Keyboard shortcuts reference completa
- Tech stack
- Contributing guide link
- License (MIT)

CONTRIBUTING.md:
- Cómo reportar bugs
- Cómo proponer features  
- Setup de desarrollo (prerequisites, cómo correr localmente)
- Coding style / guidelines
- PR process

LICENSE: MIT

.github/workflows/build.yml:
- CI que builda la app para macOS (arm64 + x86_64)
- Genera .dmg como artifact
- Tagging para releases
```

---

## Resumen de Fases

| Fase | Tareas | Estimación | Output |
|------|--------|------------|--------|
| 0: Scaffolding | 3 tareas | 1 sesión | App vacía corriendo |
| 1: Editor | 4 tareas | 2-3 sesiones | Editor completo con todos los formatos |
| 2: Persistencia | 3 tareas | 1-2 sesiones | CRUD notas + Browse Notes |
| 3: Action Panel | 3 tareas | 1-2 sesiones | ⌘K + Export + Navegación |
| 4: Window Mgmt | 3 tareas | 1-2 sesiones | Hotkey global + Tray + Auto-size |
| 5: Polish + OSS | 4 tareas | 1-2 sesiones | App lista para release |

**Total estimado**: ~8-12 sesiones de Claude Code

---

## Notas para Claude Code

### Contexto que darle al comenzar cada sesión
```
Este proyecto es FreeCastNotes, un clon open source de Raycast Notes
para macOS. Stack: Tauri v2 + React + TipTap + TypeScript + Tailwind.
Es una app de notas flotante que vive en background y se abre con ⌥N.
Repo pensado para ser público (MIT license).
Lee el archivo specs/raycast-notes-clone.md para la spec completa
y DEVELOPMENT_PLAN.md para el plan de desarrollo.
Estamos en la Fase X, Tarea X.Y.
```

### Principios de desarrollo
1. **Cada tarea es un commit**: al completar cada tarea, commit con mensaje descriptivo
2. **Test manual después de cada tarea**: verificar que lo anterior sigue funcionando
3. **Código limpio y comentado**: es open source, otros lo van a leer
4. **Sin over-engineering**: MVP primero, refactor después
5. **Respetar los atajos de Raycast**: la familiaridad es clave para el UX
