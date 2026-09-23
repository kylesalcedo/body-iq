# Research intake pilot - 2026-09-22

Live Jev pass through the Worker relay, v0.3.0 dataset. Educational evidence
curation only; no diagnosis, no treatment advice, no database writes.

## Measured

| | Rehab goals | Weak exercises (first 40 with <2 identifiable sources) |
|---|---|---|
| Targets | 13 | 40 |
| PubMed zero-hit targets | 0 | 23 |
| Candidates found | 65 | 48 |
| Already in corpus | 4 | 1 |
| New candidates sent to Jev | 61 | 47 |
| Jev calls OK / failed | 61 / 0 | 47 / 0 |
| Jev relevance direct / indirect | 31 / 30 | 4 / 43 |
| Jev vs PubMed design agreement | 90.2% | 44.7% |
| Proposed (strict gate) | 0 | 0 |
| Shortlist (all checks except review probability) | 18 across 10 goals | 0 |
| Input tokens | 74,370 | 60,273 |
| Cost | $0.003124 | $0.002531 |

Total: 108 calls, 134,643 input tokens, $0.005655. p50 latency 324 ms, max 974 ms.

## Reading the result

- The strict gate proposed nothing. Jev's intake review probability never fell
  below 0.37 (median 0.71), so "a human should read this before linking" is
  Jev's default for new articles. That matches the project's validation-first
  rule, so the threshold was not loosened. The shortlist is the useful output.
- Goal-level search works: 31 of 61 new candidates were judged direct, and
  design agreement was 90%.
- Exercise-name search does not: 23 of 40 exercise names returned nothing in
  PubMed and 43 of 47 hits were indirect. Exercise evidence should come through
  the exercise's goals, movements, or muscles rather than its display name.
- Carpal tunnel, which the evidence gate downgraded to unsupported, now has
  three direct shortlist candidates. Tennis elbow has one, plantar fasciitis two.
  Hamstring strain has none (its one direct hit had relevance confidence 0.36).

## Shortlist (human approval required)

Ordered by Jev review probability, lowest first. `finding` is Jev's read of the abstract.

