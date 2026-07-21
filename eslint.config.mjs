import next from "eslint-config-next";

// Next 16 removed `next lint`; ESLint runs directly with flat config.
// eslint-config-next ships a ready flat-config array.
export default [
  { ignores: [".next/**", "out/**", "node_modules/**", "prisma/seed/**", "scripts/**"] },
  ...next,
];
