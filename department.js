// Define client statuses
const STATUS = {
    WAITING: 'new',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed'
};

// Global variables
let selectedDepartment = '';
let clientQueue = [];
let lastCheckTime = 0;

// Load when the document is ready
document.addEventListener('DOMContentLoaded', function () {
    // Load saved department from localStorage
    const savedDepartment = localStorage.getItem('selectedDepartment');
    const departmentElement = document.getElementById('department');
    if (savedDepartment && departmentElement) {
        departmentElement.value = savedDepartment;
        setDepartment(); // Initialize the dashboard
    }

    // Load client queue from localStorage
    loadClientsFromStorage();

    // Start checking for new clients regularly
    setInterval(checkForNewClients, 5000); // Check every 5 seconds
});

// Set the selected department
function setDepartment() {
    const departmentSelect = document.getElementById('department');
    if (!departmentSelect) return;
    selectedDepartment = departmentSelect.value.toUpperCase(); // Make uppercase to match with reception data

    if (selectedDepartment) {
        // Save selected department to localStorage
        localStorage.setItem('selectedDepartment', selectedDepartment);

        // Update department title
        document.getElementById('departmentTitle').textContent = `- ${departmentSelect.options[departmentSelect.selectedIndex].text}`;

        // Show dashboard
        document.getElementById('dashboardContainer').style.display = 'block';

        // Check for clients immediately
        checkForNewClients();
    } else {
        // Hide dashboard if no department selected
        document.getElementById('dashboardContainer').style.display = 'none';
    }
}

// Load clients from localStorage
function loadClientsFromStorage() {
    const storedClients = localStorage.getItem('clientQueue');
    if (storedClients) {
        clientQueue = JSON.parse(storedClients);
    }
}

// Check for new clients assigned to this department
function checkForNewClients() {
    if (!selectedDepartment) return;

    // Refresh client data from localStorage (to get updates from reception page)
    loadClientsFromStorage();

    // Filter clients for the selected department
    const departmentClients = clientQueue.filter(client => {
        // Compare with department directly (now they should match since both are uppercase)
        return client.department === selectedDepartment;
    });

    // Update the client table
    updateClientTable(departmentClients);

    // Update the client count
    const clientCountElement = document.getElementById('clientCount');
    if (clientCountElement) {
        clientCountElement.textContent = departmentClients.length;
    }
    
    // Update display of no-clients message
    const noClientsMessage = document.getElementById('noClientsMessage');
    if (noClientsMessage) {
        noClientsMessage.style.display = departmentClients.length === 0 ? 'block' : 'none';
    }
}

// Update the client table with department clients
function updateClientTable(departmentClients) {
    const tableBody = document.getElementById('clientTableBody');
    if (!tableBody) return;

    // Clear existing table
    tableBody.innerHTML = '';

    if (departmentClients.length === 0) {
        return;
    }

    // Add each client to the table
    departmentClients.forEach(client => {
        const row = document.createElement('tr');
        
        // Create status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.className = `status-indicator status-${client.status || STATUS.WAITING}`;
        
        // Add client details to the row
        const statusCell = document.createElement('td');
        statusCell.appendChild(statusIndicator);
        statusCell.appendChild(document.createTextNode(getStatusLabel(client.status || STATUS.WAITING)));
        
        const nameCell = document.createElement('td');
        nameCell.textContent = client.name;
        
        const purposeCell = document.createElement('td');
        purposeCell.textContent = client.purpose;
        
        const timeCell = document.createElement('td');
        timeCell.textContent = client.time;
        
        const commentCell = document.createElement('td');
        commentCell.textContent = client.comment || '-';
        
        const actionsCell = document.createElement('td');
        actionsCell.className = 'action-buttons';
        
        // Add action buttons based on status
        if (client.status === STATUS.WAITING) {
            const seenBtn = document.createElement('button');
            seenBtn.textContent = 'Start';
            seenBtn.className = 'seen-btn';
            seenBtn.onclick = function() {
                updateClientStatus(client.id, STATUS.IN_PROGRESS);
            };
            actionsCell.appendChild(seenBtn);
        }
        
        if (client.status === STATUS.IN_PROGRESS) {
            const completeBtn = document.createElement('button');
            completeBtn.textContent = 'Complete';
            completeBtn.className = 'complete-btn';
            completeBtn.onclick = function() {
                updateClientStatus(client.id, STATUS.COMPLETED);
            };
            actionsCell.appendChild(completeBtn);
        }
        
        // Append all cells to the row
        row.appendChild(statusCell);
        row.appendChild(nameCell);
        row.appendChild(purposeCell);
        row.appendChild(timeCell);
        row.appendChild(commentCell);
        row.appendChild(actionsCell);
        
        // If this is a new client, highlight it
        if (client.status === STATUS.WAITING && client.timestamp > lastCheckTime) {
            row.classList.add('highlight-row');
        }
        
        tableBody.appendChild(row);
    });
    
    // Update last check time
    lastCheckTime = Date.now();
}

