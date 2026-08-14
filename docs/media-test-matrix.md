# Real-media Test Matrix

[日本語](media-test-matrix.ja.md)

## Automated integration tests

`task test:media-matrix` expects the `samples` directory from GoPro's official `gopro/gpmf-parser` repository at `.cache/gpmf-parser/samples`. It copies source samples into a test directory without modifying them and joins each sample as two chapters. The backend verifies every video, audio, and GPMF packet payload, major GPMF keys, and the time range.

For private long-form footage, set `TAKEBINDER_REAL_INPUT` and `TAKEBINDER_REAL_OUTPUT`, then run `task test:real-media`. Input names, sizes, and modification times are compared before and after processing.

| Media | Generation | Codec | Color | Result |
| --- | --- | --- | --- | --- |
| `hero5.mp4` | HERO5 | H.264 | BT.709 | Covered by automated tests |
| `hero8.mp4` | HERO8 | H.264 | BT.709 | Covered by automated tests |
| `max-heromode.mp4` | MAX | H.264 | BT.709 | Covered by automated tests |
| Test fixture derived from `hero8.mp4` | Synthetic fixture | H.265 | BT.2020 / PQ | Covered by automated tests |
| `F:\gopro\orig_base` | HERO11 family (firmware `H21`) | H.265 | BT.709 | Verified with five chapters totaling about 36 minutes |

The official sample provenance and license are defined by `samples/SAMPLES.md` and the repository license. The samples themselves are not included in this repository or its distributions.

## HDR

The available real GoPro footage is BT.709; no camera-recorded HDR footage has been supplied. During test preparation only, video from the official HERO8 sample is converted to H.265 BT.2020/PQ while audio and GPMF are copied, producing a synthetic fixture that verifies stream-copy joins preserve color properties. This conversion creates an input fixture and is not performed by the application. When real HDR footage becomes available, add the camera model, recording mode, bit depth, and transfer characteristics to this table.
