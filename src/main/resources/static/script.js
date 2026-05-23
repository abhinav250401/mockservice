
let stubs = [];

async function loadStubs() {
    try {
        const response = await fetch('/mock-studio/stubs/list', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: "same-origin"
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch stubs. HTTP Status: ${response.status}`);
        }

        stubs = await response.json();
        renderTable();

    } catch (error) {
        alert("Error loading stubs. Please try again after sometime.");
        console.error("Error loading stubs:", error);
    }
}
// Global state variable for wiremock server status
        let isServerRunning = false;
        async function fetchServerStatusOnLoad() {
        try {
        const response = await fetch('/mock-studio/health/status',
            {
                credentials: "same-origin"
            });
        const data = await response.json();
        isServerRunning = data.status === 'UP';
        updateUI();
    } catch (error) {
        console.error("Error fetching health status:", error);
        isServerRunning = false; // Default to down on network error
        updateUI();
    }
    }
    // 3. Centralized UI updater
        function updateUI() {
        const badge = document.getElementById('serverStatus');
        const text = document.getElementById('serverText');
        if (isServerRunning) {
        badge.className = 'status-badge running';
        text.innerText = '(Running)';
        } else {
        badge.className = 'status-badge down';
        text.innerText = '(Down)';
        }
    }
    // --- Initialization ---
    document.addEventListener('DOMContentLoaded', () => {
    loadStubs();
    updateLivePreview();
    fetchServerStatusOnLoad();
});


function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));


    document.getElementById(tabId + 'Tab').classList.add('active');

    const activeBtn = document.querySelector(`.tab-btn[onclick="switchTab('${tabId}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // 4. Load data if switching to manage tab
    if(tabId === 'manage') loadStubs();
}

async function toggleServerStatus() {
    const badge = document.getElementById('serverStatus');
    const text = document.getElementById('serverText');
    const btn = event.currentTarget; // Track the element to prevent double-clicks

    const endpoint = isServerRunning ? '/mock-studio/health/stop' : '/mock-studio/health/start';

    if(btn) btn.style.pointerEvents = 'none';
    text.innerText = isServerRunning ? '(Stopping...)' : '(Starting...)';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: "same-origin"
        });

        if (response.ok) {
            const data = await response.json();

            isServerRunning = (data.status === 'UP');

            if (isServerRunning) {
                badge.className = 'status-badge running';
                text.innerText = '(Running)';
                showToast(data.message || 'Server started successfully', 'success');
            } else {
                badge.className = 'status-badge down';
                text.innerText = '(Down)';
                showToast(data.message || 'Server stopped', 'warning');
            }
        } else {
            text.innerText = isServerRunning ? '(Running)' : '(Down)';
            showToast('Failed to modify WireMock server state', 'error');
        }
    } catch (error) {
        console.error('Error toggling server status:', error);
        text.innerText = isServerRunning ? '(Running)' : '(Down)';
        showToast('Network error while reaching server manager', 'error');
    } finally {
        if(btn) btn.style.pointerEvents = 'auto';
    }
}

    function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeft = `4px solid ${type === 'success' ? '#22c55e' : type === 'warning' ? '#eab308' : '#ef4444'}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

    // --- Table Rendering & Filtering ---
    function renderTable() {
    const tbody = document.getElementById('stubsTableBody');
    const filterType = document.getElementById('filterType').value;
    const filterStatus = document.getElementById('filterStatus').value;

    tbody.innerHTML = '';
    const filteredStubs = stubs.filter(stub => {
    const matchType = filterType === 'ALL' || stub.method === filterType;
        const matchStatus = filterStatus === 'ALL' || stub.status.toUpperCase() === filterStatus.toUpperCase();
    return matchType && matchStatus;
});

    if (filteredStubs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No stubs found.</td></tr>';
    return;
}
    filteredStubs.forEach(stub => {
    const tr = document.createElement('tr');
        tr.innerHTML = `
        <td style="font-family: monospace;">${stub.name}</td>  
        <td class="method-${stub.method}">${stub.method}</td>
        <td style="font-family: monospace;">${stub.urlPath}</td>
        <td><span class="badge ${stub.status.toLowerCase()}">${stub.status}</span></td>
        <td> 
            <button class="btn btn-sm btn-view" onclick="openModal('view', '${stub.id}')">View</button>                     
            <button class="btn btn-sm btn-edit" onclick="openModal('edit', '${stub.id}')">Edit</button>
            <button class="btn btn-sm btn-toggle" onclick="toggleStubStatus('${stub.id}')">${stub.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</button>
            <button class="btn btn-sm btn-preview" onclick="openJsonModal('${stub.id}')">JSON</button>
            
            <button class="btn btn-sm btn-outline" onclick="copyStubUrl('${stub.urlPath}')" style="border-color: #3b82f6; color: #3b82f6;">🔗 URL</button>
            
            <button class="btn btn-sm btn-delete" onclick="deleteStub('${stub.id}')">Del</button>
        </td>
    `;
    tbody.appendChild(tr);
});
}

async function toggleStubStatus(id) {
    const stub = stubs.find(s => s.id === id);
    if (!stub) return;

    const newStatus = stub.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
        const response = await fetch(`/mock-studio/stubs/${id}/status?status=${newStatus.toUpperCase()}`, {
            method: 'PATCH',
            credentials: "same-origin"
        });

        if (response.ok) {
            stub.status = newStatus;
            await loadStubs();
            showToast(`Stub marked as ${newStatus.toLowerCase()}`, 'success');
        } else {
            showToast('Failed to update stub status on server', 'error');
        }
    } catch (error) {
        console.error('Error toggling stub status:', error);
        showToast('Network error while updating status', 'error');
    }
}

async function deleteStub(id) {
    if (confirm('Are you sure you want to delete this stub?')) {
        try {
            const response = await fetch(`/mock-studio/stubs/${id}`, {
                method: 'DELETE',
                credentials: "same-origin"
            });

            if (response.ok) {
                stubs = stubs.filter(s => s.id !== id);
                await loadStubs();
                showToast('Stub deleted successfully', 'success');
            } else {
                showToast('Failed to delete stub from server', 'error');
            }
        } catch (error) {
            console.error('Error deleting stub:', error);
            showToast('Network error while deleting stub', 'error');
        }
    }
}

function buildWiremockJson(data) {
    const payload = {
        request: { method: data.method, url: data.urlPath },
        response: { status: parseInt(data.responseStatus) || 200 }
    };

    try { if (data.reqHeaders) payload.request.headers = JSON.parse(data.reqHeaders); } catch(e){}

    // Process Request Body
    if (data.reqBody && data.reqBody.trim() !== "") {
        try {
            // Attempt strict JSON matching
            payload.request.bodyPatterns = [{ equalToJson: JSON.parse(data.reqBody) }];
        } catch(e) {
            // Fallback to strict string matching if not valid JSON
            payload.request.bodyPatterns = [{ equalTo: data.reqBody }];
        }
    }

    try { if (data.resHeaders) payload.response.headers = JSON.parse(data.resHeaders); } catch(e){}

    if (data.delayMillis > 0) payload.response.fixedDelayMilliseconds = parseInt(data.delayMillis);

    if (data.responseBody) {
        try {
            payload.response.jsonBody = JSON.parse(data.responseBody);
        } catch(e) {
            payload.response.body = data.responseBody;
        }
    }

    // Process Stateful Scenarios
    if (data.scenarioName && data.scenarioName.trim() !== "") {
        payload.scenarioName = data.scenarioName;
        payload.requiredScenarioState = data.requiredScenarioState || "Started";

        if (data.newScenarioState && data.newScenarioState.trim() !== "") {
            payload.newScenarioState = data.newScenarioState;
        }
    }

    return JSON.stringify(payload, null, 2);
}
function openModal(mode, id) {
    const modal = document.getElementById('stubModal');
    const stub = stubs.find(s => s.id === id);

    document.getElementById('m_id').value = stub.id;
    document.getElementById('m_method').value = stub.method;
    document.getElementById('m_url').value = stub.urlPath;


    document.getElementById('m_reqHeaders').value = stub.reqHeaders || '';
    document.getElementById('m_reqBody').value = stub.reqBody || '';
    document.getElementById('m_status').value = stub.responseStatus;
    document.getElementById('m_delay').value = stub.delayMillis;
    document.getElementById('m_resHeaders').value = stub.respHeaders || stub.resHeaders || '';
    document.getElementById('m_body').value = stub.responseBody || '';


    document.getElementById('m_scenarioName').value = stub.scenarioName || '';
    document.getElementById('m_requiredState').value = stub.requiredScenarioState || '';
    document.getElementById('m_newState').value = stub.newScenarioState || '';

    const isReadOnly = mode === 'view';
    document.getElementById('modalTitle').innerText = isReadOnly ? 'View Stub Details' : 'Edit Stub Configuration';
    document.getElementById('modalSaveBtn').style.display = isReadOnly ? 'none' : 'block';

    const inputs = document.querySelectorAll('#modalForm input, #modalForm select, #modalForm textarea');
    inputs.forEach(input => input.disabled = isReadOnly);

    modal.classList.add('active');
}

async function saveEditedStub() {
    const id = document.getElementById('m_id').value;
    const existingStub = stubs.find(s => s.id === id);
    if (!existingStub) {
        console.error("Error: Could not find the stub to update in local state.");
        return;
    }
    // Update the updatedStubData object inside saveEditedStub()
    const updatedStubData = {
        name: existingStub.name,
        status: existingStub.status,
        urlMatchType: existingStub.urlMatchType || "EXACT",
        method: document.getElementById('m_method').value,
        urlPath: document.getElementById('m_url').value,
        reqHeaders: document.getElementById('m_reqHeaders').value,
        reqBody: document.getElementById('m_reqBody').value, // Added
        responseStatus: parseInt(document.getElementById('m_status').value) || 200,
        delayMillis: parseInt(document.getElementById('m_delay').value) || 0,
        respHeaders: document.getElementById('m_resHeaders').value,
        responseBody: document.getElementById('m_body').value,
        scenarioName: document.getElementById('m_scenarioName').value, // Added
        requiredScenarioState: document.getElementById('m_requiredState').value, // Added
        newScenarioState: document.getElementById('m_newState').value // Added
    };
    try {
        const response = await fetch(`/mock-studio/stubs/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: "same-origin",
            body: JSON.stringify(updatedStubData)
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Update failed:", errorData);
            alert("Failed to update stub. Please check your inputs.");
            return;
        }
        closeModal('stubModal');
        await loadStubs();

        showToast('Stub updated successfully');

    } catch (error) {
        console.error("Network error during update:", error);
        alert("A network error occurred while trying to save the stub.");
    }
}

    function openJsonModal(id) {
    const stub = stubs.find(s => s.id === id);
    const jsonString = buildWiremockJson(stub);
    document.getElementById('jsonModalContent').innerText = jsonString;
    document.getElementById('jsonModal').classList.add('active');
}

    function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function updateLivePreview() {
    const data = {
        method: document.getElementById('c_method').value,
        urlPath: document.getElementById('c_url').value || '/example/path',
        reqHeaders: document.getElementById('c_reqHeaders').value,
        reqBody: document.getElementById('c_reqBody').value,
        responseStatus: document.getElementById('c_status').value,
        delayMillis: document.getElementById('c_delay').value,
        resHeaders: document.getElementById('c_resHeaders').value,
        responseBody: document.getElementById('c_body').value,
        scenarioName: document.getElementById('c_scenarioName')?.value,
        requiredScenarioState: document.getElementById('c_requiredState')?.value,
        newScenarioState: document.getElementById('c_newState')?.value
    };
    document.getElementById('liveJsonPreview').innerText = buildWiremockJson(data);
}

