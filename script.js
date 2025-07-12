/* Variable to check if the user is an editor or not */
let isEditor = false;

// Role Modal logic
const toggleModeBtn = document.getElementById("toggleModeBtn");
const roleModal = document.getElementById("roleModal");
const viewModeBtn = document.getElementById("viewModeBtn");
const editorModeBtn = document.getElementById("editorModeBtn");
const editorPassword = document.getElementById("editorPassword");

toggleModeBtn.addEventListener("click", () => {
    roleModal.style.display = "block";
});

viewModeBtn.addEventListener("click", () => {
    isEditor = false;
    localStorage.setItem("UserMode", "view");
    document.body.classList.add("view-mode");
    roleModal.style.display = "none";
    alert("View mode enabled — editing is disabled.");
});

editorModeBtn.addEventListener("click", () => {
    if (editorPassword.value === "bndr123") {
        isEditor = true;
        localStorage.setItem("UserMode", "editor");
        document.body.classList.remove("view-mode");
        roleModal.style.display = "none";
        alert("Editor mode enabled.");
    } else {
        alert("Password is Incorrect");
    }
});

// Close modal if clicking outside the content
window.addEventListener("click", e => {
    if (e.target === roleModal) {
        roleModal.style.display = "none";
    }
});

window.addEventListener('DOMContentLoaded', () => {
    const savedMode = localStorage.getItem("UserMode");

    if (savedMode === "editor") {
        isEditor = true;
        document.body.classList.remove("view-mode");
    } else {
        isEditor = false;
        document.body.classList.add("view-mode");
    }
});










let isDragging = false;
let dragAction = null; // 'close' or 'open'
let changedCells = [];
let dragPath = []; // ordered cells hovered
let originalStates = new Map(); // store each cell’s original class






const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysInMonth = {
    January: 31, February: 29, March: 31, April: 30, May: 31, June: 30,
    July: 31, August: 31, September: 30, October: 31, November: 30, December: 31
};

const hotelSelector = document.getElementById('hotelSelector');
const monthTabs = document.getElementById('monthTabs');
const tableContainer = document.getElementById('tableContainer');

let currentHotel = '';
let currentMonth = 'January';
let hotelData = [];





// --- Load hotel data and render table (replaces hotelSelector change event) ---
async function loadHotelData(hotelName) {
    if (!hotelName) return;
    const { data, error } = await supabase.from(hotelName).select('*');
    if (error) return alert('Failed to load hotel data');
    hotelData = data;

    // Update the hotel name title
    const hotelNameTitleElement = document.getElementById('currentHotelNameTitle');
    if (hotelNameTitleElement) {
        hotelNameTitleElement.textContent = hotelName;
    }

    renderTabs();
    renderMonthTable(currentMonth);
}

// --- Call renderHotelSelector on page load ---
document.addEventListener('DOMContentLoaded', () => {
    renderHotelSelector();
});


function renderTabs() {
    monthTabs.innerHTML = '';
    months.forEach(month => {
        const btn = document.createElement('button');
        btn.className = 'tab-button' + (month === currentMonth ? ' active' : '');
        btn.textContent = month;
        btn.addEventListener('click', () => {
            currentMonth = month;
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderMonthTable(month);
        });
        monthTabs.appendChild(btn);
    });

    // Set initial month title
    const monthTitleElement = document.getElementById('currentMonthTitle');
    if (monthTitleElement) {
        monthTitleElement.textContent = currentMonth;
    }
}

function renderMonthTable(month) {
    // Update the month title
    const monthTitleElement = document.getElementById('currentMonthTitle');
    if (monthTitleElement) {
        monthTitleElement.textContent = month;
    }

    const days = Array.from({ length: daysInMonth[month] }, (_, i) => i + 1);
    let html = `<table><thead><tr><th>Room Type</th>`;
    days.forEach(day => html += `<th>${day}</th>`);
    html += `</tr></thead><tbody>`;

    hotelData.forEach(row => {
        html += `<tr data-id="${row.id}" data-room-type="${row["Room Type"]}"><td>${row["Room Type"]}</td>`;

        // Parse current month string like "7-8, 11-12, 30"
        const closedDays = parseCloseDays(row[month]);

        days.forEach(day => {
            const isClosed = closedDays.includes(day);
            html += `<td class="${isClosed ? 'closed' : 'available'}" data-day="${day}" data-month="${month}">${isClosed ? day : ''}</td>`;
        });

        html += `</tr>`;
    });

    html += `</tbody></table>`;
    tableContainer.innerHTML = html;

    attachCellListeners();
}

