// JavaScript for Test Suites Dashboard

const entities = [
  {
    id: "SER001",
    name: "Service Alpha",
    version: "1.0.2",
    latest_tests_results: {
      status: "passed",
      details: "All tests green"
    }
  },
  {
    id: "LIB003",
    name: "Library Beta",
    version: "2.1.0",
    latest_tests_results: {
      status: "failed",
      details: "3 tests failed: test_auth, test_payment, test_user_profile"
    }
  },
  {
    id: 123,
    name: "Application Gamma",
    version: "0.9.5",
    latest_tests_results: {
      status: "running",
      details: "Load tests in progress (ETA: 15 mins)"
    }
  },
  {
    id: "SER004",
    name: "Service Delta",
    version: "1.1.0",
    latest_tests_results: {
      status: "passed",
      details: "All checks passed successfully."
    }
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

    const namePara = document.createElement('p');
    namePara.textContent = `Name: ${entity.name}`;
    entityDiv.appendChild(namePara);

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
