// Variables globales para rango de horas del calendario
const calendarStartHour = 6;
const calendarEndHour = 22;
const hourWidth = 100; // Define hourWidth globally for consistent calculations
const totalHours = calendarEndHour - calendarStartHour; // Define totalHours globally

// Data (no changes here, assuming it has the 'date' property now)
const users = [
  {
    name: "Michael Johnson",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    events: [
      { id: 1, start: '08:00', end: '09:00', title: "Breakfast", date: '2025-05-19' },
      { id: 2, start: '09:30', end: '10:30', title: "Keynote", date: '2025-05-19' }
    ],
    visible: true
  },
  {
    name: "Dan D McClane",
    avatar: "https://randomuser.me/api/portraits/men/15.jpg",
    events: [
      { id: 3, start: '11:00', end: '12:00', title: "Calendar 101", date: '2025-05-19' }
    ],
    visible: true
  },
  {
    name: "Lisa G Gennero",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    events: [
      { id: 4, start: '10:00', end: '11:00', title: "Gantt 101", date: '2025-05-20' } // Example for another day
    ],
    visible: true
  },
  {
    name: "Malik F Jackson",
    avatar: "https://randomuser.me/api/portraits/men/22.jpg",
    events: [
      { id: 5, start: '11:00', end: '12:00', title: "Grid 101", date: '2025-05-19' },
      { id: 6, start: '14:00', end: '15:30', title: "UI Workshop", date: '2025-05-19' }
    ],
    visible: true
  },
];

const userColumn = document.getElementById("userColumn");
const userRows = document.getElementById("userRows");
const hoursRow = document.getElementById("hoursRow");
const tooltip = document.getElementById("tooltip");
const userCheckboxes = document.getElementById("userCheckboxes");
const datepickerContainer = document.getElementById("datepicker");
const selectedDateEl = document.getElementById("selectedDate");

let selectedDate = new Date();
let currentTimeLine = null; // Variable to hold the current time line element
let currentTimeUpdateInterval = null; // Variable to hold the interval ID

// Helper to format date as YYYY-MM-DD
function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Function to convert decimal to "HH:mm"
function formatHour(decimal) {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Function to convert "HH:mm" to decimal
function parseHourToDecimal(timeStr) {
  if (typeof timeStr === "number") return timeStr;
  if (typeof timeStr !== "string") return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + minutes / 60;
}

// Update displayed selected date
function updateSelectedDateDisplay() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = selectedDate.toLocaleDateString('es-ES', options);
  selectedDateEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
}

// Initialize a simple datepicker (replace with a library if desired)
function setupSimpleDatepicker(container, initialDate, onDateChange) {
    let currentDate = new Date(initialDate); // Use a local copy

    const render = () => {
        container.innerHTML = ''; // Clear existing
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.innerHTML = `
            <button class="prevMonth">◀</button>
            <div class="calendar-month">${currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</div>
            <button class="nextMonth">▶</button>
        `;
        container.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'calendar-grid';

        const dayNames = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
        dayNames.forEach(day => {
            grid.innerHTML += `<div class="calendar-day day-name">${day}</div>`;
        });

        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        const daysInPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
        let startDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Adjust to start on Monday

        // Days from previous month
        for (let i = 0; i < startDayIndex; i++) {
            grid.innerHTML += `<div class="calendar-day other-month">${daysInPrevMonth - startDayIndex + i + 1}</div>`;
        }

        const lastDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(); // Total days

        const today = new Date();

        for (let i = 1; i <= lastDayOfCurrentMonth; i++) {
            const dayClass = [];
            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);

            if (dayDate.toDateString() === today.toDateString()) {
                dayClass.push('today');
            }
            if (dayDate.toDateString() === selectedDate.toDateString()) {
                dayClass.push('selected');
            }
            grid.innerHTML += `<div class="calendar-day ${dayClass.join(' ')}" data-day="${i}">${i}</div>`;
        }

        const totalCells = 42; // 6 rows * 7 days
        const cellsToFill = totalCells - (startDayIndex + lastDayOfCurrentMonth);
        for (let i = 1; i <= cellsToFill; i++) {
            grid.innerHTML += `<div class="calendar-day other-month">${i}</div>`;
        }

        container.appendChild(grid);

        header.querySelector('.prevMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            render();
        });

        header.querySelector('.nextMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            render();
        });

        grid.querySelectorAll('.calendar-day:not(.day-name):not(.other-month)').forEach(dayEl => {
            dayEl.addEventListener('click', () => {
                selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), parseInt(dayEl.dataset.day));
                onDateChange(selectedDate);
                render(); // Re-render to update selected state
            });
        });
    };

    render();
    onDateChange(selectedDate); // Initial call
}