function attachCellListeners() {
    const cells = document.querySelectorAll('td[data-day]');

    cells.forEach(cell => {
        cell.addEventListener('mousedown', e => {
            if (!isEditor) return; // prevent editing in view mode
            e.preventDefault();
            isDragging = true;
            dragPath = [];
            originalStates = new Map();

            dragAction = cell.classList.contains('closed') ? 'open' : 'close';

            handleDragHover(cell);
        });


        cell.addEventListener('mouseenter', () => {
            if (isDragging && isEditor) handleDragHover(cell);
        });

        document.addEventListener('mouseup', async () => {
            if (!isDragging || !isEditor) return;
            isDragging = false;

            const updatesByRow = {};

            dragPath.forEach(cell => {
                const row = cell.closest('tr');
                const rowId = parseInt(row.dataset.id);
                const month = cell.dataset.month;
                const day = parseInt(cell.dataset.day);

                if (!updatesByRow[rowId]) {
                    updatesByRow[rowId] = {
                        id: rowId,
                        month: month,
                        days: new Set(parseCloseDays(hotelData.find(r => r.id === rowId)[month]))
                    };
                }

                const entry = updatesByRow[rowId];
                if (cell.classList.contains('closed')) {
                    entry.days.add(day);
                } else {
                    entry.days.delete(day);
                }
            });

            for (const rowId in updatesByRow) {
                const entry = updatesByRow[rowId];
                const newValue = formatCloseDays([...entry.days]);
                const { error } = await supabase
                    .from(currentHotel)
                    .update({ [entry.month]: newValue })
                    .eq('id', entry.id);

                if (!error) {
                    hotelData.find(r => r.id === entry.id)[entry.month] = newValue;
                } else {
                    alert('Failed to update Supabase');
                }
            }

            dragPath = [];
            originalStates = new Map();
        });
    });
}

function handleCellToggle(cell) {
    if (changedCells.includes(cell)) return; // skip if already processed in this drag

    const isClosed = cell.classList.contains('closed');

    if ((dragAction === 'close' && !isClosed) || (dragAction === 'open' && isClosed)) {
        cell.classList.toggle('closed');
        cell.classList.toggle('available');
        cell.textContent = cell.classList.contains('closed') ? cell.dataset.day : '';
        changedCells.push(cell);
    }
}

function handleDragHover(cell) {
    if (dragPath.includes(cell)) {
        // If backtracking
        const lastIndex = dragPath.indexOf(cell);
        const toUndo = dragPath.splice(lastIndex + 1); // remove all after this cell
        toUndo.forEach(c => {
            const originalClass = originalStates.get(c);
            if (originalClass === 'closed') {
                c.classList.remove('available');
                c.classList.add('closed');
                c.textContent = c.dataset.day;
            } else {
                c.classList.remove('closed');
                c.classList.add('available');
                c.textContent = '';
            }
        });
    } else {
        // First time hover
        originalStates.set(cell, cell.classList.contains('closed') ? 'closed' : 'available');
        if (dragAction === 'close') {
            cell.classList.remove('available');
            cell.classList.add('closed');
            cell.textContent = cell.dataset.day;
        } else {
            cell.classList.remove('closed');
            cell.classList.add('available');
            cell.textContent = '';
        }
        dragPath.push(cell);
    }
}


// Parse string like "1-3, 5, 7-9" to [1,2,3,5,7,8,9]
function parseCloseDays(text) {
    if (!text || text.trim() === '') return [];
    return text.split(',').flatMap(part => {
        const range = part.trim().split('-').map(Number);
        if (range.length === 2) {
            return Array.from({ length: range[1] - range[0] + 1 }, (_, i) => range[0] + i);
        } else if (range.length === 1 && !isNaN(range[0])) {
            return [range[0]];
        }
        return [];
    });
}

// Convert [1,2,3,5,6,7,9] to "1-3, 5-7, 9"
function formatCloseDays(days) {
    if (!days.length) return '';
    days.sort((a, b) => a - b);

    const result = [];
    let start = days[0], end = start;

    for (let i = 1; i <= days.length; i++) {
        if (days[i] === end + 1) {
            end = days[i];
        } else {
            if (start === end) result.push(`${start}`);
            else result.push(`${start}-${end}`);
            start = days[i];
            end = start;
        }
    }

    return result.join(', ');
}
















