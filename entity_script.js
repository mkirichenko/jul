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
    const placeholderData = {
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
function displayEntityDetails(data) {
    const previousTestRunsList = document.getElementById('previous-test-runs-list');
    const currentTestStatusPara = document.getElementById('current-test-status');

    // Clear existing content
    previousTestRunsList.innerHTML = '';

    // Populate previous test runs
    if (data.previousTestRuns && data.previousTestRuns.length > 0) {
        data.previousTestRuns.forEach(run => {
            const listItem = document.createElement('li');
            listItem.textContent = `Run ID: ${run.id} - Timestamp: ${run.timestamp} - Status: ${run.status} - Details: ${run.details}`;
            previousTestRunsList.appendChild(listItem);
        });
    } else {
        const listItem = document.createElement('li');
        listItem.textContent = "No previous test runs found.";
        previousTestRunsList.appendChild(listItem);
    }

    // Populate current test status
    currentTestStatusPara.textContent = data.currentTestStatus || "Status unknown.";
}

// Main execution flow on page load
document.addEventListener('DOMContentLoaded', () => {
    const entityId = getEntityIdFromUrl();
    if (entityId) {
        const entityData = fetchEntityData(entityId);
        displayEntityDetails(entityData);
    } else {
        document.getElementById('previous-test-runs-list').innerHTML = '<li>No entity ID provided in the URL.</li>';
        document.getElementById('current-test-status').textContent = 'Cannot display status without entity ID.';
        console.error("No entity ID found in URL.");
    }
});
