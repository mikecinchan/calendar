// Calendar Application Main Script

class CalendarApp {
    constructor() {
        this.currentDate = new Date();
        this.events = [];
        this.filteredEvents = [];
        this.editingEventId = null;
        this.firebase = null;
        this.viewMode = 'single'; // 'single' or 'multi'
        this.selectedDate = null;
        this.init();
    }

    init() {
        // Wait for Firebase service to be available
        this.initializeFirebaseConnection();
        this.setupEventListeners();
        this.loadCalendarState();
        this.renderCalendar();
        this.updateMonthDisplay();
        this.loadEvents();
        this.setupDebugTools();
    }

    async initializeFirebaseConnection() {
        // Wait for Firebase service to be available
        let attempts = 0;
        while (!window.firebaseService && attempts < 20) {
            console.log('Waiting for Firebase service... attempt', attempts + 1);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.firebaseService) {
            this.firebase = window.firebaseService;
            console.log('Firebase service connected to calendar app');
        } else {
            console.error('Firebase service not available after waiting');
        }
    }

    setupDebugTools() {
        // Add debug button for testing
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
            const debugBtn = document.createElement('button');
            debugBtn.textContent = 'Debug Firebase';
            debugBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: #f44336;
                color: white;
                border: none;
                padding: 10px;
                border-radius: 4px;
                cursor: pointer;
                z-index: 1000;
                font-size: 12px;
            `;
            debugBtn.onclick = () => this.debugFirebase();
            document.body.appendChild(debugBtn);
        }
    }

    async debugFirebase() {
        console.log('=== FIREBASE DEBUG ===');
        console.log('Firebase service:', this.firebase);
        console.log('Firebase initialized:', this.firebase?.isInitialized());
        console.log('Local events count:', this.events.length);
        console.log('Local events:', this.events);
        
        if (this.firebase?.isInitialized()) {
            try {
                const firebaseEvents = await this.firebase.loadEvents();
                console.log('Firebase events count:', firebaseEvents.length);
                console.log('Firebase events:', firebaseEvents);
            } catch (error) {
                console.error('Firebase load error:', error);
            }
        }
        
        const localStorageData = localStorage.getItem('calendarEvents');
        console.log('LocalStorage data:', localStorageData ? JSON.parse(localStorageData) : null);
        console.log('=== END DEBUG ===');
    }

    setupEventListeners() {
        // Navigation controls
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.refreshCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.refreshCalendar();
        });

        document.getElementById('todayBtn').addEventListener('click', () => {
            this.goToToday();
        });

        // View controls
        document.getElementById('singleViewBtn').addEventListener('click', () => {
            this.switchView('single');
        });

        document.getElementById('multiViewBtn').addEventListener('click', () => {
            this.switchView('multi');
        });

        // Month/Year picker
        document.getElementById('monthYearPicker').addEventListener('click', () => {
            this.showMonthYearPicker();
        });

        document.getElementById('applyDateBtn').addEventListener('click', () => {
            this.applyDateSelection();
        });

        document.getElementById('cancelDateBtn').addEventListener('click', () => {
            this.hideMonthYearPicker();
        });

        // Event form controls
        document.getElementById('eventForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEventSubmit();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.cancelEdit();
        });

        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filterEvents(e.target.value);
        });

        // Modal close on background click
        document.getElementById('monthYearModal').addEventListener('click', (e) => {
            if (e.target.id === 'monthYearModal') {
                this.hideMonthYearPicker();
            }
        });
    }

    renderCalendar() {
        if (this.viewMode === 'single') {
            this.renderSingleCalendar();
        } else {
            this.renderMultiCalendar();
        }
    }

    renderSingleCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        this.renderMonthGrid(calendarGrid, year, month);
    }

    renderMultiCalendar() {
        const container = document.getElementById('multiCalendarContainer');
        container.innerHTML = '';

        // Render previous month, current month, and next month
        for (let offset = -1; offset <= 1; offset++) {
            const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + offset, 1);
            const miniCalendar = this.createMiniCalendar(date.getFullYear(), date.getMonth());
            container.appendChild(miniCalendar);
        }
    }

    renderMonthGrid(container, year, month, isMini = false) {
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
            const dayElement = this.createDayElement('', true, false, isMini);
            container.appendChild(dayElement);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = isCurrentMonth && day === todayDate;
            const isSelected = this.selectedDate && 
                this.selectedDate.getFullYear() === year && 
                this.selectedDate.getMonth() === month && 
                this.selectedDate.getDate() === day;
            
            const dayElement = this.createDayElement(day, false, isToday, isMini, isSelected);
            
            // Add click handler for date selection
            dayElement.addEventListener('click', () => {
                this.selectDate(new Date(year, month, day));
            });
            
            // Add events for this day
            const dayEvents = this.getEventsForDate(year, month, day);
            this.renderEventsInDay(dayElement, dayEvents);
            
            container.appendChild(dayElement);
        }

        // Fill remaining cells to complete the grid
        const totalCells = container.children.length;
        const remainingCells = 42 - totalCells; // 6 rows × 7 days = 42 cells
        for (let i = 0; i < remainingCells; i++) {
            const dayElement = this.createDayElement('', true, false, isMini);
            container.appendChild(dayElement);
        }
    }

    createMiniCalendar(year, month) {
        const miniCalendar = document.createElement('div');
        miniCalendar.className = 'mini-calendar';

        // Month title
        const monthTitle = document.createElement('div');
        monthTitle.className = 'month-title';
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        monthTitle.textContent = `${monthNames[month]} ${year}`;
        miniCalendar.appendChild(monthTitle);

        // Day headers
        const header = document.createElement('div');
        header.className = 'calendar-header';
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            const dayName = document.createElement('div');
            dayName.className = 'day-name';
            dayName.textContent = day;
            header.appendChild(dayName);
        });
        miniCalendar.appendChild(header);

        // Calendar grid
        const grid = document.createElement('div');
        grid.className = 'calendar-grid';
        this.renderMonthGrid(grid, year, month, true);
        miniCalendar.appendChild(grid);

        return miniCalendar;
    }

    createDayElement(dayNumber, isOtherMonth = false, isToday = false, isMini = false, isSelected = false) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        
        if (isToday) {
            dayElement.classList.add('today');
        }

        if (isSelected) {
            dayElement.classList.add('selected');
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

    // New methods for enhanced functionality
    switchView(viewMode) {
        this.viewMode = viewMode;
        
        // Update button states
        document.getElementById('singleViewBtn').classList.toggle('active', viewMode === 'single');
        document.getElementById('multiViewBtn').classList.toggle('active', viewMode === 'multi');
        
        // Update calendar view visibility
        document.getElementById('singleCalendarView').classList.toggle('active', viewMode === 'single');
        document.getElementById('multiCalendarView').classList.toggle('active', viewMode === 'multi');
        
        // Re-render calendar in new view mode
        this.renderCalendar();
    }

    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.refreshCalendar();
    }

    selectDate(date) {
        this.selectedDate = date;
        
        // Auto-fill event form with selected date (fix timezone issue)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        document.getElementById('eventDate').value = dateString;
        
        // Re-render to show selection
        this.renderCalendar();
    }

    showMonthYearPicker() {
        const modal = document.getElementById('monthYearModal');
        const monthSelect = document.getElementById('monthSelect');
        const yearInput = document.getElementById('yearInput');
        
        // Set current values
        monthSelect.value = this.currentDate.getMonth();
        yearInput.value = this.currentDate.getFullYear();
        
        modal.classList.add('show');
    }

    hideMonthYearPicker() {
        const modal = document.getElementById('monthYearModal');
        modal.classList.remove('show');
    }

    applyDateSelection() {
        const monthSelect = document.getElementById('monthSelect');
        const yearInput = document.getElementById('yearInput');
        
        const newMonth = parseInt(monthSelect.value);
        const newYear = parseInt(yearInput.value);
        
        this.currentDate = new Date(newYear, newMonth, 1);
        this.renderCalendar();
        this.updateMonthDisplay();
        this.hideMonthYearPicker();
    }

    renderEventsInDay(dayElement, events) {
        const eventsContainer = dayElement.querySelector('.events-container');
        if (!eventsContainer) return;

        // Limit events displayed and show count if more
        const maxEvents = dayElement.classList.contains('mini-calendar') ? 2 : 3;
        const eventsToShow = events.slice(0, maxEvents);
        const remainingCount = events.length - maxEvents;

        eventsToShow.forEach(event => {
            const eventElement = document.createElement('div');
            let className = `event-item event-${event.category}`;
            
            // Add visual indicators
            if (event.time) {
                className += ' has-time';
            }
            if (event.isRecurring) {
                className += ' recurring';
            }
            
            eventElement.className = className;
            eventElement.textContent = event.title;
            
            // Enhanced tooltip
            let tooltipText = event.title;
            if (event.time) {
                tooltipText += `\n🕐 ${event.time}`;
            }
            if (event.description) {
                tooltipText += `\n📝 ${event.description}`;
            }
            if (event.isRecurring) {
                tooltipText += `\n🔁 Recurring annually`;
            }
            eventElement.title = tooltipText;
            
            // Add click handlers for edit and delete
            eventElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showEventActions(event, eventElement);
            });
            
            eventsContainer.appendChild(eventElement);
        });

        // Show "more events" indicator if needed
        if (remainingCount > 0) {
            const moreElement = document.createElement('div');
            moreElement.className = 'more-events';
            moreElement.textContent = `+${remainingCount} more`;
            moreElement.title = `${remainingCount} additional event${remainingCount > 1 ? 's' : ''}`;
            eventsContainer.appendChild(moreElement);
        }
    }

    updateMonthDisplay() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const monthDisplay = document.getElementById('currentMonth');
        monthDisplay.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    }

    async handleEventSubmit() {
        if (!this.validateForm()) {
            return;
        }

        const title = document.getElementById('eventTitle').value.trim();
        const date = document.getElementById('eventDate').value;
        const category = document.getElementById('eventCategory').value;
        const time = document.getElementById('eventTime').value;
        const description = document.getElementById('eventDescription').value.trim();
        const isRecurring = document.getElementById('isRecurring').checked;
        const editingId = document.getElementById('editingEventId').value;

        const eventData = {
            title,
            date,
            category,
            time: time || null,
            description: description || null,
            isRecurring,
            recurrenceType: isRecurring ? 'annual' : null,
            updatedAt: new Date().toISOString()
        };

        try {
            if (editingId) {
                // Update existing event
                await this.updateEvent(editingId, eventData);
            } else {
                // Create new event
                eventData.id = this.generateId();
                eventData.createdAt = new Date().toISOString();
                await this.createEvent(eventData);
            }
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Error saving event. Please try again.');
        }
    }

    async createEvent(eventData) {
        // Always add to local events first for immediate UI feedback
        this.events.push(eventData);
        this.saveEventsToLocalStorage();
        this.renderCalendar();
        this.clearForm();
        this.showSuccessMessage('Event created successfully!');

        // Then try to sync with Firebase in background
        if (this.firebase && this.firebase.isInitialized()) {
            try {
                console.log('Attempting to save event to Firebase:', eventData);
                const firebaseId = await this.firebase.saveEvent(eventData);
                if (firebaseId) {
                    console.log('Event saved to Firebase with ID:', firebaseId);
                    // Update the event in our local array with the Firebase ID
                    const eventIndex = this.events.findIndex(e => e.id === eventData.id);
                    if (eventIndex >= 0) {
                        this.events[eventIndex].firebaseId = firebaseId;
                        this.saveEventsToLocalStorage();
                    }
                }
            } catch (error) {
                console.error('Failed to save to Firebase:', error);
                // Show error message to user
                this.showErrorMessage('Event saved locally but failed to sync with cloud storage');
            }
        } else {
            console.warn('Firebase not initialized, event saved locally only');
        }
    }

    async updateEvent(eventId, eventData) {
        const eventIndex = this.events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) return;

        const existingEvent = this.events[eventIndex];
        const updatedEvent = { ...existingEvent, ...eventData };

        // Update in Firebase if available
        if (this.firebase && this.firebase.isInitialized() && existingEvent.firebaseId) {
            try {
                await this.firebase.updateEvent(existingEvent.firebaseId, eventData);
            } catch (error) {
                console.warn('Failed to update in Firebase:', error);
            }
        }

        this.events[eventIndex] = updatedEvent;
        this.saveEventsToLocalStorage();
        this.renderCalendar();
        this.clearForm();
        this.showSuccessMessage('Event updated successfully!');
    }

    async deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) {
            return;
        }

        const eventIndex = this.events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) return;

        const event = this.events[eventIndex];

        // Delete from Firebase if available
        if (this.firebase && this.firebase.isInitialized() && event.firebaseId) {
            try {
                await this.firebase.deleteEvent(event.firebaseId);
            } catch (error) {
                console.warn('Failed to delete from Firebase:', error);
            }
        }

        this.events.splice(eventIndex, 1);
        this.saveEventsToLocalStorage();
        this.renderCalendar();
        this.showSuccessMessage('Event deleted successfully!');
    }

    validateForm() {
        this.clearErrors();
        let isValid = true;

        const title = document.getElementById('eventTitle').value.trim();
        const date = document.getElementById('eventDate').value;
        const category = document.getElementById('eventCategory').value;

        if (!title) {
            this.showFieldError('titleError', 'Title is required');
            document.getElementById('eventTitle').classList.add('error');
            isValid = false;
        }

        if (!date) {
            this.showFieldError('dateError', 'Date is required');
            document.getElementById('eventDate').classList.add('error');
            isValid = false;
        }

        if (!category) {
            this.showFieldError('categoryError', 'Category is required');
            document.getElementById('eventCategory').classList.add('error');
            isValid = false;
        }

        return isValid;
    }

    clearErrors() {
        document.querySelectorAll('.form-error').forEach(error => {
            error.classList.remove('show');
        });
        document.querySelectorAll('.error').forEach(field => {
            field.classList.remove('error');
        });
    }

    showFieldError(errorId, message) {
        const errorElement = document.getElementById(errorId);
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type = 'success') {
        // Remove any existing messages
        document.querySelectorAll('.temp-message').forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = `temp-message ${type}-message`;
        messageDiv.textContent = message;
        
        const backgroundColor = type === 'success' ? '#4caf50' : '#f44336';
        
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${backgroundColor};
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(messageDiv);
        setTimeout(() => {
            if (messageDiv.parentNode) {
                document.body.removeChild(messageDiv);
            }
        }, 5000); // Show error messages longer
    }

    clearForm() {
        document.getElementById('eventForm').reset();
        document.getElementById('editingEventId').value = '';
        document.getElementById('formTitle').textContent = 'Add Event';
        document.getElementById('submitBtn').textContent = 'Add Event';
        document.getElementById('cancelBtn').style.display = 'none';
        this.editingEventId = null;
        this.clearErrors();
    }

    editEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        // Populate form with event data
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventCategory').value = event.category;
        document.getElementById('eventTime').value = event.time || '';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('isRecurring').checked = event.isRecurring || false;
        document.getElementById('editingEventId').value = eventId;

        // Update form UI
        document.getElementById('formTitle').textContent = 'Edit Event';
        document.getElementById('submitBtn').textContent = 'Update Event';
        document.getElementById('cancelBtn').style.display = 'block';
        
        this.editingEventId = eventId;
    }

    cancelEdit() {
        this.clearForm();
    }

    showEventActions(event, eventElement) {
        // Remove any existing action menus
        document.querySelectorAll('.event-actions').forEach(menu => {
            menu.remove();
        });

        // Create action menu
        const actionsMenu = document.createElement('div');
        actionsMenu.className = 'event-actions';
        actionsMenu.innerHTML = `
            <button onclick="calendar.editEvent('${event.id}')">Edit</button>
            <button onclick="calendar.deleteEvent('${event.id}')">Delete</button>
        `;
        
        actionsMenu.style.cssText = `
            position: absolute;
            background: #283593;
            border: 1px solid #5c6bc0;
            border-radius: 4px;
            padding: 5px;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            gap: 5px;
        `;

        // Style the buttons
        actionsMenu.querySelectorAll('button').forEach(btn => {
            btn.style.cssText = `
                padding: 8px 12px;
                border: none;
                border-radius: 3px;
                color: white;
                cursor: pointer;
                font-size: 14px;
                touch-action: manipulation;
            `;
        });

        actionsMenu.querySelector('button:first-child').style.backgroundColor = '#7986cb';
        actionsMenu.querySelector('button:last-child').style.backgroundColor = '#f44336';

        // Enhanced positioning for mobile/tablet
        this.positionEventMenu(actionsMenu, eventElement);

        document.body.appendChild(actionsMenu);

        // Remove menu when clicking elsewhere
        const removeMenu = (e) => {
            if (!actionsMenu.contains(e.target)) {
                actionsMenu.remove();
                document.removeEventListener('click', removeMenu);
                document.removeEventListener('touchstart', removeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', removeMenu);
            document.addEventListener('touchstart', removeMenu);
        }, 100);
    }

    positionEventMenu(menu, eventElement) {
        // Get viewport dimensions
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        // Get element position relative to viewport
        const rect = eventElement.getBoundingClientRect();
        
        // Get scroll positions
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Calculate absolute position
        let left = rect.left + scrollLeft;
        let top = rect.bottom + scrollTop + 5;

        // Adjust for mobile viewport scaling
        const scale = window.devicePixelRatio || 1;
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // For mobile, use a simplified approach
            // Position relative to the calendar container instead of viewport
            const calendarContainer = eventElement.closest('.calendar-container');
            const containerRect = calendarContainer.getBoundingClientRect();
            const eventRect = eventElement.getBoundingClientRect();
            
            // Position relative to container
            left = (eventRect.left - containerRect.left) + scrollLeft;
            top = (eventRect.bottom - containerRect.top) + scrollTop + 5;
            
            // Ensure menu stays within container bounds
            const menuWidth = 120; // Approximate menu width
            const containerWidth = containerRect.width;
            
            if (left + menuWidth > containerWidth) {
                left = containerWidth - menuWidth - 10;
            }
            
            if (left < 10) {
                left = 10;
            }
        }

        // Ensure menu doesn't go off-screen horizontally
        const menuWidth = 120; // Approximate menu width
        if (left + menuWidth > viewport.width) {
            left = viewport.width - menuWidth - 10;
        }
        
        if (left < 10) {
            left = 10;
        }

        // Ensure menu doesn't go off-screen vertically
        const menuHeight = 50; // Approximate menu height
        if (top + menuHeight > viewport.height + scrollTop) {
            // Position above the event instead
            top = rect.top + scrollTop - menuHeight - 5;
        }

        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
    }

    generateId() {
        return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getEventsForDate(year, month, day) {
        const targetDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Apply current filter if active
        let eventsToShow = this.events;
        const categoryFilter = document.getElementById('categoryFilter').value;
        if (categoryFilter) {
            eventsToShow = this.events.filter(event => event.category === categoryFilter);
        }
        
        return eventsToShow.filter(event => event.date === targetDate);
    }

    // Enhanced state management
    saveCalendarState() {
        const state = {
            currentDate: this.currentDate.toISOString(),
            viewMode: this.viewMode,
            selectedDate: this.selectedDate?.toISOString() || null,
            categoryFilter: document.getElementById('categoryFilter').value
        };
        localStorage.setItem('calendarState', JSON.stringify(state));
    }

    loadCalendarState() {
        const savedState = localStorage.getItem('calendarState');
        if (savedState) {
            const state = JSON.parse(savedState);
            
            // Restore current date
            if (state.currentDate) {
                this.currentDate = new Date(state.currentDate);
            }
            
            // Restore view mode
            if (state.viewMode) {
                this.switchView(state.viewMode);
            }
            
            // Restore selected date
            if (state.selectedDate) {
                this.selectedDate = new Date(state.selectedDate);
            }
            
            // Restore category filter
            if (state.categoryFilter) {
                document.getElementById('categoryFilter').value = state.categoryFilter;
            }
        }
    }

    // Enhanced calendar refresh with state preservation
    refreshCalendar() {
        this.renderCalendar();
        this.updateMonthDisplay();
        this.saveCalendarState();
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

    async loadEvents() {
        // First load from local storage
        this.loadEventsFromLocalStorage();
        
        // Wait for Firebase to initialize, then sync
        if (this.firebase) {
            // Wait for Firebase initialization if needed
            let attempts = 0;
            while (!this.firebase.isInitialized() && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (this.firebase.isInitialized()) {
                try {
                    const firebaseEvents = await this.firebase.loadEvents();
                    console.log('Firebase events loaded:', firebaseEvents.length);
                    
                    if (firebaseEvents.length >= 0) { // Changed condition to include empty arrays
                        // Merge with local events (Firebase takes precedence)
                        this.events = this.mergeEvents(this.events, firebaseEvents);
                        this.saveEventsToLocalStorage();
                        this.renderCalendar();
                    }
                } catch (error) {
                    console.warn('Failed to load from Firebase:', error);
                }
            } else {
                console.warn('Firebase failed to initialize after waiting');
            }
        }
        
        // Always render calendar with local events at minimum
        this.renderCalendar();
    }

    loadEventsFromLocalStorage() {
        const savedEvents = localStorage.getItem('calendarEvents');
        if (savedEvents) {
            this.events = JSON.parse(savedEvents);
        }
    }

    mergeEvents(localEvents, firebaseEvents) {
        console.log('Merging events - Local:', localEvents.length, 'Firebase:', firebaseEvents.length);
        
        // If no Firebase events, return local events
        if (!firebaseEvents || firebaseEvents.length === 0) {
            console.log('No Firebase events, keeping local events');
            return localEvents;
        }
        
        // If no local events, return Firebase events
        if (!localEvents || localEvents.length === 0) {
            console.log('No local events, using Firebase events');
            return firebaseEvents;
        }
        
        // Merge strategy: Combine both, Firebase takes precedence for duplicates
        const merged = [];
        const processedIds = new Set();
        
        // Add all Firebase events first (they take precedence)
        firebaseEvents.forEach(fbEvent => {
            merged.push(fbEvent);
            processedIds.add(fbEvent.id);
            if (fbEvent.firebaseId) {
                processedIds.add(fbEvent.firebaseId);
            }
        });
        
        // Add local events that don't exist in Firebase
        localEvents.forEach(localEvent => {
            if (!processedIds.has(localEvent.id) && 
                (!localEvent.firebaseId || !processedIds.has(localEvent.firebaseId))) {
                merged.push(localEvent);
            }
        });

        console.log('Merged result:', merged.length, 'events');
        return merged;
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
let calendar;
document.addEventListener('DOMContentLoaded', () => {
    calendar = new CalendarApp();
    // Make calendar globally available for event actions
    window.calendar = calendar;
});