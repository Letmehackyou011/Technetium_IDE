# Changelog
All notable changes to **Technetium IDE** will be documented in this file.

This project adheres to:
- **Semantic Versioning (SemVer)** — https://semver.org  
- **Keep a Changelog** format — https://keepachangelog.com/en/1.0.0/

---

## [Unreleased]
### Added
- Initial UI shell based on Electron + React + Monaco Editor  
- First-Run Wizard with model selection and manifest integration  
- Model Manager panel (start / stop / health check / active model storage)  
- Model download + SHA256 verification system  
- IPC bridge between renderer ↔ preload ↔ main process  
- Mock model-runner (`/health` and `/v1/completions` endpoints)  
- Workspace setup with PNPM and multi-package structure  
- Basic dark/light theme toggle  
- Initial error handling and configuration storage  
- Folder structure for services, scripts, UI, and Electron environment  

### Changed
- Improved `.gitignore` to exclude local models and build artifacts  
- Updated package.json with license, scripts, and workspace config  

### Fixed
- Git push/email privacy issues  
- Early path issues in Electron app structure  

### Security
- No security-related changes yet.

---

## [0.1.0] – Initial Pre-Release
**Release Date:** To be determined.

### Added
- Repository initialization  
- README, LICENSE, CONTRIBUTING, CODE_OF_CONDUCT  
- Issue and PR templates  
- Basic project documentation and architecture outline

---

## Legend
- **Added** — new features  
- **Changed** — updates to existing features  
- **Deprecated** — features soon to be removed  
- **Removed** — features removed  
- **Fixed** — bug fixes  
- **Security** — security-related improvements  

---

## Notes
This changelog will evolve as the project matures.  
All future versions (0.1.1, 0.2.0, 1.0.0, etc.) will be documented here.

