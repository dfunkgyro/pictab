// Staff Roster Manager Application

let rosterData = null;
let currentEditCell = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    await loadRosterData();
    renderLegend();
    renderRosterTable();
    setupEventListeners();
});

// Load roster data from JSON file
async function loadRosterData() {
    try {
        const response = await fetch('data/roster.json');
        rosterData = await response.json();
    } catch (error) {
        console.error('Error loading roster data:', error);
        // Initialize with empty data if file not found
        rosterData = {
            metadata: {
                title: "Staff Roster",
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                shiftCodes: {
                    "R": { "name": "Rest", "color": "#FFFFFF" },
                    "N12": { "name": "Night 12hr", "color": "#FFFFFF" },
                    "N": { "name": "Night", "color": "#FFFF00" },
                    "D": { "name": "Day", "color": "#FFFF00" },
                    "E": { "name": "Evening", "color": "#FFFF00" },
                    "C": { "name": "Cover", "color": "#FFFFFF" },
                    "L": { "name": "Late", "color": "#FFFFFF" },
                    "A/L": { "name": "Annual Leave", "color": "#FFFF00" },
                    "AD": { "name": "Admin Day", "color": "#FFFFFF" },
                    "Tr": { "name": "Training", "color": "#00FF00" },
                    "Sick": { "name": "Sick Leave", "color": "#FF0000" }
                }
            },
            employees: []
        };
    }
}

// Render the legend
function renderLegend() {
    const legendContainer = document.getElementById('legendItems');
    legendContainer.innerHTML = '';

    for (const [code, info] of Object.entries(rosterData.metadata.shiftCodes)) {
        const item = document.createElement('div');
        item.className = 'legend-item';

        const colorBox = document.createElement('div');
        colorBox.className = `legend-color shift-${code.replace('/', '')}`;
        colorBox.textContent = code;
        colorBox.style.backgroundColor = info.color;

        const label = document.createElement('span');
        label.textContent = info.name;

        item.appendChild(colorBox);
        item.appendChild(label);
        legendContainer.appendChild(item);
    }
}

// Generate date range between start and end dates
function getDateRange(startDate, endDate) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

// Format date as YYYY-MM-DD
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Get day name abbreviation
function getDayName(date) {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[date.getDay()];
}

// Get month name
function getMonthName(date) {
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
                    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    return months[date.getMonth()];
}

// Check if date is weekend
function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
}

