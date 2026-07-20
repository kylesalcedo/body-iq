import { prisma, logSection, logCount } from "../client";

/**
 * Functional-task taxonomy expansion — adds everyday functional tasks the base
 * set was missing, so the exercise→task linking (functional-task-links
 * extension) has honest targets for the strength/mobility catalog (hinging,
 * pushing, pulling, rotating, jumping, etc.).
 */

const TASKS = [
  { slug: "bending-lifting-floor", name: "Bending & Lifting from the Floor", category: "ADL",
    description: "Hip-hinging to pick an object up from the ground and lift it — groceries, a laundry basket, a child. Depends on hip-hinge mechanics, posterior-chain strength, and a braced trunk." },
  { slug: "pushing-objects", name: "Pushing (Doors, Carts)", category: "ADL",
    description: "Pushing a heavy door, shopping cart, stroller, or piece of furniture. Depends on horizontal pressing strength, scapular stability, and trunk anti-extension." },
  { slug: "pulling-objects", name: "Pulling (Doors, Drawers)", category: "ADL",
    description: "Pulling a heavy door open, a drawer, or a wheeled bag. Depends on horizontal pulling strength, scapular retraction, and grip." },
  { slug: "trunk-rotation-looking-behind", name: "Trunk Rotation & Looking Behind", category: "ADL",
    description: "Rotating the trunk and neck to look behind — checking a blind spot while driving, turning to reach. Depends on thoracic and cervical rotation mobility and anti-rotation control." },
  { slug: "kneeling-getting-up", name: "Kneeling & Getting Up", category: "ADL",
    description: "Lowering to kneel and rising again — gardening, playing on the floor, low cupboards. Depends on single-leg strength, knee tolerance, and balance." },
  { slug: "jumping-landing", name: "Jumping & Landing", category: "mobility",
    description: "Jumping and absorbing landing — stepping off a curb, hopping a puddle, recreational sport. Depends on lower-limb power, eccentric control, and frontal-plane knee stability." },
  { slug: "throwing-overhead-sport", name: "Throwing & Overhead Sport", category: "sport",
    description: "Overhead throwing and striking — tennis serve, throwing a ball, overhead racquet sports. Depends on rotator-cuff strength, scapular rhythm, and kinetic-chain sequencing." },
];

export async function seedFunctionalTasksExpansionExtension() {
  logSection("Functional-task taxonomy expansion");
  let n = 0;
  for (const t of TASKS) {
    await prisma.functionalTask.upsert({
      where: { slug: t.slug },
      update: { name: t.name, description: t.description, category: t.category },
      create: { slug: t.slug, name: t.name, description: t.description, category: t.category, status: "draft", confidence: 0.6 },
    });
    n++;
  }
  logCount("functional tasks added/updated", n);
}
