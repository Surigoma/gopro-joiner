# セキュリティ例外

[English](security-exceptions.md)

## SEC-2026-08-10-01 nanoid

- 理由: high脆弱性GHSA-2v37-7h3g-55p8を修正する3.3.17が、導入時点で7日間の公開待機期間内にあるため。
- 対応: `resolutions` で3.3.17へ固定し、このパッケージだけを `npmPreapprovedPackages` へ追加する。
- 影響: ViteからPostCSSを介した開発時依存。アプリの実行時bundleには含めない。
- 失効日: 2026-08-17。失効後は `.yarnrc.yml` の `nanoid` 事前承認を削除し、固定と監査を維持する。
- 承認者: プロジェクト所有者の確認待ち。