// Function to create and update the current time line
function updateCurrentTimeLine() {
    const today = new Date();
    const isTodaySelected = formatDateToYYYYMMDD(selectedDate) === formatDateToYYYYMMDD(today);

    // If no line exists, create it
    if (!currentTimeLine) {
        currentTimeLine = document.createElement('div');
        currentTimeLine.className = 'current-time-line';
        document.querySelector('.calendar-content').appendChild(currentTimeLine);
    }

    if (isTodaySelected) {
        // Calculate current hour in decimal
        const currentHourDecimal = today.getHours() + today.getMinutes() / 60;

        // Check if current time is within the calendar's visible hours
        if (currentHourDecimal >= calendarStartHour && currentHourDecimal <= calendarEndHour) {
            const leftPosition = (currentHourDecimal - calendarStartHour) * hourWidth;
            currentTimeLine.style.left = `${leftPosition}px`;
            currentTimeLine.style.display = 'block'; // Show the line

            // Update the time displayed on the line
            currentTimeLine.setAttribute('data-time', formatHour(currentHourDecimal));
        } else {
            currentTimeLine.style.display = 'none'; // Hide if outside visible hours
        }
    } else {
        currentTimeLine.style.display = 'none'; // Hide if not today
    }
}

// Generate checkbox for filtering users
function generateUserCheckboxes() {
  userCheckboxes.innerHTML = '';

  users.forEach((user, index) => {
    const checkboxContainer = document.createElement("div");
    checkboxContainer.className = "user-checkbox";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `user-${index}`;
    checkbox.checked = user.visible;

    checkbox.addEventListener("change", () => {
      users[index].visible = checkbox.checked;
      renderCalendar(); // Update calendar when visibility changes
    });

    const label = document.createElement("label");
    label.htmlFor = `user-${index}`;
    label.textContent = user.name;

    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(label);
    userCheckboxes.appendChild(checkboxContainer);
  });
}

// Generate hours from calendarStartHour to calendarEndHour
function renderHoursRow() {
  hoursRow.innerHTML = '';
  for (let i = calendarStartHour; i <= calendarEndHour; i++) {
    const hour = document.createElement("div");
    hour.className = "hour-cell";
    hour.innerText = `${i.toString().padStart(2, '0')}:00`;
    hoursRow.appendChild(hour);
  }
}


// Function to get initials from name
function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('');
}

