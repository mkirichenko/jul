// JavaScript for Test Suites Dashboard

const entities = [
  {
    id: "SER001",
    name: "Service Alpha",
    version: "1.0.2",
    latest_tests_results: {
      status: "passed",
      details: "All tests green"
    },
    test_runs: [ // Added test_runs
      { runId: "RUN001SER", date: "2023-10-01", status: "passed" },
      { runId: "RUN002SER", date: "2023-09-28", status: "passed" }
    ]
  },
  {
    id: "LIB003",
    name: "Library Beta",
    version: "2.1.0",
    latest_tests_results: {
      status: "failed",
      details: "3 tests failed: test_auth, test_payment, test_user_profile"
    },
    test_runs: [ // Added test_runs
      { runId: "RUN003LIB", date: "2023-10-02", status: "failed" },
      { runId: "RUN004LIB", date: "2023-09-29", status: "passed" }
    ]
  },
  {
    id: 123, // Keep as number to ensure string conversion for search works
    name: "Application Gamma",
    version: "0.9.5",
    latest_tests_results: {
      status: "running",
      details: "Load tests in progress (ETA: 15 mins)"
    },
    test_runs: [ // Added test_runs
      { runId: "RUN005APP", date: "2023-10-03", status: "running" }
    ]
  },
  {
    id: "SER004",
    name: "Service Delta",
    version: "1.1.0",
    latest_tests_results: {
      status: "passed",
      details: "All checks passed successfully."
    }, // Added comma here
    test_runs: [
      { runId: "RUN006SER", date: "2023-10-01", status: "passed" }
    ]
  }
];

function displayEntities(entityArray) {
  const entityListContainer = document.getElementById('entity-list-container');
  // Clear existing content
  entityListContainer.innerHTML = '';

  entityArray.forEach(entity => {
    const entityDiv = document.createElement('div');
    entityDiv.classList.add('entity-item'); // For potential styling

    const idPara = document.createElement('p');
    idPara.textContent = `ID: ${entity.id}`;
    entityDiv.appendChild(idPara);

    const nameLink = document.createElement('a');
    nameLink.href = `entity.html?id=${entity.id}`;
    nameLink.textContent = `Name: ${entity.name}`;
    entityDiv.appendChild(nameLink);

    const versionPara = document.createElement('p');
    versionPara.textContent = `Version: ${entity.version}`;
    entityDiv.appendChild(versionPara);

    const statusPara = document.createElement('p');
    statusPara.textContent = `Status: ${entity.latest_tests_results.status}`;
    // Add class based on status
    statusPara.classList.add(`status-${entity.latest_tests_results.status.toLowerCase()}`);
    entityDiv.appendChild(statusPara);

    const detailsPara = document.createElement('p');
    detailsPara.textContent = `Details: ${entity.latest_tests_results.details}`;
    entityDiv.appendChild(detailsPara);

    // Add link to the latest test run
    if (entity.test_runs && entity.test_runs.length > 0) {
      const latestRun = entity.test_runs.reduce((latest, current) => {
        return new Date(current.date) > new Date(latest.date) ? current : latest;
      });
      const testRunLink = document.createElement('a');
      testRunLink.href = `test_run.html?runId=${latestRun.runId}`;
      testRunLink.textContent = `View Latest Test Run (${latestRun.runId})`;
      testRunLink.classList.add('test-run-link'); // For styling
      entityDiv.appendChild(testRunLink);
    }

    entityListContainer.appendChild(entityDiv);
  });
}

// Display entities on page load
document.addEventListener('DOMContentLoaded', () => {
  displayEntities(entities);

  const searchBar = document.getElementById('search-bar');
  searchBar.addEventListener('input', () => {
    const searchTerm = searchBar.value.toLowerCase();
    const filteredEntities = entities.filter(entity => {
      return String(entity.id).toLowerCase().includes(searchTerm);
    });
    displayEntities(filteredEntities);
  });
});