async function createStub() {
    const urlPath = document.getElementById('c_url').value;
    const name = document.getElementById('c_name').value;
    const scenarioName = document.getElementById('c_scenarioName')?.value || null;
    const requiredState = document.getElementById('c_requiredState')?.value || null;
    const newState = document.getElementById('c_newState')?.value || null;
    if (!name) return showToast('Stub Name is required', 'error');
    if (!urlPath) return showToast('URL Path is required', 'error');
    if (!urlPath.startsWith('/')) return showToast('URL path must start with /', 'error');

    const saveBtn = event.currentTarget;
    if (saveBtn && saveBtn.tagName === 'BUTTON') {
        saveBtn.disabled = true;
        saveBtn.innerText = 'Creating Stub...';
    }

    const method = document.getElementById('c_method').value;
    const resHeaders = document.getElementById('c_resHeaders').value;

    let parsedContentType = "application/json";
    if (resHeaders) {
        try {
            const headerObj = JSON.parse(resHeaders);
            const ctKey = Object.keys(headerObj).find(k => k.toLowerCase() === 'content-type');
            if (ctKey) parsedContentType = headerObj[ctKey];
        } catch(e) {}
    }

    const stubDTO = {
        name: name,
        method: method,
        urlPath: urlPath,
        urlMatchType: "EXACT",
        status: "ACTIVE",
        responseStatus: parseInt(document.getElementById('c_status').value) || 200,
        responseBody: document.getElementById('c_body').value || "",
        reqBody: document.getElementById('c_reqBody').value || "",
        contentType: parsedContentType,
        delayMillis: parseInt(document.getElementById('c_delay').value) || 0,
        reqHeaders: document.getElementById('c_reqHeaders').value || "",
        respHeaders: resHeaders || "",
        scenarioName: scenarioName,
        requiredScenarioState: requiredState,
        newScenarioState: newState
    };

    try {
        const response = await fetch('/mock-studio/stubs/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: "same-origin",
            body: JSON.stringify(stubDTO)
        });

        if (response.ok) {
            document.getElementById('createForm').reset();
            updateLivePreview();
            showToast('New stub created successfully!', 'success');
            switchTab('manage');
        } else {
            let errorMsg = 'Failed to create stub. Check constraints.';
            try {
                const errorData = await response.json();
                if (errorData && errorData.message) errorMsg = errorData.message;
            } catch (e) {}
            showToast(errorMsg, 'error');
        }
    } catch (error) {
        console.error('Error saving stub:', error);
        showToast('Network error while saving to backend', 'error');
    } finally {
        if (saveBtn && saveBtn.tagName === 'BUTTON') {
            saveBtn.disabled = false;
            saveBtn.innerText = 'Create Stub Configuration';
        }
    }
}

    // --- AI Simulation ---
    function simulateAI() {
        alert("This feature is not available yet,will be available soon.")
//     const prompt = document.getElementById('aiPrompt').value;
//     if(!prompt) return alert('Please enter a prompt');
//
//     const btn = event.target;
//     btn.innerText = "Processing...";
//     btn.disabled = true;
//
//     setTimeout(() => {
//     // Populate the create form automatically
//     document.getElementById('c_method').value = 'POST';
//     document.getElementById('c_url').value = '/api/generated/user';
//     document.getElementById('c_status').value = '201';
//     document.getElementById('c_delay').value = '2000';
//     document.getElementById('c_body').value = '{\n  "message": "User created via AI",\n  "userId": 99182\n}';
//
//     updateLivePreview();
//     showToast('AI Formulated your request!');
//
//     btn.innerText = "Generate Auto-Stub";
//     btn.disabled = false;
// }, 1000);
}
// --- cURL Generation Logic ---
function generateCurlModal(id) {
    const stub = stubs.find(s => s.id === id);
    const baseUrl = "http://localhost:8080";

    // Begin string construction with core pieces
    let curlCmd = `curl -X ${stub.method} "${baseUrl}${stub.url}"`;

    // Append headers formatting if they exist inside the stub
    if (stub.reqHeaders) {
        try {
            const headers = JSON.parse(stub.reqHeaders);
            Object.keys(headers).forEach(key => {
                curlCmd += ` \\\n  -H "${key}: ${headers[key]}"`;
            });
        } catch (e) {
            // Fallback strategy if string layout contains non-JSON custom properties
            console.warn("Could not parse request headers syntax completely for cURL generation.");
        }
    }

    // Inject the final assembled text layout directly into the display container
    document.getElementById('curlSnippet').innerText = curlCmd;
    document.getElementById('curlModal').classList.add('active');
}

