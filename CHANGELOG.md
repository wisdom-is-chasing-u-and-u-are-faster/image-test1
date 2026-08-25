# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **[ARCH-358]** UI Pages + Requirements: E-commerce Website based on visual reference.
  - **Flask Application (`app.py`):** Added application routes for `/`, `/home`, `/home.html`, `/index.html`, `/health`, and `/api/products`.
  - **Templates (`templates/home.html`, `templates/index.html`):** Scaffolded responsive e-commerce homepage and preview page with navigation header, promotional hero banner, featured product grid, and footer.
  - **Design System & Styling:** Configured brand theme tokens (custom color palette `--primary-brand-pink`, `--primary-brand-orange`, `--action-blue`), Poppins typography, 8pt spacing grid, and mobile breakpoints (768px, 375px).
  - **Testing & Verification (`tests/test_app.py`):** Added automated unit and integration test suite covering AC1 (visual layout), AC2 (header navigation & actions), AC3 (color palette and fonts), and API health checks.
  - **Dependencies (`requirements.txt`):** Added project dependencies for Flask, Pytest, Flake8, and Mypy.
