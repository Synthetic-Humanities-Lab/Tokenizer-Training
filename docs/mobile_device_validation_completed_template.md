# Tokenizer Training Mobile Device Validation Completed

Use this local file only after running the physical-device checklist in `docs/mobile_device_validation.md`. It is ignored by Git because it can contain private physical-test artifacts, device details, and observer notes. Keep contradictions and failures. Do not mark a target pass unless the actual device evidence proves it.

Put physical evidence artifacts in `docs/mobile_device_evidence/` unless the validator is run with `--evidence-root`. Use the preferred filenames in `docs/mobile_device_evidence_manifest.md`. Any `.png`, `.jpg`, `.mov`, `.mp4`, or `.md` filename referenced below must exist in that evidence directory or validation fails. Placeholder files are rejected: images must be real PNG/JPEG files, videos must look like MP4/QuickTime recordings, and observer-note markdown must contain concrete touch/audio observations. Desktop browser harness evidence must identify the pinned `1280x720` endless `qaFixtureId=simple_001` browser route, normally saved as `desktop-pinned-fixture.png`.

For persistence evidence, a full relaunch means fully terminating the native app and launching it normally without a QA route override. Best Rank evidence must show the persisted `Best Rank` and rounds on the default menu after that relaunch. Sound evidence must show `Sound: Off` in Settings after that relaunch, and an observer note or recording must confirm it was set in Settings before termination. A menu capture or QA metadata does not prove Sound persistence.

Menu evidence must explicitly identify visible `Best Rank`, `Tutorial`, `Training`, `Token Log`, and `Settings`; there is no menu Sound control. The Training sample must show at least five consecutive rounds inside one uncapped run and continuation beyond round five while Token Credits remain, not a five-round completion boundary. Play-screen reach evidence must address `Sound`/`Muted`, `Clear`, `Exit`, `Resolve`, `Next`, `Continue`, and `Finish`. Results reach evidence must separately address `Review Token Log`, `Run Training Again`, and `Return to Menu`.

## Validation Metadata

- Date:
- Build or commit:
- Validator:
- Browser/server URL:
- Native build:
- Evidence directory: docs/mobile_device_evidence
- Notes:

## Target Evidence

| Target | Device / Browser | Evidence File Or Note | Verdict |
| --- | --- | --- | --- |
| iPhone SE/small phone portrait |  |  |  |
| Standard portrait phone |  |  |  |
| Large phone portrait |  |  |  |
| Desktop browser harness |  |  |  |

## Physical Checklist

| Check | Evidence | Verdict |
| --- | --- | --- |
| Menu readable |  |  |
| Safe areas clear |  |  |
| Tutorial slicing works by touch |  |  |
| Tutorial review feedback card readable |  |  |
| Training observation sample covers at least five rounds |  |  |
| Play-screen thumb reach acceptable |  |  |
| Results thumb reach acceptable |  |  |
| Finger occlusion acceptable |  |  |
| Touch latency acceptable |  |  |
| Input-feel metrics captured |  |  |
| Best Rank persistence visible after relaunch |  |  |
| Audio silent on boot and plays after user action |  |  |
| Sound persistence visible in Settings after relaunch |  |  |
| WienerWorks visual tone intentional |  |  |
| Desktop browser harness still matches browser contract |  |  |

## Evidence Inventory

- Small-phone menu:
- Small-phone active tutorial after at least one staged cut:
- Small-phone review feedback card:
- Standard-phone Training observation sample:
- Large-phone menu:
- Large-phone active play:
- Native relaunch persisted Best Rank:
- Native relaunch persisted Sound Off in Settings:
- Observer note on thumb reach, finger occlusion, touch latency, and audio output:
- Input-feel copied summary or trace:
- Desktop browser pinned fixture:

## Final Decision

- Mobile device validation passed:
- Required changes before completion:
