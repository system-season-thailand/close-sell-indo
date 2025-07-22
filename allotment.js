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










// (Drag close/open functionality removed in favour of simple booking click)


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

// In new persistence model each hotel stores an array of booking objects in a single
// row of table `allotment_indo`. Keep the array in memory for quick updates.
let hotelBookings = []; // [{room_id, month_name, day_number, user_code}]

// Will hold release days value for currently selected hotel (set by selector script)
let currentReleaseDays = 0;

// Fetch (or initialise) bookings JSON for the current hotel
async function loadHotelBookings() {
    if (!currentHotel) return;
    const { data, error } = await supabase
        .from('allotment_indo')
        .select('bookings')
        .eq('hotel_name', currentHotel)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Failed to load bookings', error);
        hotelBookings = [];
        return;
    }

    if (data && Array.isArray(data.bookings)) {
        hotelBookings = data.bookings;
    } else {
        hotelBookings = [];
    }
}

// --- Load hotel data and render table (replaces hotelSelector change event) ---
async function loadHotelData(hotelName) {
    if (!hotelName) return;
    const { data, error } = await supabase.from(hotelName).select('*').order('id');
    if (error) return alert('Failed to load hotel data');
    hotelData = data;

    // Load bookings for this hotel
    await loadHotelBookings();

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


    html += `<tr><td>Total Unit</td>`;
    days.forEach(day => html += `<th>1</th>`);

    html += `</tr></thead><tbody>`;

    hotelData.forEach(row => {
        html += `<tr data-id="${row.id}" data-room-type="${row["Room Type"]}"><td>${row["Room Type"]}</td>`;

        // Parse current month string like "7-8, 11-12, 30"
        const closedDays = parseCloseDays(row[month]);

        days.forEach(day => {
            const isClosed = closedDays.includes(day);

            // Determine if this cell falls inside the "released" window
            let isReleased = false;
            if (!isClosed && (currentReleaseDays || 0) > 0) {
                const today = new Date();

                // Build a Date object that represents this table cell
                const monthIndex = months.indexOf(month);
                const cellDate = new Date(today.getFullYear(), monthIndex, day);

                // If the cell month is ahead of the current month, assume it's from the previous year
                if (monthIndex > today.getMonth()) {
                    cellDate.setFullYear(today.getFullYear() - 1);
                }

                // Calculate boundary dates
                const twoMonthsAgo = new Date(today);
                twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

                const releaseBoundary = new Date(today);
                releaseBoundary.setDate(releaseBoundary.getDate() + currentReleaseDays);

                isReleased = cellDate >= twoMonthsAgo && cellDate <= releaseBoundary;
            }

            let classes = isClosed ? 'closed' : (isReleased ? 'released' : 'available');
            const cellText = (isClosed || isReleased) ? day : '';

            html += `<td class="${classes}" data-day="${day}" data-month="${month}">${cellText}</td>`;
        });

        html += `</tr>`;
    });

    html += `</tbody></table>`;
    tableContainer.innerHTML = html;

    // Paint bookings from hotelBookings array
    paintBookings(month);

    attachCellListeners();
}

// Apply green booked styling from hotelBookings array for given month
function paintBookings(month) {
    if (!hotelBookings.length) return;
    hotelBookings
        .filter(b => b.month_name === month)
        .forEach(({ room_id, day_number, user_code }) => {
            const selector = `tr[data-id="${room_id}"] td[data-month="${month}"][data-day="${day_number}"]`;
            const cell = document.querySelector(selector);
            if (cell) {
                // Store original state if not already stored
                if (!cell.dataset.originalClass) {
                    const origClass = cell.classList.contains('closed') ? 'closed' : (cell.classList.contains('released') ? 'released' : 'available');
                    cell.dataset.originalClass = origClass;
                    cell.dataset.originalContent = cell.innerHTML;
                }

                cell.classList.remove('available', 'released', 'closed');
                cell.classList.add('booked');
                cell.innerHTML = `${day_number}<br>(${user_code})`;
            }
        });
}

function attachCellListeners() {
    const cells = document.querySelectorAll('td[data-day]');

    cells.forEach(cell => {
        cell.addEventListener('mousedown', e => {
            if (!isEditor) return; // prevent editing in view mode
            e.preventDefault();
            const dayText = cell.dataset.day;

            // Toggle booking
            if (cell.classList.contains('booked')) {
                // --- UNBOOK: restore stored original state ---
                const originalClass = cell.dataset.originalClass || 'available';

                cell.classList.remove('booked');
                cell.classList.remove('available', 'released', 'closed');
                if (originalClass !== 'available') {
                    cell.classList.add(originalClass);
                } else {
                    cell.classList.add('available');
                }

                // Restore original content
                cell.innerHTML = cell.dataset.originalContent || '';

                persistBooking(cell); // Save unbooking
            } else {
                // --- BOOK ---
                // Store original state for future restore
                const origClass = cell.classList.contains('closed') ? 'closed' : (cell.classList.contains('released') ? 'released' : 'available');
                cell.dataset.originalClass = origClass;
                cell.dataset.originalContent = cell.innerHTML;

                const code = getCurrentUserCode();
                cell.classList.remove('available', 'released', 'closed');
                cell.classList.add('booked');
                cell.innerHTML = `${dayText}<br>(${code})`;
                persistBooking(cell); // Save booking
            }
        });


        cell.addEventListener('mouseenter', () => {
            // No drag hover logic for simple booking
        });

        document.addEventListener('mouseup', async () => {
            // No drag hover logic for simple booking
        });
    });
}

function handleCellToggle(cell) {
    // No drag hover logic for simple booking
}

function handleDragHover(cell) {
    // No drag hover logic for simple booking
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

// Save or delete booking for a specific cell
async function persistBooking(cell) {
    const row = cell.closest('tr');
    if (!row) return;

    const bookingObj = {
        room_id: parseInt(row.dataset.id),
        room_type: row.dataset.roomType || '',
        month_name: cell.dataset.month,
        day_number: parseInt(cell.dataset.day),
        user_code: getCurrentUserCode()
    };

    const idx = hotelBookings.findIndex(b =>
        b.room_id === bookingObj.room_id &&
        b.month_name === bookingObj.month_name &&
        b.day_number === bookingObj.day_number);

    if (cell.classList.contains('booked')) {
        // Add or replace
        if (idx >= 0) {
            hotelBookings[idx] = bookingObj;
        } else {
            hotelBookings.push(bookingObj);
        }
    } else {
        // Remove booking from array
        if (idx >= 0) hotelBookings.splice(idx, 1);
    }

    // Persist full array
    await supabase
        .from('allotment_indo')
        .upsert({ hotel_name: currentHotel, bookings: hotelBookings }, { onConflict: ['hotel_name'] });
}
















