export const externalRunnerStatus = {
  available: false,
  name: "External Browser Automation Adapter",
  message: "External browser automation runner is not available in the current SCAVerse runtime. This adapter defines the contract for future Playwright integration."
};

export async function runExternalBrowserSuite() {
  return {
    available: false,
    status: "skipped",
    summary: externalRunnerStatus.message
  };
}