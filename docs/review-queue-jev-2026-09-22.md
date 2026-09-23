# Body IQ — review triage queue (Jev-ranked, validation pass 2026-09-22)

_305 records, all status=draft. Stage 1: deterministic port of score-exercises.ts + cue-quality.ts on the v0.3.0 dataset export. Stage 2: Jev (jev-1.13.0 via jev-latest) ranked all 305 — one batched call per record, advisory ordering only. Measured cost $0.011 (261,825 input tokens, p50 120ms)._

Jev only ordered this queue. It changed no clinical content, no citations, no status.

## Top 25

### 1. [side-bridge] Side-Bridge

Jev priority **3.97/4** — evidence-gap (research-first 90%) · composite 68/100 · confidence 0.88 · evidenceLevel moderate · sources 0
Signals: conflicting-evidence(medium), suspiciously-confident, very-confident-no-sources, evidence-claim-no-sources, emg-claims-unlinked, research-gap:no-sources
Why: no linked sources; 1 regressions

### 2. [sitting-ccf-oblique-band] Sitting Craniocervical Flexion with Oblique Band Resistance

Jev priority **3.96/4** — evidence-gap (research-first 89%) · composite 72/100 · confidence 0.8 · evidenceLevel moderate · sources 0
Signals: conflicting-evidence(medium), suspiciously-confident, evidence-claim-no-sources, emg-claims-unlinked, research-gap:no-sources
Why: no linked sources

### 3. [pfm-lengthening-positions] Supported Pelvic Floor Lengthening Positions

Jev priority **3.93/4** — coherence-conflict (research-first 86%) · composite 59/100 · confidence 0.75 · evidenceLevel moderate · sources 0
Signals: suspiciously-confident, evidence-claim-no-sources, cues-uncited-on-evidenced-exercise, coherence-conflict, research-gap:no-sources
Why: no linked sources; no EMG notes; no primary muscle is a known mover of the linked movements; only 2 cues; 1 regressions; 0 external-focus cues; only 2 cues

### 4. [thumb-putty-program] Comprehensive Thumb Putty Program

Jev priority **3.90/4** — overconfident-metadata (research-first 68%) · composite 74/100 · confidence 0.9 · evidenceLevel strong · sources 2
Signals: conflicting-evidence
Why: 1 regressions; 1 progressions

### 5. [mcgill-curl-up] McGill Curl-Up

Jev priority **3.90/4** — overconfident-metadata (research-first 70%) · composite 74/100 · confidence 0.95 · evidenceLevel strong · sources 2
Signals: conflicting-evidence
Why: 1 regressions; 1 progressions

### 6. [convergence-push-ups] Convergence Push-Ups (Near-Far Convergence)

Jev priority **3.86/4** — evidence-gap (research-first 89%) · composite 54/100 · confidence 0.9 · evidenceLevel strong · sources 0
Signals: suspiciously-confident, very-confident-no-sources, evidence-claim-no-sources, cues-uncited-on-evidenced-exercise, research-gap:no-sources
Why: no linked sources; no EMG notes; no primary mover on a non-stretch exercise; no linked movements; only 2 cues; 1 regressions; 1 progressions; 0 external-focus cues; internal-focus dominant; no tactile or imagery cue; only 2 cues

### 7. [upper-trapezius-stretch] Upper Trapezius Stretch

Jev priority **3.85/4** — coherence-conflict (research-first 67%) · composite 61/100 · confidence 0.85 · evidenceLevel moderate · sources 2
Signals: conflicting-evidence(medium), coherence-conflict
Why: no EMG notes; no primary muscle is a known mover of the linked movements; 1 regressions; 1 progressions

### 8. [vor-x1-gaze-stabilization] Gaze Stabilization — VOR ×1

Jev priority **3.84/4** — evidence-gap (research-first 90%) · composite 56/100 · confidence 0.95 · evidenceLevel strong · sources 0
Signals: suspiciously-confident, very-confident-no-sources, evidence-claim-no-sources, cues-uncited-on-evidenced-exercise, research-gap:no-sources
Why: no linked sources; no EMG notes; no primary mover on a non-stretch exercise; no linked movements; 1 regressions; 1 progressions; 0 external-focus cues; internal-focus dominant; no tactile or imagery cue

