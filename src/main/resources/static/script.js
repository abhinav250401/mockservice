
    // --- State Management ---
    let stubs = [
    { id: 1, method: 'GET', url: '/api/users', status: 'Active', reqHeaders: '{"Accept": "application/json"}', resStatus: 200, resDelay: 0, resHeaders: '{"Content-Type": "application/json"}', resBody: '[\n  { "id": 1, "name": "Abhinav" }\n]' },
    { id: 2, method: 'POST', url: '/api/payments', status: 'Inactive', reqHeaders: '', resStatus: 503, resDelay: 2000, resHeaders: '', resBody: '{"error": "Service Unavailable"}' }
    ];

    let isServerRunning = true;

    // --- Initialization ---
    document.addEventListener('DOMContentLoaded', () => {
    renderTable();
    updateLivePreview();
});

    // --- UI Interactions ---
    function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(tabId + 'Tab').classList.add('active');
    event.target.classList.add('active');

    if(tabId === 'manage') renderTable();
}

    function toggleServerStatus() {
    const badge = document.getElementById('serverStatus');
    const text = document.getElementById('serverText');
    isServerRunning = !isServerRunning;

    if (isServerRunning) {
    badge.className = 'status-badge running';
    text.innerText = '(Running)';
    showToast('Server started successfully');
} else {
    badge.className = 'status-badge down';
    text.innerText = '(Down)';
    showToast('Server stopped', 'warning');
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
    const matchStatus = filterStatus === 'ALL' || stub.status === filterStatus;
    return matchType && matchStatus;
});

    if (filteredStubs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No stubs found.</td></tr>';
    return;
}

    filteredStubs.forEach(stub => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
                    <td class="method-${stub.method}">${stub.method}</td>
                    <td style="font-family: monospace;">${stub.url}</td>
                    <td><span class="badge ${stub.status.toLowerCase()}">${stub.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-view" onclick="openModal('view', ${stub.id})">View</button>
                        <button class="btn btn-sm btn-edit" onclick="openModal('edit', ${stub.id})">Edit</button>
                        <button class="btn btn-sm btn-toggle" onclick="toggleStubStatus(${stub.id})">${stub.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
                        <button class="btn btn-sm btn-preview" onclick="openJsonModal(${stub.id})">JSON</button>
                        <button class="btn btn-sm btn-delete" onclick="deleteStub(${stub.id})">Del</button>
                    </td>
                `;
    tbody.appendChild(tr);
});
}

    // --- Actions ---
    function toggleStubStatus(id) {
    const stub = stubs.find(s => s.id === id);
    stub.status = stub.status === 'Active' ? 'Inactive' : 'Active';
    renderTable();
    showToast(`Stub ${stub.status.toLowerCase()}`);
}

    function deleteStub(id) {
    if (confirm('Are you sure you want to delete this stub?')) {
    stubs = stubs.filter(s => s.id !== id);
    renderTable();
    showToast('Stub deleted');
}
}

    // --- Data to Wiremock JSON Converter ---
    function buildWiremockJson(data) {
    const payload = {
    request: { method: data.method, url: data.url },
    response: { status: parseInt(data.resStatus) || 200 }
};

    // Safely parse JSON inputs
    try { if (data.reqHeaders) payload.request.headers = JSON.parse(data.reqHeaders); } catch(e){}
    try { if (data.resHeaders) payload.response.headers = JSON.parse(data.resHeaders); } catch(e){}

    if (data.resDelay > 0) payload.response.fixedDelayMilliseconds = parseInt(data.resDelay);

    if (data.resBody) {
    try {
    payload.response.jsonBody = JSON.parse(data.resBody);
} catch(e) {
    payload.response.body = data.resBody; // fallback to string
}
}
    return JSON.stringify(payload, null, 2);
}

    // --- Modals (View/Edit) ---
    function openModal(mode, id) {
    const modal = document.getElementById('stubModal');
    const stub = stubs.find(s => s.id === id);

    // Populate data
    document.getElementById('m_id').value = stub.id;
    document.getElementById('m_method').value = stub.method;
    document.getElementById('m_url').value = stub.url;
    document.getElementById('m_reqHeaders').value = stub.reqHeaders;
    document.getElementById('m_status').value = stub.resStatus;
    document.getElementById('m_delay').value = stub.resDelay;
    document.getElementById('m_resHeaders').value = stub.resHeaders;
    document.getElementById('m_body').value = stub.resBody;

    // Handle View vs Edit state
    const isReadOnly = mode === 'view';
    document.getElementById('modalTitle').innerText = isReadOnly ? 'View Stub Details' : 'Edit Stub Configuration';
    document.getElementById('modalSaveBtn').style.display = isReadOnly ? 'none' : 'block';

    const inputs = document.querySelectorAll('#modalForm input, #modalForm select, #modalForm textarea');
    inputs.forEach(input => input.disabled = isReadOnly);

    modal.classList.add('active');
}

    function saveEditedStub() {
    const id = parseInt(document.getElementById('m_id').value);
    const stubIndex = stubs.findIndex(s => s.id === id);

    stubs[stubIndex] = {
    id: id,
    status: stubs[stubIndex].status, // preserve status
    method: document.getElementById('m_method').value,
    url: document.getElementById('m_url').value,
    reqHeaders: document.getElementById('m_reqHeaders').value,
    resStatus: document.getElementById('m_status').value,
    resDelay: document.getElementById('m_delay').value,
    resHeaders: document.getElementById('m_resHeaders').value,
    resBody: document.getElementById('m_body').value,
};

    closeModal('stubModal');
    renderTable();
    showToast('Stub updated successfully');
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

    // --- Create Form & Live Preview ---
    function updateLivePreview() {
    const data = {
    method: document.getElementById('c_method').value,
    url: document.getElementById('c_url').value || '/example/path',
    reqHeaders: document.getElementById('c_reqHeaders').value,
    resStatus: document.getElementById('c_status').value,
    resDelay: document.getElementById('c_delay').value,
    resHeaders: document.getElementById('c_resHeaders').value,
    resBody: document.getElementById('c_body').value,
};
    document.getElementById('liveJsonPreview').innerText = buildWiremockJson(data);
}

    function createStub() {
    const url = document.getElementById('c_url').value;
    if(!url) return alert('URL Path is required');

    const newStub = {
    id: Date.now(),
    status: 'Active',
    method: document.getElementById('c_method').value,
    url: url,
    reqHeaders: document.getElementById('c_reqHeaders').value,
    resStatus: document.getElementById('c_status').value,
    resDelay: document.getElementById('c_delay').value,
    resHeaders: document.getElementById('c_resHeaders').value,
    resBody: document.getElementById('c_body').value,
};

    stubs.push(newStub);
    document.getElementById('createForm').reset();
    updateLivePreview();
    showToast('New stub created successfully!');

    // Switch back to manage tab
    switchTab('manage');
}

    // --- AI Simulation ---
    function simulateAI() {
    const prompt = document.getElementById('aiPrompt').value;
    if(!prompt) return alert('Please enter a prompt');

    const btn = event.target;
    btn.innerText = "Processing...";
    btn.disabled = true;

    setTimeout(() => {
    // Populate the create form automatically
    document.getElementById('c_method').value = 'POST';
    document.getElementById('c_url').value = '/api/generated/user';
    document.getElementById('c_status').value = '201';
    document.getElementById('c_delay').value = '2000';
    document.getElementById('c_body').value = '{\n  "message": "User created via AI",\n  "userId": 99182\n}';

    updateLivePreview();
    showToast('AI Formulated your request!');

    btn.innerText = "Generate Auto-Stub";
    btn.disabled = false;
}, 1000);
}
