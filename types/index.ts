/**
 * Matilha OS — Domain Types
 *
 * Types are organized by domain in ./domain/*.
 * This barrel re-exports everything so existing imports (from "@/types") continue
 * to work without changes while the codebase migrates to granular imports.
 *
 * Prefer granular imports in new code:
 *   import type { Dog } from "@/types/domain/dog"
 */

export * from "./domain/dog";
export * from "./domain/tutor";
export * from "./domain/appointment";
export * from "./domain/plan";
export * from "./domain/transaction";
export * from "./domain/hotel";
export * from "./domain/daycare";
export * from "./domain/training";
export * from "./domain/team";
export * from "./domain/product";
export * from "./domain/alert";
export * from "./domain/metrics";
