// Calendar Application Main Script

class CalendarApp {
    constructor() {
        this.currentDate = new Date();
        this.events = [];
        this.filteredEvents = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderCalendar();
        this.updateMonthDisplay();
    }

    setupEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
            this.updateMonthDisplay();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
            this.updateMonthDisplay();
        });

        document.getElementById('eventForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addEvent();
        });

        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filterEvents(e.target.value);
        });
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Get first day of the month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Get today's date for highlighting
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
        const todayDate = today.getDate();

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const dayElement = this.createDayElement('', true);
            calendarGrid.appendChild(dayElement);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = isCurrentMonth && day === todayDate;
            const dayElement = this.createDayElement(day, false, isToday);
            
            // Add events for this day
            const dayEvents = this.getEventsForDate(year, month, day);
            this.renderEventsInDay(dayElement, dayEvents);
            
            calendarGrid.appendChild(dayElement);
        }

        // Fill remaining cells to complete the grid
        const totalCells = calendarGrid.children.length;
        const remainingCells = 42 - totalCells; // 6 rows × 7 days = 42 cells
        for (let i = 0; i < remainingCells; i++) {
            const dayElement = this.createDayElement('', true);
            calendarGrid.appendChild(dayElement);
        }
    }

    createDayElement(dayNumber, isOtherMonth = false, isToday = false) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        
        if (isToday) {
            dayElement.classList.add('today');
        }

        if (dayNumber) {
            const dayNumberElement = document.createElement('div');
            dayNumberElement.className = 'day-number';
            dayNumberElement.textContent = dayNumber;
            dayElement.appendChild(dayNumberElement);

            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'events-container';
            dayElement.appendChild(eventsContainer);
        }

        return dayElement;
    }

    renderEventsInDay(dayElement, events) {
        const eventsContainer = dayElement.querySelector('.events-container');
        if (!eventsContainer) return;

        events.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = `event-item event-${event.category}`;
            eventElement.textContent = event.title;
            eventElement.title = `${event.title}${event.time ? ` at ${event.time}` : ''}${event.description ? `\n${event.description}` : ''}`;
            eventsContainer.appendChild(eventElement);
        });
    }

    updateMonthDisplay() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const monthDisplay = document.getElementById('currentMonth');
        monthDisplay.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    }

    addEvent() {
        const title = document.getElementById('eventTitle').value;
        const date = document.getElementById('eventDate').value;
        const category = document.getElementById('eventCategory').value;
        const time = document.getElementById('eventTime').value;
        const description = document.getElementById('eventDescription').value;

        if (!title || !date || !category) {
            alert('Please fill in all required fields');
            return;
        }

        const event = {
            id: this.generateId(),
            title,
            date,
            category,
            time: time || null,
            description: description || null,
            isRecurring: false,
            recurrenceType: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.events.push(event);
        this.saveEventsToLocalStorage();
        this.renderCalendar();
        this.clearForm();
    }

    clearForm() {
        document.getElementById('eventForm').reset();
    }

    generateId() {
        return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getEventsForDate(year, month, day) {
        const targetDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return this.events.filter(event => event.date === targetDate);
    }

    filterEvents(category) {
        if (!category) {
            this.filteredEvents = [...this.events];
        } else {
            this.filteredEvents = this.events.filter(event => event.category === category);
        }
        this.renderCalendar();
    }

    saveEventsToLocalStorage() {
        localStorage.setItem('calendarEvents', JSON.stringify(this.events));
    }

    loadEventsFromLocalStorage() {
        const savedEvents = localStorage.getItem('calendarEvents');
        if (savedEvents) {
            this.events = JSON.parse(savedEvents);
        }
    }

    // Firebase integration methods (to be implemented)
    initFirebase() {
        // Firebase configuration will be added here
        console.log('Firebase initialization placeholder');
    }

    saveToFirebase(event) {
        // Firebase save functionality will be added here
        console.log('Firebase save placeholder', event);
    }

    loadFromFirebase() {
        // Firebase load functionality will be added here
        console.log('Firebase load placeholder');
    }
}

// Data structure for events (reference)
const EventStructure = {
    id: 'unique-id',
    title: 'Event Title',
    date: 'YYYY-MM-DD',
    time: 'HH:MM', // optional
    category: 'birthday|special|holiday|personal|event',
    description: 'Optional description',
    isRecurring: false,
    recurrenceType: 'annual', // optional
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
};

// Initialize the calendar application
document.addEventListener('DOMContentLoaded', () => {
    const calendar = new CalendarApp();
    calendar.loadEventsFromLocalStorage();
});