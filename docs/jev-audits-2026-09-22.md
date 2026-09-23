# Jev audit passes + cross-source verification - 2026-09-22

Live runs through the Jev Worker relay against the v0.3.0 dataset. All passes
are report-only: no labels, statuses, or citations were changed. Educational
content QA, never clinical advice.

## Totals

| Pass | Calls (ok/failed) | Input tokens | Cost |
|---|---|---|---|
| #3 Evidence-level overclaim | 305 / 0 | 185,633 | $0.007797 |
| #4 Citation freshness | 48 / 0 | 44,080 | $0.001851 |
| #5 Cue focus labels | 1,097 / 0 | 496,018 | $0.020833 |
| **Total** | **1,450 / 0** | **725,731** | **$0.030481** |

p50 latency 400 ms, max 1.48 s. Cross-source verification uses free public APIs only, with no Jev spend.

## Cross-source verification (`pnpm sources:crosscheck`)

Sources used: PubMed E-utilities (the "PubMed API" already feeding intake),
Europe PMC, OpenAlex, Crossref, and Semantic Scholar (optional; its shared free
pool often returns 429). PEDro is **not** queried: its fair-use terms forbid
automated or bulk downloading, so the report gives a manual PEDro search link.

- **Intake shortlist (18):** 18/18 corroborated in at least 4 sources, none
  retracted. One article (PMID 33855879) is online-first 2021, print 2023; the
  year tolerance is +/-2 for that reason. 12 have an open-access full-text URL.
- **Existing corpus (305 sources with a PMID or DOI):** 280 corroborated, 6
  partial, 19 conflict, 0 retracted. At least 13 of the conflicts are stored
  identifiers that resolve to a clearly *different article* in every source that
  found it (for example alghadir, burton, coombes, fox, gates, habets, jenkins,
  katz, olewnik, roos, scaff, selistre, zeng). These records are all marked `reviewed`:

  - `alghadir-retro-walking-2019` (overlap 0%): stored "Effect of 6-Week Retro or Forward Walking Program on Pain, F" -> resolves to "Attenuation of neuroinflammation reverses Adriamycin-induced"
  - `beyer-hsr-vs-eccentric-2015` (overlap 57%): stored "HSR vs Eccentric Training for Achilles Tendinopathy: RCT" -> resolves to "Gender and eccentric training in Achilles mid‐portion tendin"
  - `burton-floor-rise-interventions-2020` (overlap 25%): stored "Are Interventions Effective for Floor Rise in Older Adults?" -> resolves to "Impact of the backward chaining method on physical and psych"
  - `coombes-lateral-epicondylalgia-2013` (overlap 28%): stored "Corticosteroid Injection, Physiotherapy, or Both for Lateral" -> resolves to "Psychosocial and personality factors and physical measures i"
  - `del-monte-kettlebell-hamstring-2020` (overlap 100%): stored "Hamstring Myoelectrical Activity During Three Different Kett" -> resolves to "Hamstring Myoelectrical Activity During Three Different Kett"
  - `fox-grip-emg-2019` (overlap 33%): stored "EMG Analysis of Grip" -> resolves to "Design of Virtual Reality-Enabled Surface Electromyogram-Tri"
  - `garber-acsm-exercise-quantity-2011` (overlap 57%): stored "ACSM Position Stand: Quantity and Quality of Exercise" -> resolves to "American College of Sports Medicine position stand. Quantity"
  - `gates-rom-upper-limb-adl-2015` (overlap 44%): stored "Range of Motion Requirements for Upper-Limb Activities of Da" -> resolves to "Designing and testing lightweight shoulder prostheses with h"
  - `habets-eccentric-achilles-review-2015` (overlap 50%): stored "Eccentric Exercise in Achilles Tendinopathy: Systematic Revi" -> resolves to "Effectiveness and safety of prolotherapy injections for mana"
  - `jenkins-thoracic-kyphosis-2021` (overlap 28%): stored "Treatments for Decreasing Thoracic Hyperkyphosis: Systematic" -> resolves to "Pulmonary function in children and adolescents with untreate"
  - `katz-lumbar-stenosis-2022` (overlap 14%): stored "Diagnosis and Management of Lumbar Spinal Stenosis: A Review" -> resolves to "Isthmic spondylolisthesis in adults&#x2026; A review of the "
  - `namdari-shoulder-rom-adl-2012` (overlap 44%): stored "Defining Functional Shoulder Range of Motion for Activities " -> resolves to "Motion capture of the upper extremity during activities of d"
  - `olewnik-quadriceps-heads-2021` (overlap 20%): stored "Quadriceps or Multiceps Femoris? — Cadaveric Study" -> resolves to "Electrically Evoked Torque at Rest is Strongly Related to Qu"
  - `roos-neuromuscular-2025` (overlap 30%): stored "An Exercise Therapists' Guide to Neuromuscular Exercise for " -> resolves to "Brain activity related to kinesiophobia before and after tot"
  - `scaff-lbp-prevention-2024` (overlap 55%): stored "Exercises for the Prevention of Non-Specific Low Back Pain" -> resolves to "Association between pain intensity and body composition in a"
  - `selistre-cervical-tests-2021` (overlap 46%): stored "Reliability and Validity of Clinical Tests for Measuring Str" -> resolves to "The Validity and Reliability of Two Commercially Available L"
  - `tanaka-hip-rom-satisfaction-2022` (overlap 57%): stored "Intraoperative Hip ROM Predicts Postoperative Patient Satisf" -> resolves to "Postoperative Alignment and ROM Affect Patient Satisfaction "
  - `tang-vmo-vl-2001` (overlap 50%): stored "VMO and VL Activity in OKC and CKC in PFP" -> resolves to "Comparison of two exercises on VMO and VL EMG activity and f"
  - `zeng-exercise-knee-oa-2022` (overlap 50%): stored "Benefits and Mechanisms of Exercise Training for Knee Osteoa" -> resolves to "Intraarticular Injections of Mesenchymal Stem Cells in Knee "

  Some conflicts with overlap near 50% are only abbreviated stored titles (for
  example the ACSM position stand). Each one needs a human check before any
  identifier is corrected.

