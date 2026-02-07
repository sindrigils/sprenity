import type { SprenityTestApi } from '../e2e/test-api';

declare global {
  interface Window {
    __sprenityTestApi?: SprenityTestApi;
  }
}

export {};
