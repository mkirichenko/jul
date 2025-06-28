// JavaScript for Entity Details Page
import { getEntityDetails } from './src/dataService.js';

// Function to parse entity ID from URL query parameter
function getEntityIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Function to update the page with entity data
function displayEntityDetails(entityId, data) {
    const pageTitle = document.getElementById('page-title');
    const previousTestRunsList = document.getElementById('previous-test-runs-list');
    const currentTestStatusPara = document.getElementById('current-test-status');

    // Set page title
    pageTitle.textContent = `Entity ${entityId} - ${data.entityName}`;

    // Clear existing content
    previousTestRunsList.innerHTML = '';

    // Populate previous test runs
    if (data.previousTestRuns && data.previousTestRuns.length > 0) {
        data.previousTestRuns.forEach(run => {
            const listItem = document.createElement('li');
            listItem.classList.add('run-card');

            const link = document.createElement('a');
            link.href = `test_run.html?runId=${run.runId}`; // Use run.runId
            link.classList.add('run-link'); // Added class for styling if needed
            link.style.textDecoration = 'none'; // Basic styling to make it look less like a default link
            link.style.color = 'inherit';

            // You might want to structure content within the card more, e.g., with paragraphs or spans
            link.innerHTML = `<strong>Run ID:</strong> ${run.runId}<br>  <!-- Use run.runId -->
                                  <strong>Timestamp:</strong> ${new Date(run.timestamp).toLocaleString()}<br>
                                  <strong>Status:</strong> <span class="status-${run.status.toLowerCase()}">${run.status}</span><br>
                                  <strong>Details:</strong> ${run.details}`;

            listItem.appendChild(link);
            previousTestRunsList.appendChild(listItem);
        });
    } else {
        const listItem = document.createElement('li');
        listItem.classList.add('run-card');
        listItem.textContent = "No previous test runs found.";
        previousTestRunsList.appendChild(listItem);
    }

    // Populate current test status and add .run-card class
    currentTestStatusPara.textContent = data.currentTestStatus || "Status unknown.";
    currentTestStatusPara.classList.add('run-card'); // Add .run-card class
}

// Main execution flow on page load
document.addEventListener('DOMContentLoaded', () => {
    const entityId = getEntityIdFromUrl();
    if (entityId) {
        const entityData = getEntityDetails(entityId); // Use dataService
        displayEntityDetails(entityId, entityData);
    } else {
        document.getElementById('page-title').textContent = 'Entity Details'; // Generic title
        document.getElementById('previous-test-runs-list').innerHTML = '<li>No entity ID provided in the URL.</li>';
        document.getElementById('current-test-status').textContent = 'Cannot display status without entity ID.';
        console.error("No entity ID found in URL.");
    }
});
