# FreeCastNotes — The Raycast Notes Experience, Free and Open Source

## Overview

FreeCastNotes es una app open source (MIT) para macOS que replica la experiencia de Raycast Notes: una ventana flotante de notas rápidas con editor WYSIWYG rico, accesible mediante atajo de teclado global, que vive en background y permite capturar ideas sin interrumpir el flujo de trabajo. **Sin límite de notas**, sin paywall.

**Stack**: Tauri v2 + React + TipTap + TypeScript + Tailwind CSS
**Repo**: github.com (MIT License)

---

## 1. Arquitectura de la Ventana

### 1.1 Comportamiento General
- **Ventana flotante** (siempre encima de otras ventanas, nivel `NSWindow.Level.floating`)
- **Se abre/cierra con hotkey global** configurable (default: `⌥N`)
- Cuando se cierra, la app queda en background (no aparece en el Dock ni en ⌘Tab)
- **Menu bar icon** (tray) para acceder a la app cuando está oculta
- La ventana NO tiene barra de título estándar de macOS — usa una **toolbar custom** con semáforo (🔴🟡🟢) integrado

### 1.2 Dimensiones y Redimensionamiento
- **Ancho fijo** (~380-420px, similar a Raycast)
- **Alto auto-ajustable** al contenido (auto-size) con opción de redimensionar manualmente arrastrando el borde inferior
- Toggle "auto-size" visible como tooltip/hint al redimensionar
- Posición recordada entre sesiones