// Render the roster table
function renderRosterTable() {
    const dates = getDateRange(rosterData.metadata.startDate, rosterData.metadata.endDate);

    // Build header
    const thead = document.getElementById('tableHeader');
    thead.innerHTML = '';

    // Month row
    const monthRow = document.createElement('tr');
    const emptyMonthCell = document.createElement('th');
    emptyMonthCell.className = 'employee-header';
    emptyMonthCell.rowSpan = 3;
    emptyMonthCell.textContent = 'Employee';
    monthRow.appendChild(emptyMonthCell);

    // Actions column header
    const actionsHeader = document.createElement('th');
    actionsHeader.rowSpan = 3;
    actionsHeader.textContent = '';
    actionsHeader.style.minWidth = '40px';
    monthRow.appendChild(actionsHeader);

    // Group dates by month
    let currentMonth = null;
    let monthColspan = 0;
    const monthCells = [];

    dates.forEach((date, index) => {
        const monthName = getMonthName(date);
        if (monthName !== currentMonth) {
            if (currentMonth !== null) {
                monthCells.push({ month: currentMonth, colspan: monthColspan });
            }
            currentMonth = monthName;
            monthColspan = 1;
        } else {
            monthColspan++;
        }
        if (index === dates.length - 1) {
            monthCells.push({ month: currentMonth, colspan: monthColspan });
        }
    });

    monthCells.forEach(({ month, colspan }) => {
        const th = document.createElement('th');
        th.className = 'month-header';
        th.colSpan = colspan;
        th.textContent = month;
        monthRow.appendChild(th);
    });

    thead.appendChild(monthRow);

    // Day names row
    const dayRow = document.createElement('tr');
    dates.forEach(date => {
        const th = document.createElement('th');
        th.className = 'day-header';
        th.textContent = getDayName(date);
        if (isWeekend(date)) {
            th.classList.add('weekend');
        }
        dayRow.appendChild(th);
    });
    thead.appendChild(dayRow);

    // Date numbers row
    const dateRow = document.createElement('tr');
    dates.forEach(date => {
        const th = document.createElement('th');
        th.className = 'date-header';
        th.textContent = date.getDate().toString().padStart(2, '0');
        if (isWeekend(date)) {
            th.classList.add('weekend');
        }
        dateRow.appendChild(th);
    });
    thead.appendChild(dateRow);

    // Build body
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    rosterData.employees.forEach(employee => {
        const row = document.createElement('tr');

        // Employee name cell
        const nameCell = document.createElement('td');
        nameCell.className = 'employee-name';
        nameCell.textContent = employee.name;
        row.appendChild(nameCell);

        // Delete button cell
        const deleteCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = 'Remove employee';
        deleteBtn.onclick = () => deleteEmployee(employee.id);
        deleteCell.appendChild(deleteBtn);
        row.appendChild(deleteCell);

        // Shift cells
        dates.forEach(date => {
            const dateStr = formatDate(date);
            const shift = employee.shifts[dateStr] || 'R';

            const cell = document.createElement('td');
            cell.className = `shift-cell shift-${shift.replace('/', '')}`;
            cell.textContent = shift;
            cell.dataset.employeeId = employee.id;
            cell.dataset.date = dateStr;

            if (isWeekend(date)) {
                cell.classList.add('weekend');
            }

            cell.onclick = () => openEditModal(employee.id, dateStr, shift);
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
}

// Open edit modal
function openEditModal(employeeId, date, currentShift) {
    const employee = rosterData.employees.find(e => e.id === employeeId);
    const modal = document.getElementById('editModal');

    document.getElementById('modalEmployee').textContent = employee.name;
    document.getElementById('modalDate').textContent = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Populate shift select
    const select = document.getElementById('shiftSelect');
    select.innerHTML = '';
    for (const [code, info] of Object.entries(rosterData.metadata.shiftCodes)) {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = `${code} - ${info.name}`;
        if (code === currentShift) {
            option.selected = true;
        }
        select.appendChild(option);
    }

    currentEditCell = { employeeId, date };
    modal.style.display = 'block';
}

// Save shift change
function saveShift() {
    if (!currentEditCell) return;

    const newShift = document.getElementById('shiftSelect').value;
    const employee = rosterData.employees.find(e => e.id === currentEditCell.employeeId);

    if (employee) {
        employee.shifts[currentEditCell.date] = newShift;
        renderRosterTable();
    }

    closeEditModal();
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditCell = null;
}

// Open add employee modal
function openAddEmployeeModal() {
    const modal = document.getElementById('addEmployeeModal');
    document.getElementById('employeeName').value = '';

    // Populate default shift select
    const select = document.getElementById('defaultShift');
    select.innerHTML = '';
    for (const [code, info] of Object.entries(rosterData.metadata.shiftCodes)) {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = `${code} - ${info.name}`;
        select.appendChild(option);
    }

    modal.style.display = 'block';
}

// Add new employee
function addEmployee() {
    const name = document.getElementById('employeeName').value.trim();
    const defaultShift = document.getElementById('defaultShift').value;

    if (!name) {
        alert('Please enter an employee name');
        return;
    }

    // Generate new ID
    const maxId = Math.max(...rosterData.employees.map(e => e.id), 0);
    const newId = maxId + 1;

    // Create shifts object with default shift for all dates
    const dates = getDateRange(rosterData.metadata.startDate, rosterData.metadata.endDate);
    const shifts = {};
    dates.forEach(date => {
        shifts[formatDate(date)] = defaultShift;
    });

    // Add employee
    rosterData.employees.push({
        id: newId,
        name: name,
        shifts: shifts
    });

    renderRosterTable();
    closeAddEmployeeModal();
}

// Close add employee modal
function closeAddEmployeeModal() {
    document.getElementById('addEmployeeModal').style.display = 'none';
}

// Delete employee
function deleteEmployee(employeeId) {
    const employee = rosterData.employees.find(e => e.id === employeeId);
    if (confirm(`Are you sure you want to remove ${employee.name} from the roster?`)) {
        rosterData.employees = rosterData.employees.filter(e => e.id !== employeeId);
        renderRosterTable();
    }
}

// Export roster data as JSON
function exportData() {
    const dataStr = JSON.stringify(rosterData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'roster_export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Print roster
function printRoster() {
    window.print();
}

// Setup event listeners
function setupEventListeners() {
    // Add employee button
    document.getElementById('addEmployee').onclick = openAddEmployeeModal;

    // Export button
    document.getElementById('exportData').onclick = exportData;

    // Print button
    document.getElementById('printRoster').onclick = printRoster;

    // Save shift button
    document.getElementById('saveShift').onclick = saveShift;

    // Cancel edit button
    document.getElementById('cancelEdit').onclick = closeEditModal;

    // Save employee button
    document.getElementById('saveEmployee').onclick = addEmployee;

    // Cancel add employee button
    document.getElementById('cancelAddEmployee').onclick = closeAddEmployeeModal;

    // Close modals on X click
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.onclick = function() {
            this.closest('.modal').style.display = 'none';
        };
    });

    // Close modals on outside click
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeEditModal();
            closeAddEmployeeModal();
        }
    });
}

// API for external manipulation
window.RosterAPI = {
    // Get all roster data
    getData: () => rosterData,

    // Set roster data
    setData: (data) => {
        rosterData = data;
        renderLegend();
        renderRosterTable();
    },

    // Get employee by ID
    getEmployee: (id) => rosterData.employees.find(e => e.id === id),

    // Update employee shift
    updateShift: (employeeId, date, shiftCode) => {
        const employee = rosterData.employees.find(e => e.id === employeeId);
        if (employee) {
            employee.shifts[date] = shiftCode;
            renderRosterTable();
            return true;
        }
        return false;
    },

    // Add employee
    addEmployee: (name, defaultShift = 'R') => {
        const maxId = Math.max(...rosterData.employees.map(e => e.id), 0);
        const dates = getDateRange(rosterData.metadata.startDate, rosterData.metadata.endDate);
        const shifts = {};
        dates.forEach(date => {
            shifts[formatDate(date)] = defaultShift;
        });

        const newEmployee = {
            id: maxId + 1,
            name: name,
            shifts: shifts
        };

        rosterData.employees.push(newEmployee);
        renderRosterTable();
        return newEmployee;
    },

    // Remove employee
    removeEmployee: (id) => {
        const index = rosterData.employees.findIndex(e => e.id === id);
        if (index !== -1) {
            rosterData.employees.splice(index, 1);
            renderRosterTable();
            return true;
        }
        return false;
    },

    // Get shifts for a specific date
    getShiftsForDate: (date) => {
        const result = {};
        rosterData.employees.forEach(emp => {
            result[emp.name] = emp.shifts[date] || 'R';
        });
        return result;
    },

    // Get employee schedule
    getEmployeeSchedule: (employeeId) => {
        const employee = rosterData.employees.find(e => e.id === employeeId);
        return employee ? employee.shifts : null;
    },

    // Add new shift code
    addShiftCode: (code, name, color) => {
        rosterData.metadata.shiftCodes[code] = { name, color };
        renderLegend();
    },

    // Export to JSON string
    exportJSON: () => JSON.stringify(rosterData, null, 2),

    // Import from JSON string
    importJSON: (jsonString) => {
        try {
            const data = JSON.parse(jsonString);
            rosterData = data;
            renderLegend();
            renderRosterTable();
            return true;
        } catch (e) {
            console.error('Invalid JSON:', e);
            return false;
        }
    }
};
