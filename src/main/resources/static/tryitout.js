let stubs = [];
let selectedStubId = null;
let responseHeaders = {};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadStubs();
});

// --- Load Stubs ---
async function loadStubs() {
    try {
        const response = await fetch('/mock-studio/stubs/list', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        stubs = await response.json();
        renderSidebar();
    } catch (error) {
        console.error('Error loading stubs:', error);
        showToast('Failed to load stubs', 'error');
    }
}

// --- Sidebar Rendering ---
function renderSidebar() {
    const list = document.getElementById('sidebarList');
    const search = document.getElementById('sidebarSearch').value.toLowerCase();

    const filtered = stubs.filter(s => {
        const matchSearch = !search ||
            s.name.toLowerCase().includes(search) ||
            s.urlPath.toLowerCase().includes(search) ||
            s.method.toLowerCase().includes(search);
        return matchSearch;
    });

    // Group by method
    const groups = {};
    const methodOrder = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
    filtered.forEach(stub => {
        if (!groups[stub.method]) groups[stub.method] = [];
        groups[stub.method].push(stub);
    });

    let html = '';
    methodOrder.forEach(method => {
        if (!groups[method]) return;
        const items = groups[method];
        html += `
            <div class="method-group">
                <div class="method-group-header" onclick="toggleGroup(this)">
                    <span class="chevron">&#9660;</span>
                    ${method} <span class="stub-count">${items.length}</span>
                </div>
                <div class="method-group-items">
                    ${items.map(stub => `
                        <div class="stub-item ${stub.id === selectedStubId ? 'active' : ''}" onclick="selectStub('${stub.id}')">
                            <span class="method-tag ${stub.method}">${stub.method}</span>
                            <div class="stub-info">
                                <div class="stub-name">${escapeHtml(stub.name)}</div>
                                <div class="stub-path">${escapeHtml(stub.urlPath)}</div>
                            </div>
                            <span class="status-dot ${stub.status.toLowerCase()}" title="${stub.status}"></span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    if (filtered.length === 0) {
        html = '<div style="padding: 20px; text-align: center; color: #64748b; font-size: 0.85rem;">No stubs found</div>';
    }

    list.innerHTML = html;
}

function toggleGroup(header) {
    header.classList.toggle('collapsed');
    header.nextElementSibling.classList.toggle('collapsed');
}

// --- Select Stub ---
function selectStub(id) {
    selectedStubId = id;
    const stub = stubs.find(s => s.id === id);
    if (!stub) return;

    // Populate URL bar
    document.getElementById('reqMethod').value = stub.method;
    const baseUrl = window.location.origin;
    document.getElementById('reqUrl').value = `${baseUrl}/mock-studio/mock${stub.urlPath}`;

    // Populate request headers
    populateRequestHeaders(stub.reqHeaders);

    // Populate request body
    const bodyArea = document.getElementById('reqBody');
    if (stub.reqBody) {
        try {
            bodyArea.value = JSON.stringify(JSON.parse(stub.reqBody), null, 2);
        } catch (e) {
            bodyArea.value = stub.reqBody;
        }
    } else {
        bodyArea.value = '';
    }

    // Clear response
    clearResponse();

    // Update cURL
    updateCurl();

    // Re-render sidebar to show active state
    renderSidebar();

    // Show content (hide empty state)
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('contentState').style.display = 'flex';
}

function populateRequestHeaders(headersJson) {
    const tbody = document.getElementById('reqHeadersBody');
    tbody.innerHTML = '';

    // Always add Content-Type
    let headers = {};
    if (headersJson) {
        try { headers = JSON.parse(headersJson); } catch (e) {}
    }
    if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    Object.entries(headers).forEach(([key, value]) => {
        addHeaderRow(key, value);
    });
}

function addHeaderRow(key, value) {
    const tbody = document.getElementById('reqHeadersBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" value="${escapeAttr(key || '')}" placeholder="Header name" onchange="updateCurl()"></td>
        <td><input type="text" value="${escapeAttr(value || '')}" placeholder="Header value" onchange="updateCurl()"></td>
        <td><button class="remove-header-btn" onclick="this.closest('tr').remove(); updateCurl();">&times;</button></td>
    `;
    tbody.appendChild(tr);
}

// --- Send Request ---
async function sendRequest() {
    const method = document.getElementById('reqMethod').value;
    const url = document.getElementById('reqUrl').value;

    if (!url) {
        showToast('Please enter a URL', 'error');
        return;
    }

    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="loading-spinner"></span>Sending';

    // Collect headers
    const headers = {};
    document.querySelectorAll('#reqHeadersBody tr').forEach(row => {
        const inputs = row.querySelectorAll('input');
        const key = inputs[0].value.trim();
        const val = inputs[1].value.trim();
        if (key) headers[key] = val;
    });

    // Collect body
    const body = document.getElementById('reqBody').value;

    const fetchOptions = {
        method: method,
        headers: headers,
        credentials: 'same-origin'
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && body) {
        fetchOptions.body = body;
    }

    const startTime = performance.now();

    try {
        const response = await fetch(url, fetchOptions);
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        // Store response headers
        responseHeaders = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        let responseText = '';
        try {
            responseText = await response.text();
            // Try to pretty-print JSON
            try {
                const jsonObj = JSON.parse(responseText);
                responseText = JSON.stringify(jsonObj, null, 2);
            } catch (e) { /* not JSON, keep as-is */ }
        } catch (e) {
            responseText = '[Could not read response body]';
        }

        displayResponse(response.status, duration, responseText, responseHeaders);

    } catch (error) {
        console.error('Request failed:', error);
        displayResponse(0, 0, `Network Error: ${error.message}`, {});
        showToast('Request failed - check URL and server', 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = 'Send';
    }
}

// --- Display Response ---
function displayResponse(status, duration, body, headers) {
    // Status
    const statusEl = document.getElementById('resStatus');
    statusEl.textContent = status === 0 ? 'Error' : status;
    statusEl.className = 'status-code ' + getStatusClass(status);

    // Duration
    document.getElementById('resDuration').textContent = `${duration} ms`;

    // Show meta bar
    document.getElementById('responseMeta').style.display = 'flex';

    // Body
    document.getElementById('resBody').textContent = body;

    // Headers
    const headersContainer = document.getElementById('resHeadersList');
    headersContainer.innerHTML = '';
    Object.entries(headers).forEach(([key, value]) => {
        headersContainer.innerHTML += `
            <div class="header-row">
                <span class="header-key">${escapeHtml(key)}</span>
                <span class="header-value">${escapeHtml(value)}</span>
            </div>
        `;
    });

    // Switch to body tab
    switchResponseTab('body');
}

function clearResponse() {
    document.getElementById('responseMeta').style.display = 'none';
    document.getElementById('resBody').textContent = 'Response will appear here after sending a request...';
    document.getElementById('resHeadersList').innerHTML = '';
    responseHeaders = {};
}

function getStatusClass(status) {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'redirect';
    if (status >= 400 && status < 500) return 'client-error';
    return 'server-error';
}

// --- Tabs ---
function switchRequestTab(tab) {
    document.querySelectorAll('.req-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.req-tab[onclick*="${tab}"]`).classList.add('active');

    document.querySelectorAll('.req-tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(`reqTab-${tab}`).style.display = 'block';
}

function switchResponseTab(tab) {
    document.querySelectorAll('.res-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.res-tab[onclick*="${tab}"]`).classList.add('active');

    document.querySelectorAll('.res-tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(`resTab-${tab}`).style.display = 'block';
}

// --- cURL Generation ---
function updateCurl() {
    const method = document.getElementById('reqMethod').value;
    const url = document.getElementById('reqUrl').value;

    if (!url) {
        document.getElementById('curlOutput').textContent = '# Select a stub or enter a URL to generate cURL';
        return;
    }

    let curl = `curl -X ${method} "${url}"`;

    // Add headers
    document.querySelectorAll('#reqHeadersBody tr').forEach(row => {
        const inputs = row.querySelectorAll('input');
        const key = inputs[0].value.trim();
        const val = inputs[1].value.trim();
        if (key) {
            curl += ` \\\n  -H "${key}: ${val}"`;
        }
    });

    // Add body
    const body = document.getElementById('reqBody').value.trim();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && body) {
        const escapedBody = body.replace(/'/g, "'\\''");
        curl += ` \\\n  -d '${escapedBody}'`;
    }

    document.getElementById('curlOutput').textContent = curl;
}

function copyCurl() {
    const curlText = document.getElementById('curlOutput').textContent;
    navigator.clipboard.writeText(curlText).then(() => {
        showToast('cURL command copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

// --- Toast ---
function showToast(message, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeft = `4px solid ${type === 'success' ? '#22c55e' : type === 'warning' ? '#eab308' : '#ef4444'}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- Utility ---
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function logout() {
    try {
        await fetch('/mock-studio/auth/logout', {
            method: 'POST',
            credentials: 'same-origin'
        });
    } catch (e) {
        console.error('Logout request failed:', e);
    }
    sessionStorage.removeItem('mockStudioAuth');
    window.location.href = 'index.html';
}
