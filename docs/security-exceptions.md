# Security Exceptions

[日本語](security-exceptions.ja.md)

## Resolved: SEC-2026-08-10-01 nanoid

- Reason: Version 3.3.17 was initially believed to fix high-severity vulnerability GHSA-2v37-7h3g-55p8 and was still within the seven-day publication hold when introduced. The advisory was later expanded to include versions earlier than 3.3.18.
- Resolution: Pin 3.3.18 through `resolutions`. It was published on 2026-08-07 and had passed the seven-day hold by 2026-08-15, so the `nanoid` entry was removed from `npmPreapprovedPackages`.
- Impact: Development dependency reached from Vite through PostCSS; it is not included in the application runtime bundle.
- Resolved: 2026-08-15.
- Approver: Project owner.