### 1.3 Tema Visual
- **Tema oscuro** obligatorio (como Raycast Notes)
- Background: `#1A1A1A` aprox (fondo del editor)
- Texto: `#E0E0E0` (blanco suave)
- Acentos: rojo para checkboxes/tasks (#FF6363 aprox)
- Bordes y separadores sutiles
- Fuente: SF Pro / system font de macOS, ~14px para body

---

## 2. Editor WYSIWYG

### 2.1 Formatos de Párrafo

| Formato | Atajo de Teclado | Sintaxis Markdown |
|---------|-------------------|-------------------|
| Heading 1 | `⌥⌘1` | `# ` al inicio de línea |
| Heading 2 | `⌥⌘2` | `## ` al inicio de línea |
| Heading 3 | `⌥⌘3` | `### ` al inicio de línea |
| Code block | `⌥⌘C` | ` ``` ` (3 backticks) al inicio de línea |
| Blockquote | `⇧⌘B` | `> ` al inicio de línea |
| Ordered list | `⇧⌘7` | `1. ` al inicio de línea |
| Bullet list | `⇧⌘8` | `* `, `- ` o `+ ` al inicio de línea |
| Task list | `⇧⌘9` | `[ ] ` o `[x] ` al inicio de línea |

### 2.2 Formatos de Texto (Inline)

| Formato | Atajo de Teclado | Sintaxis Markdown |
|---------|-------------------|-------------------|
| Bold | `⌘B` | `**texto**` o `__texto__` |
| Italic | `⌘I` | `*texto*` o `_texto_` |
| Strikethrough | `⇧⌘S` | `~~texto~~` |
| Underline | `⌘U` | N/A |
| Inline code | `⌘E` | `` `texto` `` |
| Link | `⌘L` | `[texto](url)` |

### 2.3 Otros Formatos

| Formato | Atajo/Trigger |
|---------|---------------|
| Emoji picker inline | Escribir `:` abre picker |
| Horizontal rule | `---` o `___` al inicio de línea |

### 2.4 Comportamiento del Editor

- **WYSIWYG puro**: El markdown se convierte a formato rico al escribir (no se muestra el markdown raw)
- **Listas anidadas** con `Tab` para indentar y `Shift+Tab` para des-indentar
  - Bullet lists: cambian de bullet style por nivel (●, ○, ■, etc.)
  - Ordered lists: numeración anidada (1, 1.1, 1.1.1)
  - Soporte de al menos 4 niveles de anidamiento
- **Task lists**: checkbox con círculo rojo vacío (incompleto) y círculo rojo relleno (completado), click para toggle
- **Code blocks**: fondo más oscuro, fuente monospace, sin syntax highlighting (simple)
- **Blockquote**: barra vertical izquierda como indicador visual
- **Enter** en lista vacía sale de la lista
- **Primera línea = título** de la nota (se muestra en toolbar y en el browser de notas)

### 2.5 Format Bar (Barra de Formato)

- Barra inferior con iconos para todos los formatos
- Iconos (izquierda a derecha): H▾ (headings dropdown), **B**, *I*, ~~S~~, U̲, `<>` (code), 🔗 (link), 📷 (imagen?), ≡ (blockquote), • (bullet list), 1. (ordered list), ☐ (task list)
- Toggle show/hide con `⌥⌘,` (Format Bar visible por default)
- El botón `⊗` al extremo derecho cierra la barra de formato

---

## 3. Gestión de Notas

### 3.1 Modelo de Datos por Nota
```
Note {
  id: UUID
  content: string (formato interno - ver sección almacenamiento)
  created_at: datetime
  updated_at: datetime  
  is_pinned: boolean
  pin_order: int (0-9 para acceso rápido)
}
```

### 3.2 Browse Notes (⌘P)

- **Panel superpuesto** sobre la nota actual (no una ventana separada)
- **Buscador** en la parte superior con placeholder "Search for notes..."
- **Lista de notas** mostrando:
  - Indicador de nota actual (● rojo + "Current")
  - Nombre de la nota (primera línea del contenido)
  - Metadata: "Opened X minutes/days ago • Y Characters"
  - Icono de pin (📌) y delete (🗑) al hacer hover
- **Conteo**: "X/Y Notes" en el header
- Click en una nota la abre (reemplaza la actual)
- Ordenamiento: notas pinneadas primero, luego por última apertura

### 3.3 Navegación entre Notas
- `⌘[` y `⌘]` — navegar atrás/adelante en historial de notas abiertas (como un browser)
- `⌘0...9` — acceso directo a notas pinneadas

### 3.4 Pinning
- `⇧⌘P` — pin/unpin la nota actual
- Las notas pinneadas aparecen arriba en Browse Notes

### 3.5 Crear Nota
- `⌘N` — crea nota nueva y la abre
- La nota nueva empieza vacía con cursor en la primera línea

### 3.6 Eliminar Nota
- Desde Browse Notes: icono 🗑 al hover
- Desde Action Panel (⌘K): "Delete Note"
- **Recently Deleted Notes**: las notas eliminadas van a una papelera temporal (recuperables)

---

## 4. Action Panel (⌘K)

Command palette estilo Raycast con buscador y lista de acciones:

| Acción | Atajo | Descripción |
|--------|-------|-------------|
| Duplicate Note | `⌘D` | Crea copia de la nota actual |
| Browse Notes | `⌘P` | Abre el browser de notas |
| Find in Note | `⌘F` | Buscar texto dentro de la nota |
| Copy Note As... | `⇧⌘C` | Submenu: Markdown, HTML, Plain Text |
| Copy Deeplink | `⇧⌘D` | Copia un deep link a la nota |
| Create Quicklink | `⇧⌘L` | Crea un acceso rápido |
| Export... | `⇧⌘E` | Exportar en varios formatos |
| Move List Item Up | `⌃⇧↑` | Mover item de lista arriba |
| Move List Item Down | `⌃⇧↓` | Mover item de lista abajo |
| Format... | — | Submenu con opciones de formato |

### 4.1 Copy Note As (⇧⌘C)
Submenu "Save As...":
- **Markdown** 
- **HTML**
- **Plain Text**

### 4.2 Share
Al exportar/copiar, integración con el share sheet de macOS:
- Messages
- Notes (Apple Notes)
- Freeform
- Reminders

---

## 5. Toolbar (Barra Superior)

De izquierda a derecha:
- **Semáforo macOS** (🔴🟡🟢) — cerrar minimiza a tray, no cierra la app
- **Título de la nota** centrado (derivado de la primera línea del contenido)
- **Botones a la derecha**:
  - ⌘K (Action Panel)
  - 📋 (Browse Notes / ⌘P)
  - ➕ (New Note / ⌘N)

---

## 6. Otras Funciones

### 6.1 Window Settings
- **Enable Window Auto-sizing** (`⇧⌘/`) — toggle
- **Hide Format Bar** (`⌥⌘,`) — toggle
- **Reset Zoom** (`⌘0`)
- **Zoom In** (`⌘+`)
- **Zoom Out** (`⌘-`)
- **Hide While Screen Sharing** (`⇧⌘H`) — ocultar durante screen sharing

### 6.2 Persistencia
- Las notas se guardan automáticamente mientras se editan (auto-save)
- Formato de almacenamiento interno: JSON con estructura del documento rico
- Almacenamiento local en `~/Library/Application Support/QuickNotes/`

### 6.3 Toast Notifications
- "Note duplicated" al duplicar una nota (toast transitorio en la parte superior)

---

## 7. Flujos de Usuario Principales

### Flujo 1: Captura rápida de idea
1. Usuario trabaja en cualquier app → presiona `⌥N`
2. Ventana de QuickNotes aparece flotando
3. Empieza a escribir inmediatamente (cursor ya posicionado)
4. Cierra con `⌥N` o `Esc` → la nota se guarda automáticamente

### Flujo 2: Formateo durante escritura
1. Escribe `# Mi Header` + Enter → se convierte en H1
2. Escribe `- item` + Enter → crea bullet list
3. Tab para indentar → sub-bullet
4. Enter en línea vacía → sale de la lista
5. Selecciona texto → `⌘B` → se pone en negrita

### Flujo 3: Navegar entre notas
1. `⌘P` → abre Browse Notes
2. Busca por texto → filtra la lista
3. Click en la nota deseada → se abre
4. `⌘[` para volver a la nota anterior

### Flujo 4: Exportar nota
1. `⌘K` → abre Action Panel
2. Selecciona "Copy Note As..."
3. Elige formato (Markdown/HTML/Plain Text)
4. Contenido copiado al clipboard

---

## 8. Propuesta de Stack Técnico

### Stack Confirmado: Tauri v2 + TipTap

- **Framework**: Tauri v2 (Rust backend, frontend web)
- **Editor**: TipTap (ProseMirror) — el motor principal del editor WYSIWYG
- **UI**: React + TypeScript + Tailwind CSS
- **Almacenamiento**: SQLite via tauri-plugin-sql
- **Hotkey global**: tauri-plugin-global-shortcut
- **System tray**: tauri-plugin-tray
- **Ventajas**: Liviano (~15-30MB RAM), acceso a APIs nativas macOS vía Rust, TipTap resuelve el 80% de la complejidad del editor
- **IDE de desarrollo**: Cursor con Claude Code

---

## 9. Edge Cases y Error Handling

- **Nota vacía**: se auto-elimina si el usuario navega a otra nota sin escribir nada
- **Hotkey en conflicto**: detectar y notificar si otro app ya usa el mismo atajo
- **Pérdida de datos**: auto-save cada keystroke con debounce de 500ms
- **Notas muy largas**: virtualización del scroll para notas > 10,000 caracteres
- **Múltiples monitores**: recordar en qué monitor estaba la ventana
- **Copy/Paste**: al pegar texto rico, convertir a los formatos soportados (strip de formatos no soportados)
- **Crash recovery**: mantener backup de la última sesión

---

## 10. Out of Scope (V1)

- Sincronización cloud entre dispositivos
- Versión iOS/mobile
- Integración con AI (fix spelling, change tone)
- Snippets / Quicklinks (funcionalidades del ecosistema Raycast)
- Imágenes embebidas en notas (Raycast Notes es text-only según fuentes)
- Colaboración en tiempo real
- Plugins / extensibilidad
- Dark/Light theme toggle (solo dark en V1)
- Drag & drop de archivos
- Syntax highlighting en code blocks

---

## 11. Decisiones Confirmadas

| # | Pregunta | Decisión |
|---|----------|----------|
| 1 | ¿Soporte de imágenes? | No en V1, sí en V2 |
| 2 | ¿Límite de notas? | **Sin límite** (razón de ser del proyecto) |
| 3 | ¿Sincronización? | No en V1, posiblemente V2 |
| 4 | ¿Nombre? | **FreeCastNotes** |
| 5 | ¿Stack? | **Tauri v2 + React + TipTap + TypeScript + Tailwind** |
| 6 | ¿Action Panel V1? | **Sí, es prioritario** |
| 7 | ¿Licencia? | **MIT** (open source público) |