### 9. [pfm-sustained-hold] Pelvic Floor Sustained Contraction (Kegel — Endurance)

Jev priority **3.84/4** — evidence-gap (research-first 91%) · composite 59/100 · confidence 0.9 · evidenceLevel strong · sources 0
Signals: suspiciously-confident, very-confident-no-sources, evidence-claim-no-sources, cues-uncited-on-evidenced-exercise, research-gap:no-sources
Why: no linked sources; no EMG notes; no primary mover on a non-stretch exercise; no linked movements; 1 regressions; 0 external-focus cues

### 10. [active-straight-leg-raise] Active Straight Leg Raise (ASLR)

Jev priority **3.84/4** — evidence-gap (research-first 92%) · composite 75/100 · confidence 0.9 · evidenceLevel strong · sources 0
Signals: suspiciously-confident, very-confident-no-sources, evidence-claim-no-sources, emg-claims-unlinked, research-gap:no-sources
Why: no linked sources; 1 regressions

### 11. [calf-raise-explosive] Calf Raise (Explosive Concentric)

Jev priority **3.84/4** — evidence-gap (research-first 91%) · composite 78/100 · confidence 0.88 · evidenceLevel strong · sources 0
Signals: suspiciously-confident, very-confident-no-sources, evidence-claim-no-sources, emg-claims-unlinked, research-gap:no-sources
Why: no linked sources

### 12. [vor-x2-gaze-stabilization] Gaze Stabilization — VOR ×2

Jev priority **3.83/4** — evidence-gap (research-first 90%) · composite 54/100 · confidence 0.9 · evidenceLevel strong · sources 0
Signals: suspiciously-confident, very-confident-no-sources, evidence-claim-no-sources, cues-uncited-on-evidenced-exercise, research-gap:no-sources
Why: no linked sources; no EMG notes; no primary mover on a non-stretch exercise; no linked movements; only 2 cues; 1 regressions; 1 progressions; 0 external-focus cues; internal-focus dominant; no tactile or imagery cue; only 2 cues

### 13. [frog-pose-hold] Frog Pose Holds

Jev priority **3.83/4** — coherence-conflict (research-first 74%) · composite 69/100 · confidence 0.75 · evidenceLevel limited · sources 2
Signals: suspiciously-confident, coherence-conflict
Why: no primary muscle is a known mover of the linked movements

### 14. [wall-slide] Wall Slide

Jev priority **3.83/4** — evidence-gap (research-first 91%) · composite 75/100 · confidence 0.92 · evidenceLevel strong · sources 0
Signals: suspiciously-confident, very-confident-no-sources, evidence-claim-no-sources, emg-claims-unlinked, research-gap:no-sources
Why: no linked sources; 1 regressions

### 15. [foam-pad-sensory-perturbation] Foam Pad Balance with Sensory Perturbation

Jev priority **3.82/4** — evidence-gap (research-first 90%) · composite 54/100 · confidence 0.85 · evidenceLevel strong · sources 0
Signals: suspiciously-confident, very-confident-no-sources, evidence-claim-no-sources, cues-uncited-on-evidenced-exercise, research-gap:no-sources
Why: no linked sources; no EMG notes; no primary mover on a non-stretch exercise; no linked movements; only 2 cues; 1 regressions; 1 progressions; 0 external-focus cues; only 2 cues

### 16. [supine-scapular-punch] Supine Scapular Punch

Jev priority **3.82/4** — evidence-gap (research-first 91%) · composite 75/100 · confidence 0.9 · evidenceLevel strong · sources 0
Signals: suspiciously-confident, very-confident-no-sources, evidence-claim-no-sources, emg-claims-unlinked, research-gap:no-sources
Why: no linked sources; 1 regressions

