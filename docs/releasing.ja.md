# リリース手順

[English](releasing.md)

リリースは、`main` 上のバージョンタグからGitHub Actionsだけで作成します。

1. `package.json` の `version` を更新し、Pull Request経由で `main` へマージします。
2. `main` のCIが成功したことを確認します。
3. パッケージのバージョンと完全に一致する注釈付きタグを作成してpushします。

   ```powershell
   git switch main
   git pull --ff-only
   git tag -a v0.1.0 -m "GoPro Joiner v0.1.0"
   git push origin v0.1.0
   ```

リリースworkflowは、バージョンが一致しないタグと、`main` に含まれないコミットを拒否します。Windows、macOS、Linuxで再ビルドとスモークテストを行い、ポータブルアプリをアーカイブし、`SHA256SUMS.txt` を生成して、自動生成したリリースノートとともに公開します。`v0.2.0-rc.1` のようなSemVerプレリリースタグはGitHubのプレリリースとして公開します。

現在のポータブルアプリはコード署名および公証を行いません。署名は、各プラットフォーム用の証明書と保護されたリリースシークレットを用意してから追加します。
