# Changelog

## [Unreleased]

### Added
- **Corporate Website on Microservices Architecture (ARCH-3013):**
  - Implemented a new Flask-based backend with two microservice endpoints:
    - A Content Service (`GET /api/v1/content/<page_slug>`) to retrieve page content.
    - A Lead Capture Service (`POST /api/v1/leads`) to handle lead submissions.
  - Secured all endpoints using API Key authentication via the `X-API-Key` header.
  - Included comprehensive unit tests using `pytest` to ensure reliability.
  - Added a `README.md` with setup and usage instructions.
### Added
- **Corporate Website on Microservices Architecture (ARCH-3013):**
  - Implemented a Flask-based backend with two microservice endpoints:
    - `GET /api/v1/content/<page_slug>` (Content Service)
    - `POST /api/v1/leads` (Lead Capture Service)
  - Secured all endpoints with API Key authentication (`X-API-Key` header).
  - Added comprehensive unit tests using `pytest`.
  - Included `README.md` with setup and usage instructions.