| Goal | Article | PMID | Year | Design | Finding | Review p |
|---|---|---|---|---|---|---|
| subacromial-pain | Effect of scapular stabilization exercises on subacromial pain (impingement) syndrome: a s | [38497039](https://pubmed.ncbi.nlm.nih.gov/38497039/) | 2024 | systematic-review-or-meta-analysis | supports-exercise | 0.44 |
| subacromial-pain | Scapular stabilization exercise training improves treatment effectiveness on shoulder pain | [38432789](https://pubmed.ncbi.nlm.nih.gov/38432789/) | 2024 | rct | supports-exercise | 0.54 |
| knee-osteoarthritis | Effects of exercise on knee osteoarthritis: A systematic review. | [33666347](https://pubmed.ncbi.nlm.nih.gov/33666347/) | 2021 | systematic-review-or-meta-analysis | supports-exercise | 0.55 |
| hip-osteoarthritis | The Benefits of Adding Manual Therapy to Exercise Therapy for Improving Pain and Function  | [35881705](https://pubmed.ncbi.nlm.nih.gov/35881705/) | 2022 | systematic-review-or-meta-analysis | mixed-or-uncertain | 0.57 |
| hip-osteoarthritis | Aquatic exercise for the treatment of knee and hip osteoarthritis. | [27007113](https://pubmed.ncbi.nlm.nih.gov/27007113/) | 2016 | systematic-review-or-meta-analysis | supports-exercise | 0.57 |
| lateral-ankle-sprain | Diagnosis, treatment and prevention of ankle sprains: update of an evidence-based clinical | [29514819](https://pubmed.ncbi.nlm.nih.gov/29514819/) | 2018 | guideline | supports-exercise | 0.57 |
| rotator-cuff-tendinopathy | Rotator Cuff Tendinopathy Diagnosis, Nonsurgical Medical Care, and Rehabilitation: A Clini | [40165544](https://pubmed.ncbi.nlm.nih.gov/40165544/) | 2025 | guideline | not-reported | 0.6 |
| carpal-tunnel | Comparative Efficacy of Routine Physical Therapy with and without Neuromobilization in the | [35782066](https://pubmed.ncbi.nlm.nih.gov/35782066/) | 2022 | rct | supports-exercise | 0.62 |
| carpal-tunnel | Effectiveness of Tendon and Nerve Gliding Exercises in the Treatment of Patients With Mild | [33855879](https://pubmed.ncbi.nlm.nih.gov/33855879/) | 2023 | rct | mixed-or-uncertain | 0.64 |
| low-back-pain | Exercise intervention for patients with chronic low back pain: a systematic review and net | [38035307](https://pubmed.ncbi.nlm.nih.gov/38035307/) | 2023 | systematic-review-or-meta-analysis | supports-exercise | 0.66 |
| low-back-pain | Exercise therapy for chronic low back pain. | [34580864](https://pubmed.ncbi.nlm.nih.gov/34580864/) | 2021 | systematic-review-or-meta-analysis | not-reported | 0.67 |
| tennis-elbow | Physiotherapy treatment of lateral epicondylitis: A systematic review. | [34397403](https://pubmed.ncbi.nlm.nih.gov/34397403/) | 2022 | systematic-review-or-meta-analysis | supports-exercise | 0.68 |
| plantar-fasciitis | Calf stretching and plantar fascia-specific stretching for plantar fasciitis: A systematic | [33218515](https://pubmed.ncbi.nlm.nih.gov/33218515/) | 2020 | systematic-review-or-meta-analysis | mixed-or-uncertain | 0.7 |
| achilles-tendinopathy | Nonoperative treatment of insertional Achilles tendinopathy: a systematic review. | [33785026](https://pubmed.ncbi.nlm.nih.gov/33785026/) | 2021 | systematic-review-or-meta-analysis | supports-exercise | 0.72 |
| carpal-tunnel | The Effectiveness of Neural Mobilization for Neuromusculoskeletal Conditions: A Systematic | [28704626](https://pubmed.ncbi.nlm.nih.gov/28704626/) | 2017 | systematic-review-or-meta-analysis | mixed-or-uncertain | 0.72 |
| lateral-ankle-sprain | Effect of aquatic versus conventional physical therapy program on ankle sprain grade III i | [38992731](https://pubmed.ncbi.nlm.nih.gov/38992731/) | 2024 | rct | supports-exercise | 0.73 |
| plantar-fasciitis | Strength training for plantar fasciitis and the intrinsic foot musculature: A systematic r | [27692740](https://pubmed.ncbi.nlm.nih.gov/27692740/) | 2017 | systematic-review-or-meta-analysis | mixed-or-uncertain | 0.77 |
| subacromial-pain | Effects of seven types of exercise in the treatment of rotator cuff-related shoulder pain  | [41276811](https://pubmed.ncbi.nlm.nih.gov/41276811/) | 2025 | systematic-review-or-meta-analysis | mixed-or-uncertain | 0.77 |

Reproduce: `pnpm research:intake -- --targets goals` (stage 1 + payloads), then
`--run` with `TYPESAFE_API_KEY` and `TYPESAFE_API_URL` set, or `--answers
<jsonl>` to gate answers collected elsewhere.

## Multi-engine intake (PubMed + Europe PMC + OpenAlex)

`pnpm research:intake -- --targets goals --engines pubmed,europepmc,openalex`

- 125 candidates for 13 rehab goals: PubMed 65, Europe PMC 45, OpenAlex 15.
  60 were found only outside the PubMed search. 5 already in corpus, 120 new.
- Jev vetted the 59 not already vetted (69,797 tokens, $0.002931). Across all
  120: 52 direct, 66 indirect, 2 off-topic. Jev matched the design label on 90.8%.
- Strict gate: 0 proposed (same review-probability pattern). Shortlist grows
  from 18 to 29 across 12 goals. All 29 were corroborated by the cross-check.
- The 11 new shortlist articles came from Europe PMC or OpenAlex. They include
  the first hamstring-strain candidate (PMID 40954668) and a neck-pain RCT
  (PMID 42711358). **They are not approved or attached.** Only the original 18
  are in the `goal-evidence` seed extension.
- OpenAlex has no publication types, so its design label comes from the title.
  Jev must agree with that label before an OpenAlex hit can pass the gate.
