// JavaScript for Test Suites Dashboard
import { getEntities } from "data_service.js";

function displayEntities(entityArray) {
  const entityListContainer = document.getElementById("entity-list-container");
  // Clear existing content
  entityListContainer.innerHTML = "";

  entityArray.forEach((entity) => {
    const entityDiv = document.createElement("div");
    entityDiv.classList.add("entity-item"); // For potential styling

    const idPara = document.createElement("p");
    idPara.textContent = `ID: ${entity.id}`;
    entityDiv.appendChild(idPara);

    const nameLink = document.createElement("a");
    nameLink.href = `entity.html?id=${entity.id}`;
    nameLink.textContent = `Name: ${entity.name}`;
    entityDiv.appendChild(nameLink);

    const versionPara = document.createElement("p");
    versionPara.textContent = `Version: ${entity.version}`;
    entityDiv.appendChild(versionPara);

    const statusPara = document.createElement("p");
    statusPara.textContent = `Status: ${entity.latest_tests_results.status}`;
    // Add class based on status
    statusPara.classList.add(
      `status-${entity.latest_tests_results.status.toLowerCase()}`,
    );
    entityDiv.appendChild(statusPara);

    const detailsPara = document.createElement("p");
    detailsPara.textContent = `Details: ${entity.latest_tests_results.details}`;
    entityDiv.appendChild(detailsPara);

    // Add link to the latest test run
    if (entity.test_runs && entity.test_runs.length > 0) {
      const latestRun = entity.test_runs.reduce((latest, current) => {
        return new Date(current.date) > new Date(latest.date)
          ? current
          : latest;
      });
      const testRunLink = document.createElement("a");
      testRunLink.href = `test_run.html?runId=${latestRun.runId}`;
      testRunLink.textContent = `View Latest Test Run (${latestRun.runId})`;
      testRunLink.classList.add("test-run-link"); // For styling
      entityDiv.appendChild(testRunLink);
    }

    entityListContainer.appendChild(entityDiv);
  });
}

// Display entities on page load
document.addEventListener("DOMContentLoaded", () => {
  const entities = getEntities(); // Fetch entities from dataService
  displayEntities(entities);

  const searchBar = document.getElementById("search-bar");
  searchBar.addEventListener("input", () => {
    const searchTerm = searchBar.value.toLowerCase();
    const baseEntities = getEntities(); // Fetch fresh copy for filtering
    const filteredEntities = baseEntities.filter((entity) => {
      return String(entity.id).toLowerCase().includes(searchTerm);
    });
    displayEntities(filteredEntities);
  });
});
