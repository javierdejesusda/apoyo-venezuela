// Registers @testing-library/jest-dom matchers (toBeInTheDocument, etc.) for
// every test. Safe under the default node environment: it only extends expect
// and touches no DOM at import time. Component tests opt into jsdom per file
// with a `// @vitest-environment jsdom` pragma.
import '@testing-library/jest-dom/vitest';
