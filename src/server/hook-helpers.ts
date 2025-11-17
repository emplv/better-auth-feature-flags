/**
 * Helper function to wrap endpoint handlers with hooks
 */

import type {
  BeforeHookResult,
  AfterHookResult,
} from "./hooks.js";

export async function runBeforeHook<T = unknown>(
  hook: ((...args: unknown[]) => Promise<BeforeHookResult<T>> | BeforeHookResult<T>) | undefined,
  ...args: unknown[]
): Promise<{ skip: boolean; data?: T; error?: { message: string; status?: number } }> {
  if (!hook) {
    return { skip: false };
  }

  const result = await hook(...args);
  
  if (result.error) {
    return { skip: true, error: result.error };
  }

  return {
    skip: result.skip ?? false,
    data: result.data as T | undefined,
  };
}

export async function runAfterHook<T = unknown>(
  hook: ((...args: unknown[]) => Promise<AfterHookResult<T>> | AfterHookResult<T>) | undefined,
  ...args: unknown[]
): Promise<{ data?: T; error?: { message: string; status?: number } }> {
  if (!hook) {
    return {};
  }

  const result = await hook(...args);
  return result;
}

