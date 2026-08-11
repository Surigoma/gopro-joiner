# Security Exceptions

[日本語](security-exceptions.ja.md)

## SEC-2026-08-10-01 nanoid

- Reason: Version 3.3.17, which fixes high-severity vulnerability GHSA-2v37-7h3g-55p8, was still within the seven-day publication hold when introduced.
- Mitigation: Pin 3.3.17 through `resolutions` and add only this package to `npmPreapprovedPackages`.
- Impact: Development dependency reached from Vite through PostCSS; it is not included in the application runtime bundle.
- Expiration: 2026-08-17. After expiration, remove the `nanoid` preapproval from `.yarnrc.yml` while retaining the pin and audit checks.
- Approver: Awaiting confirmation from the project owner.
