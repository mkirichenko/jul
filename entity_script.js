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
    let entityName = "Unknown Entity";
    let previousTestRuns = [
        { runId: "RUN_DEF001", timestamp: "2023-10-26T10:00:00Z", status: "Passed", details: "All checks green." },
        { runId: "RUN_DEF002", timestamp: "2023-10-25T14:30:00Z", status: "Failed", details: "Test 'user_login' failed." }
    ];
    let currentTestStatus = "No tests currently running.";

    // Simulate fetching entity name and test runs based on ID
    if (entityId === "SER001") {
        entityName = "Service Alpha";
        previousTestRuns = [
            { runId: "RUN001SER", timestamp: "2023-10-01T10:00:00Z", status: "Passed", details: "All tests green." },
            { runId: "RUN002SER", timestamp: "2023-09-28T11:00:00Z", status: "Passed", details: "Previous successful run." }
        ];
    } else if (entityId === "LIB003") {
        entityName = "Library Beta";
        currentTestStatus = "Test 'auth_flow' in progress (ETA: 5 mins)";
        previousTestRuns = [
            { runId: "RUN003LIB", timestamp: "2023-10-02T12:00:00Z", status: "Failed", details: "Assertion failed in payment module." },
            { runId: "RUN004LIB", timestamp: "2023-09-29T13:00:00Z", status: "Passed", details: "All library functions tested." },
            { runId: "RUN_LIB_EXTRA", timestamp: "2023-09-27T15:00:00Z", status: "Passed", details: "Documentation examples verified." }
        ];
    } else if (entityId === "123") { // Assuming 123 is a string ID from URL, or it was stringified in index.html
        entityName = "Application Gamma";
        currentTestStatus = "Load tests in progress (ETA: 10 mins)";
        previousTestRuns = [
            { runId: "RUN005APP", timestamp: "2023-10-03T14:00:00Z", status: "Running", details: "Load test phase 1." },
            { runId: "RUN_APP_OLD", timestamp: "2023-09-30T16:00:00Z", status: "Failed", details: "Database connection timeout." }
        ];
    } else if (entityId === "SER004") {
        entityName = "Service Delta";
        previousTestRuns = [
            { runId: "RUN006SER", timestamp: "2023-10-01T17:00:00Z", status: "Passed", details: "Deployment checks successful." }
        ];
    }

    return {
        entityName: entityName,
        previousTestRuns: previousTestRuns,
        currentTestStatus: currentTestStatus
    };
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
        const entityData = fetchEntityData(entityId);
        displayEntityDetails(entityId, entityData); // Pass entityId here
    } else {
        document.getElementById('page-title').textContent = 'Entity Details'; // Generic title
        document.getElementById('previous-test-runs-list').innerHTML = '<li>No entity ID provided in the URL.</li>';
        document.getElementById('current-test-status').textContent = 'Cannot display status without entity ID.';
        console.error("No entity ID found in URL.");
    }
});