// Function to render the complete calendar
function renderCalendar() {
  userColumn.innerHTML = '';
  userRows.innerHTML = '';

  const selectedDateYYYYMMDD = formatDateToYYYYMMDD(selectedDate);

  // Render only visible users
  const visibleUsers = users.filter(user => user.visible);

  visibleUsers.forEach((user) => {
    // Create the column with user name, avatar, and event count
    const userEl = document.createElement("div");
    userEl.className = "user-item";

    // Filter events for the selected date
    const userEventsForSelectedDate = user.events.filter(event => event.date === selectedDateYYYYMMDD);

    const userHTML = `
      <div class="user-info">
        <div class="user-avatar">
          ${user.avatar ? `<img src="${user.avatar}" alt="${user.name}">` : getInitials(user.name)}
        </div>
        <div class="user-details">
          <div class="user-name">${user.name}</div>
          <div class="user-events-count">${userEventsForSelectedDate.length} evento${userEventsForSelectedDate.length !== 1 ? 's' : ''}</div>
        </div>
      </div>
    `;

    userEl.innerHTML = userHTML;
    userColumn.appendChild(userEl);

    // Create the row for user events
    const row = document.createElement("div");
    row.className = "user-row";

    userEventsForSelectedDate.forEach((event) => {
      const eventEl = document.createElement("div");
      eventEl.className = "event";
      eventEl.innerText = event.title;

      // Convert start/end to decimal for calculating positions (offsetLeft, width)
      const startDecimal = parseHourToDecimal(event.start);
      const endDecimal = parseHourToDecimal(event.end);

      // Adjust position and size according to global range
      const left = (startDecimal - calendarStartHour) * hourWidth;
      const width = (endDecimal - startDecimal) * hourWidth;
      eventEl.style.left = `${left}px`;
      eventEl.style.width = `${width}px`;

      let isDragging = false;
      let isResizing = false;
      let startX;
      let originalLeft;
      let originalWidth;

      function showTooltip(x, time) {
        tooltip.style.display = 'block';
        tooltip.style.left = `${x + 10}px`;
        tooltip.style.top = `${eventEl.getBoundingClientRect().top - tooltip.offsetHeight - 5}px`;
        tooltip.innerText = time;
      }

      eventEl.addEventListener("mousedown", (e) => {
        e.preventDefault();

        const edgeThreshold = 20;
        if (e.offsetX > eventEl.offsetWidth - edgeThreshold && e.target === eventEl) {
          isResizing = true;
          eventEl.classList.add("resizing");
        } else if (e.target === eventEl) {
          isDragging = true;
        }
        startX = e.clientX;
        originalLeft = eventEl.offsetLeft;
        originalWidth = eventEl.offsetWidth;
      });

      document.addEventListener("mousemove", (e) => {
        if (!isDragging && !isResizing) return;
        const deltaX = e.clientX - startX;

        if (isDragging) {
          let newLeft = originalLeft + deltaX;
          newLeft = Math.max(0, newLeft);
          newLeft = Math.min(newLeft, totalHours * hourWidth - eventEl.offsetWidth);
          eventEl.style.left = `${newLeft}px`;

          const currentStartDecimal = calendarStartHour + newLeft / hourWidth;
          const currentEndDecimal = currentStartDecimal + (eventEl.offsetWidth / hourWidth);
          showTooltip(e.clientX, `${formatHour(currentStartDecimal)} - ${formatHour(currentEndDecimal)}`);
        }

        if (isResizing) {
          let newWidth = originalWidth + deltaX;
          newWidth = Math.max(hourWidth / 2, newWidth);
          newWidth = Math.min(newWidth, totalHours * hourWidth - eventEl.offsetLeft);
          eventEl.style.width = `${newWidth}px`;

          const currentStartDecimal = calendarStartHour + eventEl.offsetLeft / hourWidth;
          const currentEndDecimal = currentStartDecimal + newWidth / hourWidth;
          showTooltip(e.clientX, `${formatHour(currentStartDecimal)} - ${formatHour(currentEndDecimal)}`);
        }
      });

      document.addEventListener("mouseup", () => {
        if (isDragging || isResizing) {
          const newStartDecimal = calendarStartHour + eventEl.offsetLeft / hourWidth;
          const newEndDecimal = newStartDecimal + (eventEl.offsetWidth / hourWidth);

          const userToUpdate = users.find(u => u.name === user.name);
          if (userToUpdate) {
            const eventToUpdate = userToUpdate.events.find(e => e.id === event.id && e.date === event.date);
            if (eventToUpdate) {
              eventToUpdate.start = formatHour(newStartDecimal);
              eventToUpdate.end = formatHour(newEndDecimal);
              eventToUpdate.duration = newEndDecimal - newStartDecimal;
            }
          }

          tooltip.style.display = 'none';
        }
        isDragging = false;
        isResizing = false;
        eventEl.classList.remove("resizing");
      });

      row.appendChild(eventEl);
    });

    userRows.appendChild(row);
  });

  // Adjust widths according to visible hours
  hoursRow.style.minWidth = `${totalHours * hourWidth}px`;
  userRows.style.minWidth = `${totalHours * hourWidth}px`;

  // Always update the current time line after rendering the calendar
  updateCurrentTimeLine();
}

// Adjust padding-top to userColumn so it doesn't overlap with the sticky hours row
function updateLayout() {
  const hoursRowHeight = hoursRow.offsetHeight || 50;
  userColumn.style.paddingTop = `${hoursRowHeight}px`;
  // Update time line height to match calendar-content
  if (currentTimeLine) {
    currentTimeLine.style.height = `calc(100% - ${hoursRowHeight}px)`;
    currentTimeLine.style.top = `${hoursRowHeight}px`;
  }
}

// Initial setup
renderHoursRow();
generateUserCheckboxes();

// Initialize the custom simple datepicker
setupSimpleDatepicker(datepickerContainer, selectedDate, (newDate) => {
  selectedDate = newDate;
  updateSelectedDateDisplay();
  renderCalendar(); // Re-render calendar when date changes
});

// Initial render and layout update
renderCalendar();
updateLayout();

// Adjust layout on window resize
window.addEventListener('resize', updateLayout);

// Set up interval to update the current time line every minute
clearInterval(currentTimeUpdateInterval); // Clear any existing interval
currentTimeUpdateInterval = setInterval(updateCurrentTimeLine, 60 * 1000); // Update every minute

// Configure save button
document.getElementById("saveBtn").addEventListener("click", () => {
  console.log("Eventos actualizados:");
  console.log(JSON.stringify(users, null, 2));

  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.background = '#4CAF50';
  notification.style.color = 'white';
  notification.style.padding = '10px 20px';
  notification.style.borderRadius = '4px';
  notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  notification.textContent = '✓ Cambios guardados correctamente';
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    setTimeout(() => document.body.removeChild(notification), 500);
  }, 3000);
});