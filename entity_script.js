// JavaScript for Entity Details Page

// Function to parse entity ID from URL query parameter
function getEntityIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Function to simulate fetching entity data
function fetchEntityData(entityId) {
    // Placeholder data - replace with actual API call
    console.log(`Simulating fetch for entity ID: ${entityId}`);
    let entityName = "Unknown Entity"; // Default name

    // Simulate fetching entity name based on ID
    if (entityId === "SER001") {
        entityName = "Service Alpha";
    } else if (entityId === "LIB003") {
        entityName = "Library Beta";
    } else if (entityId === "123") {
        entityName = "Application Gamma";
    } else if (entityId === "SER004") {
        entityName = "Service Delta";
    }


    const placeholderData = {
        entityName: entityName, // Added entityName
        previousTestRuns: [
            { id: "run001", timestamp: "2023-10-26T10:00:00Z", status: "Passed", details: "All checks green." },
            { id: "run002", timestamp: "2023-10-25T14:30:00Z", status: "Failed", details: "Test 'user_login' failed." },
            { id: "run003", timestamp: "2023-10-24T09:00:00Z", status: "Passed", details: "Minor UI glitches fixed." }
        ],
        currentTestStatus: "No tests currently running."
    };

    if (entityId === "LIB003") { // Example of entity-specific data
        placeholderData.currentTestStatus = "Test 'auth_flow' in progress (ETA: 5 mins)";
        placeholderData.previousTestRuns.unshift(
             { id: "run004", timestamp: "2023-10-27T11:00:00Z", status: "Running", details: "Initialising..." }
        );
    } else if (entityId === "123") {
         placeholderData.currentTestStatus = "Load tests in progress (ETA: 10 mins)";
    }


    return placeholderData;
}

// Function to update the page with entity data
function displayEntityDetails(entityId, data) { // Added entityId parameter
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
            listItem.classList.add('run-card'); // Add .run-card class to each list item
            // You might want to structure content within the card more, e.g., with paragraphs or spans
            listItem.innerHTML = `<strong>Run ID:</strong> ${run.id}<br>
                                  <strong>Timestamp:</strong> ${run.timestamp}<br>
                                  <strong>Status:</strong> ${run.status}<br>
                                  <strong>Details:</strong> ${run.details}`;
            previousTestRunsList.appendChild(listItem);
        });
    } else {
        const listItem = document.createElement('li');
        listItem.classList.add('run-card'); // Also style the "no runs found" message as a card
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
        const entityData = fetchEntityData(entityId);
        displayEntityDetails(entityId, entityData); // Pass entityId here
    } else {
        document.getElementById('page-title').textContent = 'Entity Details'; // Generic title
        document.getElementById('previous-test-runs-list').innerHTML = '<li>No entity ID provided in the URL.</li>';
        document.getElementById('current-test-status').textContent = 'Cannot display status without entity ID.';
        console.error("No entity ID found in URL.");
    }
});
