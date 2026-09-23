# Identifier fix proposals - 2026-09-22

REPORT ONLY. No corrections were applied. For each corpus source that
`sources:crosscheck` flagged as `conflict`, `scripts/identifier-fix-proposals.ts`
searched the stored title and first author in PubMed, Europe PMC, and OpenAlex.
It scored candidates by title overlap, author match, and year, dropped
letters, replies, and errata, and cross-checked the best candidate.

Strength: `strong` = title overlap >= 0.8, author and year match, 2+ engines
agree. `possible` = overlap >= 0.6 plus author or year. `none` = no usable
match; fix by hand.

| Source | Stored ID | Proposed PMID | Proposed DOI | Strength | Cross-check | Proposed title |
|---|---|---|---|---|---|---|
| alghadir-retro-walking-2019 | 31753024 | 30967128 | 10.1186/s12891-019-2537-9 | strong | corroborated | Effect of 6-week retro or forward walking program on pain, functional  |
| beyer-hsr-vs-eccentric-2015 | 10.1007/s00167-009-1006-7 | - | - | none | - |  |
| burton-floor-rise-interventions-2020 | 31939202 | 30512983 | 10.1080/09638288.2018.1508509 | strong | corroborated | Are interventions effective in improving the ability of older adults t |
| coombes-lateral-epicondylalgia-2013 | 29913915 | 23385272 | 10.1001/jama.2013.129 | strong | corroborated | Effect of corticosteroid injection, physiotherapy, or both on clinical |
| del-monte-kettlebell-hamstring-2020 | 28930870 | - | - | none | - |  |
| fox-grip-emg-2019 | 31841415 | 31408520 | 10.3928/01477447-20190812-06 | possible | corroborated | Electromyographic Analysis of Grip. |
| garber-acsm-exercise-quantity-2011 | 21694556 | 21694556 | 10.1249/MSS.0b013e318213fefb | stored-id-is-best-match | - | American College of Sports Medicine position stand. Quantity and quali |
| gates-rom-upper-limb-adl-2015 | 26185472 | 26709433 | 10.5014/ajot.2016.015487 | strong | corroborated | Range of Motion Requirements for Upper-Limb Activities of Daily Living |
| habets-eccentric-achilles-review-2015 | 26500703 | 24650048 | 10.1111/sms.12208 | strong | corroborated | Eccentric exercise training in chronic mid-portion Achilles tendinopat |
| jenkins-thoracic-kyphosis-2021 | 34963629 | 34375856 | 10.1016/j.msksp.2021.102438 | strong | corroborated | Decreasing thoracic hyperkyphosis - Which treatments are most effectiv |
| katz-lumbar-stenosis-2022 | 35597059 | 35503342 | 10.1001/jama.2022.5921 | possible | corroborated | Diagnosis and Management of Lumbar Spinal Stenosis: A Review. |
| namdari-shoulder-rom-adl-2012 | 23218727 | 22047785 | 10.1016/j.jse.2011.07.032 | possible | corroborated | Defining functional shoulder range of motion for activities of daily l |
| olewnik-quadriceps-heads-2021 | 36060895 | 32644202 | 10.1002/ca.23646 | possible | corroborated | Quadriceps or multiceps femoris?-Cadaveric study. |
| roos-neuromuscular-2025 | 41817454 | 40699605 | 10.2519/jospt.2025.13041 | strong | corroborated | An Exercise Therapists' Guide to Neuromuscular Exercise for People Wit |
| scaff-lbp-prevention-2024 | 39622629 | 39041371 | 10.1002/14651858.CD014146 | strong | corroborated | Exercises for the prevention of non-specific low back pain. |
| selistre-cervical-tests-2021 | 34960492 | 33383030 | 10.1016/j.apmr.2020.11.018 | strong | corroborated | Reliability and Validity of Clinical Tests for Measuring Strength or E |
| tanaka-hip-rom-satisfaction-2022 | 10.1007/s11999-012-2533-y | 34246529 | 10.1016/j.jos.2021.06.005 | possible | corroborated | The intraoperative hip range of motion in total hip arthroplasty predi |
| tang-vmo-vl-2001 | 10.3233/ies-1995-5201 | - | - | none | - |  |
| zeng-exercise-knee-oa-2022 | 36499280 | 34975542 | 10.3389/fphys.2021.794062 | strong | corroborated | Benefits and Mechanisms of Exercise Training for Knee Osteoarthritis. |

Notes:
- `garber-acsm-exercise-quantity-2011`: the stored PMID is already the best
  match (the conflict came from an abbreviated stored title). No change needed.
- `katz-lumbar-stenosis-2022`: the stored PMID is a JAMA reply letter; the
  proposal is the original review.
- `tanaka-hip-rom-satisfaction-2022`: stored DOI is a 2012 CORR paper; the
  proposal is a 2021 J Orthop Sci paper. Check which one the exercise claim uses.
- `beyer-hsr-vs-eccentric-2015`, `del-monte-kettlebell-hamstring-2020`,
  `tang-vmo-vl-2001`: no confident match. Look these up by hand.

To apply a confirmed fix, edit the source in `prisma/seed/sources.ts`, then
rerun `pnpm sources:crosscheck -- --corpus <dataset>`.
