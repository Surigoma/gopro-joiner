# Releasing

[日本語](releasing.ja.md)

Releases are built only by GitHub Actions from a version tag on `main`.

1. Update `version` in `package.json` and merge the change into `main` through a pull request.
2. Confirm that the `main` CI run succeeds.
3. Create and push an annotated tag that exactly matches the package version:

   ```powershell
   git switch main
   git pull --ff-only
   git tag -a v0.1.0 -m "GoPro Joiner v0.1.0"
   git push origin v0.1.0
   ```

The release workflow rejects a mismatched version or a commit that is not contained in `main`. It rebuilds and smoke-tests the application on Windows, macOS, and Linux, archives the portable applications, generates `SHA256SUMS.txt`, and publishes the files with generated release notes. A SemVer prerelease tag such as `v0.2.0-rc.1` creates a GitHub prerelease.

The portable applications are not currently code-signed or notarized. Add signing only after the required platform certificates and protected release secrets are available.
