# 実素材テストマトリクス

[English](media-test-matrix.md)

## 自動統合試験

`task test:media-matrix` は、GoPro公式 `gopro/gpmf-parser` の `samples` を `.cache/gpmf-parser/samples` に用意した状態で実行する。元サンプルを変更せず試験用ディレクトリへコピーし、各素材を2チャプターとして結合する。出力は映像・音声・GPMFの全パケットpayload、主要GPMFキー、時間範囲をバックエンド本体で検証する。

長時間の私有実素材は `TAKEBINDER_REAL_INPUT` と `TAKEBINDER_REAL_OUTPUT` を設定して `task test:real-media` を実行する。入力のファイル名、サイズ、更新日時を処理前後で照合する。

| 素材 | 世代 | コーデック | 色 | 結果 |
| --- | --- | --- | --- | --- |
| `hero5.mp4` | HERO5 | H.264 | BT.709 | 自動試験対象 |
| `hero8.mp4` | HERO8 | H.264 | BT.709 | 自動試験対象 |
| `max-heromode.mp4` | MAX | H.264 | BT.709 | 自動試験対象 |
| `hero8.mp4` 由来試験fixture | 人工fixture | H.265 | BT.2020 / PQ | 自動試験対象 |
| `F:\gopro\orig_base` | HERO11系（firmware `H21`） | H.265 | BT.709 | 5チャプター、約36分の実素材で検証済み |

GoPro公式サンプルの出典とライセンスは、公式リポジトリの `samples/SAMPLES.md` およびリポジトリライセンスに従う。サンプル自体は本リポジトリや配布物へ含めない。

## HDR

現在確認できる実GoPro素材はBT.709であり、実機撮影HDR素材は未提供。公式HERO8サンプルの映像だけを試験準備時にH.265 BT.2020/PQへ変換し、音声とGPMFはコピーした人工fixtureで色特性を維持したストリームコピー結合を検証する。この準備時変換はアプリの処理ではなく、入力fixture作成に限定する。実機HDR素材入手後は本表へ機種、撮影モード、ビット深度、伝達特性を追加する。