## #3 Evidence-level overclaim

Rule: strong needs 2+ identifiable non-textbook sources, moderate needs 1.
- Deterministic: 148 matches, 153 overstated, 4 understated.
- Jev: 90 matches, 189 overstated, 26 understated. Agreement 80.98%.
- **153 exercises are overstated by both** (109 labeled moderate, 44 labeled
  strong), almost all with zero linked sources. These are the review list.
- 58 disagreements: Jev says overstated where the rule says matches (36), or
  understated (22). Human review decides.

## #4 Citation freshness

83 pre-2016 sources have a PMID. PubMed similar-articles gave 48 newer
(2016+) systematic reviews, meta-analyses, or guidelines for 27 of them.
- Jev: 26 different topic, 19 consistent update, 3 supersedes or contradicts.
- 14 refresh candidates for 11 old sources (same topic, confidence >= 0.75,
  worth-citing >= 0.5). Two newer reviews may narrow or contradict
  `holmgren-subacromial-exercise-2012` (PMID 31610787, 28416022).
- Full list: `exports/jev-audits/freshness/refresh-candidates.json`.

## #5 Cue focus labels

- Agreement with the 592 stored labels: 59.97%. Agreement with the regex heuristic: 61.8%.
- By stored label: internal 148/148; imagery 41/57; external 142/296; tactile 24/91.
- Jev tends to call clearly external cues internal ("Raise the heel toward the
  ceiling", "Keep the opposite leg pinned to the floor"). Tactile misses are
  mostly cues whose tactile label comes from the delivery type, not the text.
- **Verdict: do not apply Jev focus labels.** The 505 unlabeled cues keep no
  label. Next step: rework the focus definitions and test only against the 592
  labeled cues (about $0.012) before any relabel.

Reproduce: `pnpm jev:audit -- --pass overclaim|freshness|cues` (dry run), add
`--run` with `TYPESAFE_API_KEY`/`TYPESAFE_API_URL`, or `--answers <jsonl>`.