function copyCurlSnippet() {
    const curlText = document.getElementById('curlSnippet').innerText;

    navigator.clipboard.writeText(curlText).then(() => {
        showToast('cURL command copied to clipboard!');
    }).catch(err => {
        console.error('Could not copy syntax: ', err);
    });
}

function copyLivePreview() {
    const text = document.getElementById('liveJsonPreview').innerText;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Live JSON copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

async function resetScenarios() {
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;

    // UI Feedback: Disable button while network request is in flight
    if (btn) {
        btn.style.pointerEvents = 'none';
        btn.innerHTML = '⏳ Resetting...';
    }

    try {
        // Because of your Spring proxy, this will route perfectly to WireMock
        const response = await fetch('/mock-studio/mock/__admin/scenarios/reset', {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            credentials: "same-origin"
        });

        if (response.ok) {
            showToast('All stateful scenarios reset to "Started"', 'success');
        } else {
            showToast('Failed to reset scenarios', 'error');
        }
    } catch (error) {
        console.error('Error resetting scenarios:', error);
        showToast('Network error while reaching mock server', 'error');
    } finally {
        // Restore button state
        if (btn) {
            btn.style.pointerEvents = 'auto';
            btn.innerHTML = originalText;
        }
    }
}
function copyStubUrl(urlPath) {
    const baseUrl = window.location.origin;

    const fullUrl = `${baseUrl}/mock-studio/mock${urlPath}`;

    navigator.clipboard.writeText(fullUrl).then(() => {
        showToast('Absolute URL copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy URL: ', err);
        showToast('Failed to copy URL. Check browser permissions.', 'error');
    });
}

