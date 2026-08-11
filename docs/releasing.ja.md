# リリース手順

[English](releasing.md)

Release Pleaseが、`main`のConventional Commitsからバージョンと`CHANGELOG.md`を生成します。

1. すべてのPull Requestに、`feat: add capture filter`、`fix(ui): keep settings visible`、`docs: clarify installation`のようなConventional Commit形式のタイトルを付けます。破壊的変更には`squash`コミット本文の`BREAKING CHANGE:`または`feat!:`を使用します。
2. squash mergeします。GitHubはPull Requestタイトルをコミット件名に使うため、`main`にはPull Requestごとに1件のConventional Commitが残ります。
3. Release Pleaseが、次のバージョン、`package.json`、`CHANGELOG.md`を含むリリースPull Requestを作成または更新します。標準`GITHUB_TOKEN`で作られたPull Requestでは、GitHubに表示されるCI実行の承認を行います。
4. リリースPull Requestを確認してマージします。Release PleaseがバージョンタグとGitHub Releaseを作成し、同じworkflowがWindows、macOS、Linux版を再ビルド・スモークテストして、`SHA256SUMS.txt`とともに添付します。

生成済みの変更履歴、バージョンタグ、リリースバージョンは手動編集しません。次のバージョンを明示する場合は、Conventional Commit本文に`Release-As: x.y.z`を記載します。

現在のポータブルアプリはコード署名および公証を行いません。署名は、各プラットフォーム用の証明書と保護されたリリースシークレットを用意してから追加します。
