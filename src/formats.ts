// Delegation wrapper only – real formatting logic lives in formatCore.ts
// Single Source of Truth: modify formatting rules in formatCore.ts
// This file provides stable export names for the rest of the extension.

import { preFormat as corePreFormat, formatNestings as coreFormatNestings, pureFormatPipeline } from './formatCore';

export function preFormat(text: string, config: any) {
  return corePreFormat(text, config);
}

export function formatNestings(text: string, config: any) {
  return coreFormatNestings(text, config);
}

export function fullFormatPipeline(text: string, config: any) {
  return pureFormatPipeline(text, config);
}

// Note: If VSCode-specific logging or telemetry is needed later, inject it here
// without duplicating core logic.