// Get status label text
function getStatusLabel(status) {
    switch(status) {
        case STATUS.WAITING:
            return 'Waiting';
        case STATUS.IN_PROGRESS:
            return 'In Progress';
        case STATUS.COMPLETED:
            return 'Completed';
        default:
            return 'Unknown';
    }
}

// Update client status
function updateClientStatus(clientId, newStatus) {
    // Find the client in the queue
    const clientIndex = clientQueue.findIndex(client => client.id === clientId);
    if (clientIndex === -1) return;

    // Update client status
    clientQueue[clientIndex].status = newStatus;
    
    // Add timing information
    if (newStatus === STATUS.IN_PROGRESS) {
        clientQueue[clientIndex].startTime = new Date();
    } else if (newStatus === STATUS.COMPLETED) {
        clientQueue[clientIndex].completionTime = new Date();
    }

    // Save updated client queue to localStorage
    localStorage.setItem('clientQueue', JSON.stringify(clientQueue));

    // Refresh the table
    checkForNewClients();
}

function exportClientsAsCSV() {
    if (!selectedDepartment) {
        alert('Please select a department first');
        return;
    }
    
    const clients = clientQueue.filter(client => client.department === selectedDepartment);
    
    if (clients.length === 0) {
        alert('No clients to export');
        return;
    }
    
    let csvContent = "ID,Name,Purpose,Time,Department,Status,Comments\n";
    clients.forEach(client => {
        csvContent += `${client.id},`;
        csvContent += `"${client.name}",`;
        csvContent += `"${client.purpose}",`;
        csvContent += `${client.time},`;
        csvContent += `"${client.departmentText || client.department}",`;
        csvContent += `${getStatusLabel(client.status)},`;
        csvContent += `"${client.comment || ''}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clients_${selectedDepartment}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generateDailyReport() {
    if (!selectedDepartment) {
        alert('Please select a department first');
        return;
    }
    
    const today = new Date().toLocaleDateString();
    const departmentClients = clientQueue.filter(client => client.department === selectedDepartment);
    
    if (departmentClients.length === 0) {
        alert(`No clients for ${selectedDepartment} today`);
        return;
    }
    
    // Count clients by status
    const waiting = departmentClients.filter(c => c.status === STATUS.WAITING).length;
    const inProgress = departmentClients.filter(c => c.status === STATUS.IN_PROGRESS).length;
    const completed = departmentClients.filter(c => c.status === STATUS.COMPLETED).length;
    
    let reportContent = `Daily Report for ${selectedDepartment} (${today})\n\n`;
    reportContent += `Total Clients: ${departmentClients.length}\n`;
    reportContent += `Waiting: ${waiting}\n`;
    reportContent += `In Progress: ${inProgress}\n`;
    reportContent += `Completed: ${completed}\n`;
    
    alert(reportContent);
}

// Display end of day report
function displayEndOfDayReport() {
    if (!selectedDepartment) {
        alert('Please select a department first');
        return;
    }
    
    const today = new Date().toLocaleDateString();
    const departmentClients = clientQueue.filter(client => client.department === selectedDepartment);
    
    if (departmentClients.length === 0) {
        alert(`No clients for ${selectedDepartment} today`);
        return;
    }
    
    // Count clients by status
    const waiting = departmentClients.filter(c => c.status === STATUS.WAITING).length;
    const inProgress = departmentClients.filter(c => c.status === STATUS.IN_PROGRESS).length;
    const completed = departmentClients.filter(c => c.status === STATUS.COMPLETED).length;
    
    let reportContent = `END OF DAY REPORT - ${selectedDepartment} (${today})\n`;
    reportContent += `===================================\n\n`;
    reportContent += `SUMMARY:\n`;
    reportContent += `Total Clients: ${departmentClients.length}\n`;
    reportContent += `Waiting: ${waiting}\n`;
    reportContent += `In Progress: ${inProgress}\n`;
    reportContent += `Completed: ${completed}\n\n`;
    
    reportContent += `CLIENT LIST:\n`;
    departmentClients.forEach((client, index) => {
        reportContent += `${index + 1}. ${client.name} - ${client.purpose} (${getStatusLabel(client.status)})\n`;
    });
    
    alert(reportContent);
}

// Run date-specific report
function runDateSpecificReport() {
    const dateInput = document.getElementById('reportDate');
    if (!dateInput || !dateInput.value) {
        alert('Please select a date');
        return;
    }
    
    if (!selectedDepartment) {
        alert('Please select a department first');
        return;
    }
    
    alert(`Date-specific reports not implemented yet. Selected date: ${dateInput.value}`);
}
