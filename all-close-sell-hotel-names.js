
// --- Hotel Names Array (replace/add as needed) ---
const closeSellHotelNames = [
    "Agranusa Villa",
    "Aloft Kuta",
    "Courtyard Seminyak",
    "Double Six Luxury",
    "Inara Alas Harum",
    "K Club",
    "Kappa Senses Ubud",
    "Komaneka Keramas",
    "Komaneka Tanggayuda",
    "Mamaka By Ovolo",
    "Movenpick Jimbaran",
    "Padma Legian",
    "Padma Ubud",
    "Parkroyal Serviced Suites",
    "Renaissance Nusa Dua",
    "Renaissance Uluwatu",
    "Samsara Ubud",
    "Seres Spring",
    "Sheraton Kuta",
    "Six Senses Uluwatu",
    "Tejaprana Resort & Spa",
    "The Apurva Kempinski",
    "The Nest Nusa Dua",
    "The Trans Bali",
    "The Westin Ubud",
    "Tribe Kuta",
    "Ulu Segara",
    "Holiday Inn Nusa Dua",
    "The Meru Sanur",
    "Bali Beach Hotel Sanur",
    "Anantara Ubud Bali Resort",
    "Indigo Bali",
];






























// --- Custom Searchable Hotel Selector ---
function renderHotelSelector() {
    const container = document.getElementById('hotelSelectorContainer');
    container.innerHTML = `
        <input type="text" class="hotel-search-input" placeholder="Search hotel..." autocomplete="off" />
        <div class="hotel-dropdown-list" style="display:none;"></div>
    `;
    const input = container.querySelector('.hotel-search-input');
    const dropdown = container.querySelector('.hotel-dropdown-list');
    let filtered = closeSellHotelNames.slice();
    let dropdownOpen = false;
    let activeIndex = -1;

    function showDropdown() {
        dropdown.style.display = 'block';
        dropdownOpen = true;
    }
    function hideDropdown() {
        dropdown.style.display = 'none';
        dropdownOpen = false;
        activeIndex = -1;
    }
    function renderList() {
        if (!filtered.length) {
            dropdown.innerHTML = `<div class="hotel-dropdown-empty">No hotels found</div>`;
            return;
        }
        dropdown.innerHTML = filtered.map((name, i) =>
            `<div class="hotel-dropdown-item${i === activeIndex ? ' active' : ''}" data-index="${i}">${name}</div>`
        ).join('');
    }
    function selectHotel(name) {
        input.value = name;
        hideDropdown();
        // Set currentHotel and trigger data load
        currentHotel = name;
        loadHotelData(name);

        // Update the hotel name title
        const hotelNameTitleElement = document.getElementById('currentHotelNameTitle');
        if (hotelNameTitleElement) {
            hotelNameTitleElement.textContent = name;
        }
    }
    input.addEventListener('input', () => {
        const val = input.value.trim().toLowerCase();
        filtered = closeSellHotelNames.filter(h => h.toLowerCase().includes(val));
        renderList();
        showDropdown();
    });
    input.addEventListener('click', () => {
        input.value = '';
        filtered = closeSellHotelNames.slice();
        activeIndex = -1;
        renderList();
        showDropdown();
    });
    input.addEventListener('focus', () => {
        filtered = closeSellHotelNames.filter(h => h.toLowerCase().includes(input.value.trim().toLowerCase()));
        renderList();
        showDropdown();
    });
    input.addEventListener('keydown', e => {
        if (!dropdownOpen) return;
        if (e.key === 'ArrowDown') {
            activeIndex = (activeIndex + 1) % filtered.length;
            renderList();
            e.preventDefault();
        } else if (e.key === 'ArrowUp') {
            activeIndex = (activeIndex - 1 + filtered.length) % filtered.length;
            renderList();
            e.preventDefault();
        } else if (e.key === 'Enter') {
            if (activeIndex >= 0 && filtered[activeIndex]) {
                selectHotel(filtered[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            hideDropdown();
        }
    });
    dropdown.addEventListener('mousedown', e => {
        if (e.target.classList.contains('hotel-dropdown-item')) {
            const idx = +e.target.dataset.index;
            selectHotel(filtered[idx]);
        }
    });
    document.addEventListener('mousedown', e => {
        if (!container.contains(e.target)) hideDropdown();
    });
}