# AGENTS.md

## Project

TakeBinderは、GoProの分割動画を録画単位でまとめて整理するクロスプラットフォームアプリである。UIはElectron/TypeScript、バックエンドはGoを使用する。製品仕様の入口は `docs/SPECIFICATION.md`。

## Before changing code

1. `docs/SPECIFICATION.md` と変更対象に対応する仕様書を読む。
2. 仕様が不明確なら、入力を壊さない保守的な動作を選ぶ。
3. 新しい依存や抽象化を追加する前に、標準ライブラリと既存コードで足りるか確認する。

## Non-negotiable rules

- 入力動画を変更、移動、削除しない。
- 映像と音声を再エンコードしない。非互換時に自動変換しない。
- 入力にある `gpmd` / GPMFを出力で保持し、処理後に検証する。
- 検証できない出力を成功扱いにしない。
- 単独ファイルはリマックスせず、バイトコピーする。
- 出力を暗黙に上書きしない。一時ファイルを検証してから完成名へ確定する。
- 撮影グループ間は並列化してよいが、グループ内のチャプター順序を守る。

## Architecture boundaries

- Electron Renderer: UIと表示のみ。Node.jsやファイルシステムへ直接アクセスしない。
- Rendererの依存はViteのbundleへ閉じ込め、Electron Main/preloadのNode.js向け出力へ混在させない。
- Electron Main: ウィンドウ、ダイアログ、preload、Goプロセスの起動と中継を担当する。
- Go Backend: 走査、分類、ジョブ制御、コピー、外部ツール実行、検証、レポートを担当する。
- ElectronとGoはJSON Linesで通信する。stdoutはプロトコル専用、診断ログはstderrへ出す。
- 外部コマンドはシェル経由で組み立てず、実行ファイルと引数配列を渡す。

## Implementation style

- 必要になるまで汎用化しない。1実装しかないインターフェースや将来用の設定を作らない。
- Goは標準ライブラリを優先し、処理キャンセルには `context.Context` を通す。
- TypeScriptで `any` を避け、IPC境界の入力を検証する。
- OS固有のパス文字列を手作業で連結せず、各言語のパスAPIを使う。
- エラーには仕様書の安定したエラーコードを付け、ユーザー向け文言と診断情報を分ける。
- 仕様変更を伴う実装では、同じ変更内で該当する `docs/` 文書も更新する。

## Dependency and supply-chain policy

- JavaScript依存を追加する前に、標準APIまたは既存依存で代替できないことを確認する。
- Yarnの直接依存は完全なバージョンで固定し、`yarn.lock` を同じ変更へ含める。
- `corepack yarn install --immutable` を使い、未固定パッケージを取得する `yarn dlx` や手編集したlockfileを使わない。
- `.yarnrc.yml` の `enableScripts: false` を無効化しない。必要なinstall-time処理は内容とバージョンを確認した明示Taskにする。
- `packageManager` の固定Yarnバージョンを無断更新しない。
- `yarn up` による無検証の一括更新を行わない。
- 依存更新PRに無関係なアプリ変更を混ぜない。
- GitHub Actionsは完全なcommit SHAへ固定し、workflow権限を明示する。
- Go依存と同梱ネイティブバイナリも、バージョン、取得元、チェックサムを固定する。
- `backend/tools.go` のツールmanifestを変更するときは、配布元、固定URL、実ファイルサイズ、SHA-256を再確認する。リモートmanifestや「latest」URLへ置き換えない。
- 外部から取得したGPACインストーラーをアプリやCIで自動実行しない。署名と配布形態を個別に再評価した変更だけを許可する。
- 例外が必要な場合は、理由、影響、承認者、失効日を文書化する。

## Verification

- 変更したコンポーネントのフォーマット、静的解析、テストを実行する。
- Goの非自明なロジックにはテーブル駆動テストを追加する。
- IPCの変更にはElectron側とGo側の契約テストを追加する。
- メディア処理の変更は、映像・音声が再エンコードされていないこととGPMF保持の両方を確認する。
- 実GoPro素材がなく検証できない場合、その制約を完了報告に明記する。
- UI型検査とバックエンドテストは `task check`、全体ビルドは `task build` を使う。
- Electron初回取得は、固定済みパッケージに対して `task install:electron` を明示実行する。
- Yarn依存変更時は、lockfile整合性、install-timeスクリプト設定、`task audit`を確認する。
