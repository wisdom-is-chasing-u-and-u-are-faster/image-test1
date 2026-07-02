# Changelog

## [Unreleased]

### Added

- **Enterprise KYC Onboarding Flow**: Introduced a new, comprehensive 8-step user onboarding and identity verification (KYC) flow.
  - Added 8 new interactive UI screens for the end-to-end user journey, including welcome, user registration, MFA setup, document selection, document capture, biometric scanning, review, and confirmation.
  - Implemented frontend components in React for each step of the process, ensuring a modular and maintainable architecture.
  - Included business logic for OCR data simulation, data cross-validation between user-entered and document-extracted data, and automated routing for manual reviews based on a 15% mismatch threshold.
