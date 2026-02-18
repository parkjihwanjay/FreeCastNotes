# =============================================================================
# Makefile - FreeCastNotes
# =============================================================================
# Stack: Swift (AppKit + WKWebView) + React + TypeScript + Vite
# =============================================================================

.PHONY: help dev dev-front dev-swift build build-debug bundle dmg clean clean-front \
        clean-swift check open install kill

C := \033[36m
G := \033[32m
Y := \033[33m
R := \033[31m
N := \033[0m

.DEFAULT_GOAL := help

help:
	@echo ""
	@echo "$(C)FreeCastNotes - Comandos$(N)"
	@echo ""
	@echo "$(G)Desarrollo:$(N)"
	@echo "  dev           Levanta Vite + Swift app en modo dev"
	@echo "  dev-front     Levanta solo el frontend (Vite en :1420)"
	@echo "  dev-swift     Levanta solo la app Swift (requiere Vite corriendo)"
	@echo ""
	@echo "$(G)Build:$(N)"
	@echo "  build         Build de producción (frontend + Swift release)"
	@echo "  build-debug   Build de debug Swift (más rápido)"
	@echo "  bundle        Genera FreeCastNotes.app en build/"
	@echo "  dmg           Genera FreeCastNotes.dmg para distribución"
	@echo ""
	@echo "$(G)Verificación:$(N)"
	@echo "  check         Type-check del frontend (tsc)"
	@echo ""
	@echo "$(G)Mantenimiento:$(N)"
	@echo "  install       Instala dependencias (npm + Swift packages)"
	@echo "  clean         Limpia todo (front + Swift + build)"
	@echo "  clean-front   Limpia dist/ y node_modules/.vite"
	@echo "  clean-swift   Limpia .build/ de Swift"
	@echo "  kill          Mata procesos de FreeCastNotes y Vite (:1420)"
	@echo "  open          Abre FreeCastNotes.app"
	@echo ""

# === DESARROLLO ===

dev:
	@echo "$(G)Levantando FreeCastNotes en modo dev...$(N)"
	@echo "$(C)  Vite → http://localhost:1420$(N)"
	@echo "$(C)  Swift app cargará desde Vite$(N)"
	@echo ""
	@npx vite & sleep 2 && cd swift-app && swift run

dev-front:
	@echo "$(G)Levantando solo frontend (Vite)...$(N)"
	@npm run dev

dev-swift:
	@echo "$(G)Levantando solo Swift app...$(N)"
	@echo "$(Y)Asegurate de que Vite esté corriendo (make dev-front)$(N)"
	@cd swift-app && swift run

# === BUILD ===

build:
	@echo "$(G)Build de producción...$(N)"
	@npx tsc --noEmit
	@npx vite build
	@cd swift-app && swift build -c release
	@echo "$(G)Build completado.$(N)"
	@echo "  Frontend: dist/"
	@echo "  Swift:    swift-app/.build/release/FreeCastNotes"

build-debug:
	@echo "$(Y)Build de debug...$(N)"
	@cd swift-app && swift build
	@echo "$(G)Build debug completado.$(N)"
	@echo "  swift-app/.build/debug/FreeCastNotes"

bundle: build
	@echo "$(G)Creando FreeCastNotes.app...$(N)"
	@./src/scripts/bundle-app.sh release

dmg: bundle
	@echo "$(G)Creando FreeCastNotes.dmg...$(N)"
	@./src/scripts/create-dmg.sh

# === VERIFICACIÓN ===

check:
	@echo "$(C)Type-checking frontend...$(N)"
	@npx tsc --noEmit
	@echo "$(G)OK$(N)"

# === MANTENIMIENTO ===

install:
	@echo "$(C)Instalando dependencias npm...$(N)"
	@npm install
	@echo "$(C)Resolviendo Swift packages...$(N)"
	@cd swift-app && swift package resolve
	@echo "$(G)Dependencias instaladas.$(N)"

clean: clean-front clean-swift
	@rm -rf build/
	@echo "$(G)Limpieza completa.$(N)"

clean-front:
	@echo "$(Y)Limpiando frontend...$(N)"
	@rm -rf dist node_modules/.vite

clean-swift:
	@echo "$(Y)Limpiando Swift...$(N)"
	@cd swift-app && swift package clean

kill:
	@echo "$(Y)Matando procesos...$(N)"
	@-pkill -f ".build/debug/FreeCastNotes" 2>/dev/null
	@-pkill -f ".build/release/FreeCastNotes" 2>/dev/null
	@-lsof -ti:1420 | xargs kill -9 2>/dev/null
	@echo "$(G)Procesos terminados.$(N)"

open:
	@open build/FreeCastNotes.app 2>/dev/null || \
	 echo "$(R)No se encontró FreeCastNotes.app. Ejecutá 'make bundle' primero.$(N)"
