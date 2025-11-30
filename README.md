# Technetium IDE

Technetium IDE — a privacy-first, open-source, desktop code editor with integrated local LLM support.  
Windows-first (native `.exe`), offline-capable — choose and run local models (llama.cpp / Ollama / custom) from a first-run wizard. Designed to be lightweight, secure, and extensible.

---

## Highlights

- Desktop Electron + React + Monaco Editor UI  
- Local model manager: download, verify (SHA256), set active model  
- Model runner service with start / stop / health checks  
- Offline-first: run open-source LLMs locally (no credits required)  
- Extensible runtime: support for `mock`, `llama_cpp`, `ollama` and future backends  
- Installer-ready (electron-builder / NSIS) for Windows

---

## Quick demo (dev)

> These commands assume you have `pnpm` installed and you're on Windows. Move repo out of OneDrive if you hit file-lock issues.

```powershell
# 1) install (from repo root)
pnpm install

# 2) start mock model server (optional if testing manual server)
pnpm run dev:model

# 3) start desktop dev (Vite + Electron + preload watch)
pnpm --filter electron-ui run dev:desktop

```
## Support
> Only supports in Windows (Temporarily)