### 17. [pfm-the-knack] The Knack (Pre-Contraction for Functional Continence)

Jev priority **3.81/4** — evidence-gap (research-first 91%) · composite 54/100 · confidence 0.9 · evidenceLevel strong · sources 0
Signals: suspiciously-confident, very-confident-no-sources, evidence-claim-no-sources, cues-uncited-on-evidenced-exercise, research-gap:no-sources
Why: no linked sources; no EMG notes; no primary mover on a non-stretch exercise; no linked movements; only 2 cues; 1 regressions; 1 progressions; 0 external-focus cues; internal-focus dominant; no tactile or imagery cue; only 2 cues

### 18. [pfm-diaphragmatic-release] Diaphragmatic Breathing with Pelvic Floor Release

Jev priority **3.81/4** — evidence-gap (research-first 90%) · composite 61/100 · confidence 0.85 · evidenceLevel strong · sources 0
Signals: suspiciously-confident, very-confident-no-sources, evidence-claim-no-sources, cues-uncited-on-evidenced-exercise, research-gap:no-sources
Why: no linked sources; no EMG notes; no linked movements; only 2 cues; 1 regressions; 1 progressions; 0 external-focus cues; internal-focus dominant; no tactile or imagery cue; only 2 cues

### 19. [heel-raise-eccentric] Heel Raise (Eccentric Emphasis)

Jev priority **3.81/4** — evidence-gap (research-first 92%) · composite 75/100 · confidence 0.9 · evidenceLevel strong · sources 0
Signals: suspiciously-confident, very-confident-no-sources, evidence-claim-no-sources, emg-claims-unlinked, research-gap:no-sources
Why: no linked sources; 1 regressions

### 20. [prone-y-raise] Prone Y-Raise

Jev priority **3.80/4** — evidence-gap (research-first 91%) · composite 75/100 · confidence 0.9 · evidenceLevel strong · sources 0
Signals: suspiciously-confident, very-confident-no-sources, evidence-claim-no-sources, emg-claims-unlinked, research-gap:no-sources
Why: no linked sources; 1 regressions

### 21. [low-row-band] Low Row (Band/Cable)

Jev priority **3.80/4** — evidence-gap (research-first 92%) · composite 75/100 · confidence 0.9 · evidenceLevel strong · sources 0
Signals: suspiciously-confident, very-confident-no-sources, evidence-claim-no-sources, emg-claims-unlinked, research-gap:no-sources
Why: no linked sources; 1 regressions

### 22. [hypothenar-reactivation-bendz] Hypothenar Reactivation (Bendz Method)

Jev priority **3.80/4** — evidence-gap (research-first 84%) · composite 60/100 · confidence 0.4 · evidenceLevel expert-opinion · sources 0
Signals: conflicting-evidence(medium), emg-claims-unlinked, research-gap:no-sources
Why: no linked sources; 1 regressions; 1 progressions

### 23. [nordic-hamstring-curl] Nordic Hamstring Curl

Jev priority **3.78/4** — evidence-gap (research-first 92%) · composite 75/100 · confidence 0.9 · evidenceLevel strong · sources 0
Signals: suspiciously-confident, very-confident-no-sources, evidence-claim-no-sources, emg-claims-unlinked, research-gap:no-sources
Why: no linked sources; 1 regressions

### 24. [side-lying-external-rotation] Side-Lying External Rotation

Jev priority **3.78/4** — evidence-gap (research-first 92%) · composite 75/100 · confidence 0.92 · evidenceLevel strong · sources 0
Signals: suspiciously-confident, very-confident-no-sources, evidence-claim-no-sources, emg-claims-unlinked, research-gap:no-sources
Why: no linked sources; 1 regressions

### 25. [wrist-extensor-stretch] Wrist Extensor Stretch

Jev priority **3.78/4** — coherence-conflict (research-first 66%) · composite 71/100 · confidence 0.85 · evidenceLevel moderate · sources 6
Signals: coherence-conflict
Why: no EMG notes; no primary muscle is a known mover of the linked movements; 1 regressions
