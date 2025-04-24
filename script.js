// Client Reception Tracker JavaScript

// Define client statuses
const STATUS = {
    WAITING: 'new',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed'
  };
  
  // Global variables
  let clientQueue = [];
  let clientCounter = 1;
  let completedClients = [];
  
  // Wait for the DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
      // Load any existing clients from localStorage
      loadClientsFromStorage();
      
      // Set up form submission event listener
      const clientForm = document.getElementById('clientForm');
      if (clientForm) {
          clientForm.addEventListener('submit', handleFormSubmit);
      }
      
      // Set time input to current time by default
      document.getElementById('time').value = getCurrentTime();
  });
  
  // Handle form submission
  function handleFormSubmit(event) {
      event.preventDefault();
      
      // Get form values
      const name = document.getElementById('name').value.trim();
      const purpose = document.getElementById('reason');
      const purposeText = purpose.options[purpose.selectedIndex].text;
      const time = document.getElementById('time').value;
      const department = document.getElementById('department');
      
      // Get both the value and text of the department
      const departmentValue = department.value.toUpperCase(); // Store the value to match with department.js
      const departmentText = department.options[department.selectedIndex].text;
      
      const comment = document.getElementById('comment').value.trim();
      
      // Validate form
      if (!name) {
          alert('Please enter client name');
          return;
      }
      
      // Create client object
      const client = {
          id: generateUniqueId(), // Use a unique ID function instead of simple counter
          name: name,
          purpose: purposeText,
          time: time,
          department: departmentValue, // Use the department VALUE instead of TEXT
          departmentText: departmentText, // Keep the text for display purposes
          comment: comment,
          timestamp: new Date().getTime(),
          arrivalTime: new Date(),
          startTime: null,
          completionTime: null,
          seen: false,
          status: STATUS.WAITING
      };
      
      // Add client to queue
      addClientToQueue(client);
      
      // Reset form
      clientForm.reset();
      document.getElementById('time').value = getCurrentTime();
      
      // Focus on name field for next entry
      document.getElementById('name').focus();
  }
  
  // Generate a unique ID (more reliable than counter)
  function generateUniqueId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // Add client to queue and update UI
  function addClientToQueue(client) {
      clientQueue.push(client);
      updateClientTable();
      saveClientsToStorage();
  }
  
  // Update the client table in the UI
  function updateClientTable() {
      const tableBody = document.querySelector('#clientTable tbody');
      tableBody.innerHTML = '';
      
      // Sort clients by timestamp (most recent first)
      const sortedClients = [...clientQueue].sort((a, b) => b.timestamp - a.timestamp);
      
      // Display clients in the table
      sortedClients.forEach((client, index) => {
          const row = document.createElement('tr');
          
          // Create cells for each data point
          const idCell = document.createElement('td');
          idCell.textContent = index + 1;
          
          const nameCell = document.createElement('td');
          nameCell.textContent = client.name;
          
          const purposeCell = document.createElement('td');
          purposeCell.textContent = client.purpose;
          
          const timeCell = document.createElement('td');
          timeCell.textContent = client.time;
          
          // Add status cell
          const statusCell = document.createElement('td');
          statusCell.textContent = getStatusLabel(client.status);
          
          // Add action buttons
          const actionCell = document.createElement('td');
          
          // Only show status update buttons for non-completed clients
          if (client.status !== STATUS.COMPLETED) {
              // Add Start Serving button if client is waiting
              if (client.status === STATUS.WAITING) {
                  const startButton = document.createElement('button');
                  startButton.textContent = 'Start';
                  startButton.className = 'start-btn';
                  startButton.onclick = function() {
                      updateClientStatus(client.id, STATUS.IN_PROGRESS);
                  };
                  actionCell.appendChild(startButton);
              }
              
              // Add Complete button if client is in progress
              if (client.status === STATUS.IN_PROGRESS) {
                  const completeButton = document.createElement('button');
                  completeButton.textContent = 'Complete';
                  completeButton.className = 'complete-btn';
                  completeButton.onclick = function() {
                      updateClientStatus(client.id, STATUS.COMPLETED);
                  };
                  actionCell.appendChild(completeButton);
              }
          }
          
          // Add remove button for all clients
          const removeButton = document.createElement('button');
          removeButton.textContent = 'Remove';
          removeButton.className = 'remove-btn';
          removeButton.onclick = function() {
              removeClient(client.id);
          };
          actionCell.appendChild(removeButton);
          
          // Append cells to row
          row.appendChild(idCell);
          row.appendChild(nameCell);
          row.appendChild(purposeCell);
          row.appendChild(timeCell);
          row.appendChild(statusCell);
          row.appendChild(actionCell);
          
          // Add hover details with department and comments
          row.setAttribute('title', `Department: ${client.departmentText || client.department}${client.comment ? '\nComments: ' + client.comment : ''}`);
          
          // Add data attributes for filtering
          row.setAttribute('data-department', client.department);
          row.setAttribute('data-client-id', client.id);
          row.setAttribute('data-status', client.status);
          
          // Add CSS class based on status
          row.classList.add(`status-${client.status}`);
          
          // Append row to table body
          tableBody.appendChild(row);
      });
  }
  
  // Helper function to convert status code to readable label
  function getStatusLabel(status) {
      switch(status) {
          case STATUS.WAITING:
              return 'Waiting';
          case STATUS.IN_PROGRESS:
              return 'In Progress';
          case STATUS.COMPLETED:
              return 'Completed';
          default:
              return status;
      }
  }
  
  // Update client status
  function updateClientStatus(clientId, newStatus) {
      const clientIndex = clientQueue.findIndex(client => client.id === clientId);
      
      if (clientIndex !== -1) {
          const client = clientQueue[clientIndex];
          client.status = newStatus;
          
          // Update timing information
          if (newStatus === STATUS.IN_PROGRESS) {
              client.startTime = new Date();
          } else if (newStatus === STATUS.COMPLETED) {
              client.completionTime = new Date();
              
              // Move client to completedClients array
              completedClients.push(client);
              clientQueue.splice(clientIndex, 1); // Remove from main queue
          }
          
          updateClientTable();
          saveClientsToStorage();
      }
  }
  
  // Remove client from queue
  function removeClient(clientId) {
      clientQueue = clientQueue.filter(client => client.id !== clientId);
      updateClientTable();
      saveClientsToStorage();
  }
  
  // Clear all clients
  function clearEntries() {
      if (confirm('Are you sure you want to clear all client entries?')) {
          clientQueue = [];
          updateClientTable();
          saveClientsToStorage();
      }
  }
  
  // Get current time in HH:MM format
  function getCurrentTime() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
  }
  
  // Save clients to localStorage
  function saveClientsToStorage() {
      localStorage.setItem('clientQueue', JSON.stringify(clientQueue));
      localStorage.setItem('completedClients', JSON.stringify(completedClients));
      localStorage.setItem('clientCounter', clientCounter.toString());
  }
  
  // Load clients from localStorage
  function loadClientsFromStorage() {
      const savedClients = localStorage.getItem('clientQueue');
      const savedCompletedClients = localStorage.getItem('completedClients');
      const savedCounter = localStorage.getItem('clientCounter');
      
      if (savedClients) {
          clientQueue = JSON.parse(savedClients);
      }
      
      if (savedCompletedClients) {
          completedClients = JSON.parse(savedCompletedClients);
      }
      
      if (savedCounter) {
          clientCounter = parseInt(savedCounter);
      }
      
      updateClientTable();
  }
  
  // Generate daily report (updated feature)
  function generateDailyReport() {
      const today = new Date().toLocaleDateString();
      const clientsByDepartment = {};
      
      clientQueue.forEach(client => {
          const deptName = client.departmentText || client.department;
          if (!clientsByDepartment[deptName]) {
              clientsByDepartment[deptName] = 0;
          }
          clientsByDepartment[deptName]++;
      });
      
      let reportContent = `Daily Client Report - ${today}\n\n`;
      reportContent += `Total Clients: ${clientQueue.length}\n\n`;
      reportContent += `Clients by Department:\n`;
      
      for (const dept in clientsByDepartment) {
          reportContent += `${dept}: ${clientsByDepartment[dept]}\n`;
      }
      
      // Add status breakdown
      const waitingClients = clientQueue.filter(c => c.status === STATUS.WAITING).length;
      const inProgressClients = clientQueue.filter(c => c.status === STATUS.IN_PROGRESS).length;
      const completedClients = clientQueue.filter(c => c.status === STATUS.COMPLETED).length;
      
      reportContent += `\nStatus Breakdown:\n`;
      reportContent += `Waiting: ${waitingClients}\n`;
      reportContent += `In Progress: ${inProgressClients}\n`;
      reportContent += `Completed: ${completedClients}\n`;
      
      // For now just alert the report, but this could be enhanced to export or print
      alert(reportContent);
  }
  
  // NEW METHODS FOR END-OF-DAY REPORTING
  
  // Get all clients from a specific date (YYYY-MM-DD format)
  function getAllClientsByDate(dateString = null) {
      const targetDate = dateString ? new Date(dateString) : new Date();
      
      return clientQueue.filter(client => {
          const clientDate = new Date(client.arrivalTime);
          return isSameDay(clientDate, targetDate);
      });
  }
  
  // Helper function to check if two dates are the same day
  function isSameDay(date1, date2) {
      return date1.getFullYear() === date2.getFullYear() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getDate() === date2.getDate();
  }
  
  // Get end-of-day report for today or a specific date
  function getEndOfDayReport(dateString = null) {
      const targetDate = dateString ? new Date(dateString) : new Date();
      const dailyClients = getAllClientsByDate(targetDate);
      const dailyCompletedClients = completedClients.filter(client => 
          isSameDay(new Date(client.completionTime), targetDate)
      );
      
      // Combine active and completed clients
      const allClients = [...dailyClients, ...dailyCompletedClients];
      
      // Calculate statistics
      const totalClients = allClients.length;
      const waitingClients = dailyClients.filter(c => c.status === STATUS.WAITING).length;
      const inProgressClients = dailyClients.filter(c => c.status === STATUS.IN_PROGRESS).length;
      const completedClientsCount = dailyCompletedClients.length;
      const avgWaitTime = calculateAverageWaitTime(allClients);
      const avgServiceTime = calculateAverageServiceTime(allClients);
      
      // Calculate clients by department
      const clientsByDepartment = {};
      allClients.forEach(client => {
          const deptName = client.departmentText || client.department;
          if (!clientsByDepartment[deptName]) {
              clientsByDepartment[deptName] = 0;
          }
          clientsByDepartment[deptName]++;
      });
      
      return {
          date: targetDate.toLocaleDateString(),
          totalClients,
          waitingClients,
          inProgressClients,
          completedClients: completedClientsCount,
          averageWaitTime: avgWaitTime,
          averageServiceTime: avgServiceTime,
          clientsByDepartment,
          clientList: allClients
      };
  }
  
  // Helper method to calculate average wait time (in minutes)
  function calculateAverageWaitTime(clients) {
      const waitingClients = clients.filter(c => c.startTime);
      if (waitingClients.length === 0) return 0;
      
      const totalWaitTime = waitingClients.reduce((sum, client) => {
          const start = new Date(client.startTime);
          const arrival = new Date(client.arrivalTime);
          return sum + ((start - arrival) / (1000 * 60)); // Convert to minutes
      }, 0);
      
      return Math.round((totalWaitTime / waitingClients.length) * 10) / 10; // Round to 1 decimal place
  }
  
  // Helper method to calculate average service time (in minutes)
  function calculateAverageServiceTime(clients) {
      const servedClients = clients.filter(c => c.completionTime && c.startTime);
      if (servedClients.length === 0) return 0;
      
      const totalServiceTime = servedClients.reduce((sum, client) => {
          const completion = new Date(client.completionTime);
          const start = new Date(client.startTime);
          return sum + ((completion - start) / (1000 * 60)); // Convert to minutes
      }, 0);
      
      return Math.round((totalServiceTime / servedClients.length) * 10) / 10; // Round to 1 decimal place
  }
  
  // Display end of day report in a nicer format
  function displayEndOfDayReport(dateString = null) {
      const report = getEndOfDayReport(dateString);
      
      let reportContent = `END OF DAY REPORT - ${report.date}\n`;
      reportContent += `===================================\n\n`;
      reportContent += `SUMMARY:\n`;
      reportContent += `Total Clients: ${report.totalClients}\n`;
      reportContent += `Completed: ${report.completedClients}\n`;
      reportContent += `In Progress: ${report.inProgressClients}\n`;
      reportContent += `Still Waiting: ${report.waitingClients}\n\n`;
      
      reportContent += `PERFORMANCE METRICS:\n`;
      reportContent += `Average Wait Time: ${report.averageWaitTime} minutes\n`;
      reportContent += `Average Service Time: ${report.averageServiceTime} minutes\n\n`;
      
      reportContent += `CLIENTS BY DEPARTMENT:\n`;
      for (const dept in report.clientsByDepartment) {
          reportContent += `${dept}: ${report.clientsByDepartment[dept]}\n`;
      }
      
      reportContent += `\nFULL CLIENT LIST:\n`;
      report.clientList.forEach((client, index) => {
          reportContent += `${index + 1}. ${client.name} - ${client.purpose} (${getStatusLabel(client.status)})\n`;
      });
      
      // Display the report (this could be enhanced to show in a modal or export)
      alert(reportContent);
      console.log(report); // Log the full report object to console for debugging
      
      return report;
  }
  
  // Export all clients as CSV
  function exportClientsAsCSV(dateString = null) {
      const clients = dateString ? getAllClientsByDate(dateString) : clientQueue;
      
      // Create CSV header
      let csvContent = "ID,Name,Purpose,Time,Department,Status,Arrival Time,Start Time,Completion Time,Wait Time,Service Time\n";
      
      // Add client data
      clients.forEach(client => {
          const waitTime = client.startTime ? 
              Math.round(((new Date(client.startTime) - new Date(client.arrivalTime)) / (1000 * 60)) * 10) / 10 : 
              "N/A";
              
          const serviceTime = (client.completionTime && client.startTime) ? 
              Math.round(((new Date(client.completionTime) - new Date(client.startTime)) / (1000 * 60)) * 10) / 10 : 
              "N/A";
          
          csvContent += `${client.id},`;
          csvContent += `"${client.name}",`;
          csvContent += `"${client.purpose}",`;
          csvContent += `${client.time},`;
          csvContent += `"${client.departmentText || client.department}",`;
          csvContent += `${getStatusLabel(client.status)},`;
          csvContent += `${new Date(client.arrivalTime).toLocaleString()},`;
          csvContent += `${client.startTime ? new Date(client.startTime).toLocaleString() : "N/A"},`;
          csvContent += `${client.completionTime ? new Date(client.completionTime).toLocaleString() : "N/A"},`;
          csvContent += `${waitTime},`;
          csvContent += `${serviceTime}\n`;
      });
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `client_report_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }
  
  // Function to run report for a specific date
  function runDateSpecificReport() {
    const dateInput = document.getElementById('reportDate');
    if (dateInput.value) {
        displayEndOfDayReport(dateInput.value);
    } else {
        alert('Please select a date first');
    }
  }