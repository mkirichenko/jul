// This file will house all mock data and functions to retrieve it.
// In the future, these functions will call an API to fetch real data.

const entities = [
  {
    id: "SER001",
    name: "Service Alpha",
    version: "1.0.2",
    latest_tests_results: {
      status: "passed",
      details: "All tests green",
    },
    test_runs: [
      { runId: "RUN001SER", date: "2023-10-01", status: "passed" },
      { runId: "RUN002SER", date: "2023-09-28", status: "passed" },
    ],
  },
  {
    id: "LIB003",
    name: "Library Beta",
    version: "2.1.0",
    latest_tests_results: {
      status: "failed",
      details: "3 tests failed: test_auth, test_payment, test_user_profile",
    },
    test_runs: [
      { runId: "RUN003LIB", date: "2023-10-02", status: "failed" },
      { runId: "RUN004LIB", date: "2023-09-29", status: "passed" },
    ],
  },
  {
    id: 123,
    name: "Application Gamma",
    version: "0.9.5",
    latest_tests_results: {
      status: "running",
      details: "Load tests in progress (ETA: 15 mins)",
    },
    test_runs: [{ runId: "RUN005APP", date: "2023-10-03", status: "running" }],
  },
  {
    id: "SER004",
    name: "Service Delta",
    version: "1.1.0",
    latest_tests_results: {
      status: "passed",
      details: "All checks passed successfully.",
    },
    test_runs: [{ runId: "RUN006SER", date: "2023-10-01", status: "passed" }],
  },
];

const entityDetailsData = {
  SER001: {
    entityName: "Service Alpha",
    previousTestRuns: [
      {
        runId: "RUN001SER",
        timestamp: "2023-10-01T10:00:00Z",
        status: "Passed",
        details: "All tests green.",
      },
      {
        runId: "RUN002SER",
        timestamp: "2023-09-28T11:00:00Z",
        status: "Passed",
        details: "Previous successful run.",
      },
    ],
    currentTestStatus: "No tests currently running.",
  },
  LIB003: {
    entityName: "Library Beta",
    previousTestRuns: [
      {
        runId: "RUN003LIB",
        timestamp: "2023-10-02T12:00:00Z",
        status: "Failed",
        details: "Assertion failed in payment module.",
      },
      {
        runId: "RUN004LIB",
        timestamp: "2023-09-29T13:00:00Z",
        status: "Passed",
        details: "All library functions tested.",
      },
      {
        runId: "RUN_LIB_EXTRA",
        timestamp: "2023-09-27T15:00:00Z",
        status: "Passed",
        details: "Documentation examples verified.",
      },
    ],
    currentTestStatus: "Test 'auth_flow' in progress (ETA: 5 mins)",
  },
  123: {
    entityName: "Application Gamma",
    previousTestRuns: [
      {
        runId: "RUN005APP",
        timestamp: "2023-10-03T14:00:00Z",
        status: "Running",
        details: "Load test phase 1.",
      },
      {
        runId: "RUN_APP_OLD",
        timestamp: "2023-09-30T16:00:00Z",
        status: "Failed",
        details: "Database connection timeout.",
      },
    ],
    currentTestStatus: "Load tests in progress (ETA: 10 mins)",
  },
  SER004: {
    entityName: "Service Delta",
    previousTestRuns: [
      {
        runId: "RUN006SER",
        timestamp: "2023-10-01T17:00:00Z",
        status: "Passed",
        details: "Deployment checks successful.",
      },
    ],
    currentTestStatus: "No tests currently running.",
  },
  DEFAULT: {
    // Default data if entityId not found
    entityName: "Unknown Entity",
    previousTestRuns: [
      {
        runId: "RUN_DEF001",
        timestamp: "2023-10-26T10:00:00Z",
        status: "Passed",
        details: "All checks green.",
      },
      {
        runId: "RUN_DEF002",
        timestamp: "2023-10-25T14:30:00Z",
        status: "Failed",
        details: "Test 'user_login' failed.",
      },
    ],
    currentTestStatus: "No tests currently running.",
  },
};

const allTestRunData = {
  RUN001SER: {
    runId: "RUN001SER",
    tests: [
      { name: "Authentication Test", result: "Pass", details: "" },
      { name: "Data Validation Test", result: "Pass", details: "" },
    ],
  },
  RUN003LIB: {
    runId: "RUN003LIB",
    tests: [
      {
        name: "Payment Module Test 1",
        result: "Fail",
        details: "AssertionError: Expected amount to be positive.",
      },
      { name: "Payment Module Test 2", result: "Pass", details: "" },
    ],
  },
  Run123: {
    // Default/fallback
    runId: "Run123",
    tests: [
      { name: "Default Test Case 1", result: "Pass", details: "" },
      {
        name: "Default Test Case 2",
        result: "Fail",
        details: "AssertionError: Expected true to be false.",
      },
      { name: "Default Test Case 3", result: "Pass", details: "" },
    ],
  },
  // Add other specific runIds from script.js's entities if needed, e.g., RUN002SER, RUN004LIB, etc.
  // For now, keeping it as in test_run_script.js and relying on the default for others.
};

export const getEntities = () => {
  return [...entities]; // Return a copy to prevent mutation
};

export const getEntityDetails = (entityId) => {
  // Convert entityId to string if it's a number, to match keys in entityDetailsData
  const idStr = String(entityId);
  return entityDetailsData[idStr] || entityDetailsData["DEFAULT"];
};

export const getTestRunDetails = (runId) => {
  // If a specific runId is requested but not found, it will use the "Run123" default.
  // This matches the original logic in test_run_script.js
  return allTestRunData[runId] || allTestRunData["Run123"];
};

// Note: The original `getProducts` and `getCartItems` are removed as they are not used by the provided scripts.
// If they were intended for other parts of an application, they would be kept.
