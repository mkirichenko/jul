document.addEventListener('DOMContentLoaded', function() {
    // Function to parse runId from URL query parameter
    function getRunIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('runId');
    }

    const runId = getRunIdFromUrl();

    // Mock data - in a real app, you'd fetch this based on runId
    const allTestRunData = {
        "RUN001SER": {
            runId: "RUN001SER",
            tests: [
                { name: "Authentication Test", result: "Pass", details: "" },
                { name: "Data Validation Test", result: "Pass", details: "" }
            ]
        },
        "RUN003LIB": {
            runId: "RUN003LIB",
            tests: [
                { name: "Payment Module Test 1", result: "Fail", details: "AssertionError: Expected amount to be positive." },
                { name: "Payment Module Test 2", result: "Pass", details: "" }
            ]
        },
        // Add more mock data for other runIds as needed
        "Run123": { // Default/fallback if no specific ID matches
            runId: runId || "Run123", // Use parsed runId or default
            tests: [
                { name: "Default Test Case 1", result: "Pass", details: "" },
                { name: "Default Test Case 2", result: "Fail", details: "AssertionError: Expected true to be false." },
                { name: "Default Test Case 3", result: "Pass", details: "" }
            ]
        }
    };

    const testRunData = allTestRunData[runId] || allTestRunData["Run123"]; // Fetch specific or default

    // Set the page title
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = `Test Run: ${testRunData.runId}`;
    }

    const testListContainer = document.getElementById('test-list-container');
    if (testListContainer) {
        testListContainer.innerHTML = ''; // Clear any existing content
        const ul = document.createElement('ul');
        ul.className = 'test-list'; // Add a class for styling

        testRunData.tests.forEach(test => {
            const li = document.createElement('li');
            li.className = 'test-item'; // Add a class for styling

            const testName = document.createElement('span');
            testName.className = 'test-name';
            testName.textContent = `${test.name}: `;
            li.appendChild(testName);

            const testResult = document.createElement('span');
            testResult.className = `test-result ${test.result.toLowerCase()}`; // Class for Pass/Fail styling
            testResult.textContent = test.result;
            li.appendChild(testResult);

            if (test.result === "Fail") {
                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'test-details spoiler'; // Add 'spoiler' class
                detailsDiv.style.display = 'none'; // Hidden by default
                detailsDiv.textContent = test.details;

                const spoilerButton = document.createElement('button');
                spoilerButton.className = 'spoiler-button';
                spoilerButton.textContent = "Show Details";
                spoilerButton.onclick = function() {
                    const isHidden = detailsDiv.style.display === 'none';
                    detailsDiv.style.display = isHidden ? 'block' : 'none';
                    spoilerButton.textContent = isHidden ? "Hide Details" : "Show Details";
                };

                li.appendChild(spoilerButton);
                li.appendChild(detailsDiv);
            }
            ul.appendChild(li);
        });
        testListContainer.appendChild(ul);
    }
});
