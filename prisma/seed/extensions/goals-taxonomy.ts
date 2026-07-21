import { prisma, logSection, logCount } from "../client";

/**
 * Goal taxonomy — the "why would I do this?" axis, framed the way people search:
 * rehab conditions AND performance/optimization goals AND targeted mobility.
 * Complements the FunctionalTask layer (everyday activities). Grounded in the
 * clinical-condition signal already present across 62 exercises' rationale/EMG
 * notes, plus common performance goals.
 */

type G = { slug: string; name: string; goalType: string; region: string; description: string };

const GOALS: G[] = [
  // ── Rehab conditions ──
  { slug: "low-back-pain", name: "Low Back Pain", goalType: "rehab", region: "lumbar", description: "Reduce non-specific low back pain and build lumbopelvic control and tolerance." },
  { slug: "neck-pain", name: "Neck Pain", goalType: "rehab", region: "cervical", description: "Ease mechanical neck pain and restore deep cervical flexor endurance and posture." },
  { slug: "patellofemoral-pain", name: "Patellofemoral (Knee) Pain", goalType: "rehab", region: "knee", description: "Reduce anterior knee pain via quadriceps and hip strengthening and load management." },
  { slug: "rotator-cuff-tendinopathy", name: "Rotator Cuff Tendinopathy", goalType: "rehab", region: "shoulder", description: "Rehabilitate rotator-cuff pain with graded cuff and scapular loading." },
  { slug: "subacromial-pain", name: "Subacromial Shoulder Pain", goalType: "rehab", region: "shoulder", description: "Address subacromial pain with scapular control and posterior-cuff work." },
  { slug: "achilles-tendinopathy", name: "Achilles Tendinopathy", goalType: "rehab", region: "ankle", description: "Load the Achilles with heavy-slow / eccentric calf work to rebuild capacity." },
  { slug: "plantar-fasciitis", name: "Plantar Fasciitis / Heel Pain", goalType: "rehab", region: "foot", description: "Reduce plantar heel pain with calf and intrinsic-foot loading and stretching." },
  { slug: "lateral-ankle-sprain", name: "Ankle Sprain Recovery", goalType: "rehab", region: "ankle", description: "Restore ankle strength, proprioception, and balance after a lateral sprain." },
  { slug: "hamstring-strain", name: "Hamstring Strain Recovery", goalType: "rehab", region: "hip", description: "Rebuild hamstring strength and length with eccentric loading after strain." },
  { slug: "tennis-elbow", name: "Tennis Elbow (Lateral Epicondylalgia)", goalType: "rehab", region: "elbow", description: "Load the wrist extensors eccentrically to rehabilitate lateral elbow pain." },
  { slug: "hip-osteoarthritis", name: "Hip Osteoarthritis", goalType: "rehab", region: "hip", description: "Maintain hip strength and mobility and reduce pain in hip OA." },
  { slug: "knee-osteoarthritis", name: "Knee Osteoarthritis", goalType: "rehab", region: "knee", description: "Strengthen the quadriceps and hip to reduce pain and maintain function in knee OA." },
  { slug: "carpal-tunnel", name: "Carpal Tunnel / Wrist Nerve Symptoms", goalType: "rehab", region: "wrist", description: "Nerve and tendon gliding plus posture work for median-nerve wrist symptoms." },

  // ── Performance / optimization ──
  { slug: "improve-running-speed", name: "Improve Running Speed", goalType: "performance", region: "whole-body", description: "Build the power, posterior-chain strength, and mechanics that make you faster." },
  { slug: "improve-running-endurance", name: "Improve Running Endurance", goalType: "performance", region: "whole-body", description: "Develop the strength and durability to run longer with less fatigue and injury." },
  { slug: "improve-squat", name: "Improve Your Squat", goalType: "performance", region: "lower-body", description: "Increase squat strength, depth, and control through the prime movers and stabilizers." },
  { slug: "improve-deadlift", name: "Improve Your Deadlift / Hinge", goalType: "performance", region: "posterior-chain", description: "Build a stronger hip hinge and posterior chain for pulling and lifting." },
  { slug: "improve-vertical-jump", name: "Improve Vertical Jump", goalType: "performance", region: "lower-body", description: "Develop lower-limb power and elastic strength for higher, more explosive jumps." },
  { slug: "improve-sprint-acceleration", name: "Improve Sprint Acceleration", goalType: "performance", region: "lower-body", description: "Train the horizontal force and hamstring power that drive fast acceleration." },
  { slug: "improve-grip-strength", name: "Improve Grip Strength", goalType: "performance", region: "hand", description: "Build crushing and holding grip for carries, pulls, and daily tasks." },
  { slug: "improve-overhead-press", name: "Improve Overhead Pressing", goalType: "performance", region: "shoulder", description: "Increase overhead strength and the shoulder mobility/stability it requires." },
  { slug: "improve-pull-up", name: "Improve Your Pull-Up", goalType: "performance", region: "upper-body", description: "Build the lat, scapular, and grip strength to pull your bodyweight up." },
  { slug: "improve-core-strength", name: "Improve Core Strength", goalType: "performance", region: "trunk", description: "Develop trunk bracing and anti-movement control for strength and injury resistance." },
  { slug: "improve-posterior-chain", name: "Improve Posterior-Chain Strength", goalType: "performance", region: "posterior-chain", description: "Strengthen the glutes, hamstrings, and back that power hinging, running, and lifting." },
  { slug: "improve-single-leg-strength", name: "Improve Single-Leg Strength", goalType: "performance", region: "lower-body", description: "Build unilateral leg strength and control for sport, stairs, and balance." },

  // ── Injury prevention ──
  { slug: "fall-prevention", name: "Fall Prevention", goalType: "prevention", region: "whole-body", description: "Reduce fall risk with balance, single-leg strength, and lower-limb power." },
  { slug: "running-injury-prevention", name: "Running Injury Prevention", goalType: "prevention", region: "lower-body", description: "Build the tissue capacity and control that keep runners healthy." },
  { slug: "groin-injury-prevention", name: "Groin Injury Prevention", goalType: "prevention", region: "hip", description: "Strengthen the adductors eccentrically to cut groin-injury risk in sport." },
  { slug: "hamstring-injury-prevention", name: "Hamstring Injury Prevention", goalType: "prevention", region: "hip", description: "Eccentric hamstring loading to reduce strain risk in running and sport." },
  { slug: "shoulder-injury-prevention", name: "Shoulder Injury Prevention", goalType: "prevention", region: "shoulder", description: "Cuff and scapular strength to protect the shoulder in overhead activity." },
  { slug: "low-back-injury-prevention", name: "Low Back Injury Prevention", goalType: "prevention", region: "lumbar", description: "Trunk control and hip-hinge mechanics to protect the low back under load." },

  // ── Targeted mobility ──
  { slug: "improve-hip-mobility", name: "Improve Hip Mobility", goalType: "mobility", region: "hip", description: "Restore hip range for squatting, hinging, and comfortable sitting and walking." },
  { slug: "improve-ankle-mobility", name: "Improve Ankle Mobility", goalType: "mobility", region: "ankle", description: "Increase ankle dorsiflexion for squatting, running, and stair descent." },
  { slug: "improve-thoracic-mobility", name: "Improve Thoracic (Mid-Back) Mobility", goalType: "mobility", region: "thoracic", description: "Free up mid-back rotation and extension for posture, reaching, and overhead work." },
  { slug: "improve-shoulder-mobility", name: "Improve Shoulder Mobility", goalType: "mobility", region: "shoulder", description: "Restore overhead and rotational shoulder range for pressing and daily reach." },
  { slug: "improve-hamstring-flexibility", name: "Improve Hamstring Flexibility", goalType: "mobility", region: "hip", description: "Lengthen the hamstrings for hinging, forward reach, and low-back comfort." },
  { slug: "improve-neck-mobility", name: "Improve Neck Mobility", goalType: "mobility", region: "cervical", description: "Restore cervical rotation and side-bending for driving, posture, and comfort." },
];

export async function seedGoalsTaxonomyExtension() {
  logSection("Goals taxonomy");
  let n = 0;
  for (const g of GOALS) {
    await prisma.goal.upsert({
      where: { slug: g.slug },
      update: { name: g.name, goalType: g.goalType, region: g.region, description: g.description },
      create: { slug: g.slug, name: g.name, goalType: g.goalType, region: g.region, description: g.description, status: "draft", confidence: 0.6 },
    });
    n++;
  }
  logCount("goals added/updated", n);
}
