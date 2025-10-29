export function createMockData(overrides?: Partial<{ name: string }>) {
  return {
    name: "test-name",
    createdAt: Date.now(),
    ...overrides,
  };
}

export function setupComponentTest(/* test context */) {
  return {
    // Return test helpers
  };
}
