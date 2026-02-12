# =============================================================================
# Makefile - FreeCastNotes
# =============================================================================
# Convención: <verbo>[-modificador]
#   Verbos: dev, build, clean, check, logs, open
#   Modificadores: -front, -back, -debug
# =============================================================================

.PHONY: help dev build build-debug clean clean-front clean-back check check-front \
        check-back logs open install

C := \033[36m
G := \033[32m
Y := \033[33m
R := \033[31m
N := \033[0m

CARGO_PATH := $(HOME)/.cargo/bin
export PATH := $(CARGO_PATH):$(PATH)

.DEFAULT_GOAL := help

help:
	@echo ""
	@echo "$(C)FreeCastNotes - Comandos$(N)"
	@echo ""
	@echo "$(G)Desarrollo:$(N)"
	@echo "  dev           Levanta app en modo desarrollo"
	@echo "  dev-front     Levanta solo el frontend (Vite)"
	@echo "  logs          Muestra logs de Rust (RUST_LOG=debug)"
	@echo ""
	@echo "$(G)Build:$(N)"
	@echo "  build         Build de producción (.app + .dmg)"
	@echo "  build-debug   Build de debug (más rápido)"
	@echo ""
	@echo "$(G)Verificación:$(N)"
	@echo "  check         Verifica frontend + backend"
	@echo "  check-front   Type-check del frontend (tsc)"
	@echo "  check-back    Check del backend (cargo check)"
	@echo ""
	@echo "$(G)Mantenimiento:$(N)"
	@echo "  install       Instala dependencias (npm + cargo)"
	@echo "  clean         Limpia todo (front + back)"
	@echo "  clean-front   Limpia dist/ y node_modules/.vite"
	@echo "  clean-back    Limpia target/ de Rust"
	@echo "  open          Abre el .app generado"
	@echo ""

# === DESARROLLO ===

dev:
	@echo "$(G)Levantando FreeCastNotes en modo dev...$(N)"
	@npx tauri dev

dev-front:
	@echo "$(G)Levantando solo frontend (Vite)...$(N)"
	@npm run dev

logs:
	@RUST_LOG=debug npx tauri dev 2>&1

# === BUILD ===

build:
	@echo "$(G)Build de producción...$(N)"
	@npx tauri build
	@echo "$(G)Build completado.$(N)"

build-debug:
	@echo "$(Y)Build de debug...$(N)"
	@npx tauri build --debug
	@echo "$(G)Build debug completado.$(N)"

# === VERIFICACIÓN ===

check: check-front check-back
	@echo "$(G)Todo OK.$(N)"

check-front:
	@echo "$(C)Type-checking frontend...$(N)"
	@npx tsc --noEmit

check-back:
	@echo "$(C)Checking backend...$(N)"
	@cd src-tauri && cargo check

# === MANTENIMIENTO ===

install:
	@echo "$(C)Instalando dependencias npm...$(N)"
	@npm install
	@echo "$(C)Instalando dependencias Cargo...$(N)"
	@cd src-tauri && cargo fetch
	@echo "$(G)Dependencias instaladas.$(N)"

clean: clean-front clean-back
	@echo "$(G)Limpieza completa.$(N)"

clean-front:
	@echo "$(Y)Limpiando frontend...$(N)"
	@rm -rf dist node_modules/.vite

clean-back:
	@echo "$(Y)Limpiando backend...$(N)"
	@cd src-tauri && cargo clean

open:
	@open src-tauri/target/release/bundle/macos/FreeCastNotes.app 2>/dev/null || \
	 open src-tauri/target/debug/bundle/macos/FreeCastNotes.app 2>/dev/null || \
	 echo "$(R)No se encontró el .app. Ejecutá 'make build' primero.$(N)"
