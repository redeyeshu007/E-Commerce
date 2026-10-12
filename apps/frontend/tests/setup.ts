/**
 * Frontend test setup.
 * Runs before every test file in the Vitest suite.
 */
import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
