# Contributing to Body IQ

Thank you for your interest in contributing to Body IQ — an open-source, evidence-based exercise and movement knowledge engine.

## 🎯 Mission

Body IQ aims to give everyone free access to accurate, research-backed exercise information including:
- How to perform exercises with proper form
- Which muscles are involved and at what activation levels
- Evidence-based dosing (sets, reps, frequency)
- Easier and harder variations
- Why the exercise matters for daily life

## 🧬 Data Quality Standards

This project values **accuracy over volume**. Every contribution must follow these rules:

### Evidence Requirements
- Muscle role assignments (primary/secondary/stabilizer/synergist) must be backed by EMG research where available
- Dosing recommendations must cite RCTs, systematic reviews, or clinical practice guidelines
- If you're unsure, mark confidence as low rather than guessing
- Do not fabricate citations — all references must be real, verifiable papers

### Confidence Scoring
- **0.95**: Verified by multiple high-quality sources (systematic reviews, Cochrane reviews)
- **0.90**: Supported by at least one RCT or established textbook
- **0.85**: Supported by observational studies or expert consensus
- **0.80**: Based on anatomical/biomechanical reasoning, limited direct evidence
- **< 0.80**: Needs review — flag for evidence gathering

### Validation Statuses
- `draft` → Initial entry, not yet reviewed
- `needs_review` → Flagged for expert review
- `reviewed` → Reviewed by a qualified contributor
- `verified` → Confirmed by multiple reviewers with strong evidence
- `disputed` → Conflicting evidence or disagreement

## 📋 Types of Contributions

### 1. Exercise Data (Most Needed)
- Add new exercises with full descriptions, cues, regressions, progressions
- Improve existing exercise descriptions for clarity
- Add or correct muscle role assignments with EMG citations
- Add dosing recommendations from clinical trials
- Add evidence-based coaching cues

### 2. Anatomy Data
- Correct muscle origin/insertion/action/innervation/blood supply
- Add missing movement-muscle links
- Verify or dispute existing mappings

### 3. Research Sources
- Add new peer-reviewed sources that support exercise or anatomy claims
- Link sources to specific exercises, muscles, or movements
- Flag outdated or retracted sources

### 4. Functional Tasks
- Add new ADL/IADL tasks with movement requirements
- Add ROM thresholds and strength requirements from clinical literature
- Link tasks to exercises

### 5. Media (Future)
- Exercise demonstration photos or illustrations
- Video links to proper form demonstrations
- Accessibility-friendly descriptions of movements

### 6. Code & UI
- Bug fixes
- UI improvements for the exercise explorer
- API improvements
- Accessibility enhancements
- Mobile responsiveness

## 🔧 Development Setup

```bash
# Prerequisites: Node.js 18+, PostgreSQL 14+, pnpm

# Clone and install
git clone https://github.com/kylesalcedo/body-iq.git
cd body-iq
pnpm install

# Configure database
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Setup database and seed data
pnpm db:push
pnpm db:seed

# Start development server
pnpm dev
```

## 📝 Submitting Changes

### For Data Changes
1. Fork the repository
2. Create a branch: `git checkout -b add-exercise-nordic-hamstring`
3. Edit the relevant seed file in `prisma/seed/`
4. Run `pnpm db:seed` to verify your data loads correctly
5. Run `pnpm data:quality` to check for orphan data or missing links
6. Submit a pull request with:
   - What you added/changed
   - Citations for any clinical claims
   - Your qualifications (optional but helpful for review)

### For Code Changes
1. Fork the repository
2. Create a branch: `git checkout -b fix-exercise-page-layout`
3. Make your changes
4. Run `pnpm build` to verify no build errors
5. Submit a pull request with a clear description

## 🏥 Clinical Disclaimer

Body IQ is an educational reference tool. It is **not** a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for exercise prescription.

Contributors with clinical credentials (PT, DPT, MD, ATC, CSCS, etc.) are especially welcome and may be granted reviewer privileges.

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
