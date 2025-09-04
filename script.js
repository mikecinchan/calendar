// Calendar Application Main Script

class CalendarApp {
    constructor() {
        this.currentDate = new Date();
        this.events = [];
        this.filteredEvents = [];
        this.editingEventId = null;
        this.activeFilters = {
            category: '',
            dateRange: { start: null, end: null, preset: '' },
            search: ''
        };
        this.firebase = null;
        this.eventCache = new Map();
        this.lastCacheUpdate = null;
        this.viewMode = 'single'; // 'single' or 'multi'
        this.selectedDate = null;
        this.currentUser = null;
        this.authInitialized = false;
        this.init();
    }

    init() {
        // Initialize authentication first
        this.initializeAuthentication().then(() => {
            // Wait for Firebase service to be available
            this.initializeFirebaseConnection();
            this.setupEventListeners();
            this.loadCalendarState();
            this.renderCalendar();
            this.updateMonthDisplay();
            this.loadEvents();
            this.setupDebugTools();
            
            // Initialize data management features
            setTimeout(() => {
                this.initializeSyncStatus();
            }, 1000); // Wait for Firebase to initialize
        });
    }

    async initializeAuthentication() {
        try {
            // Wait for Firebase to be available
            let attempts = 0;
            while (typeof firebase === 'undefined' && attempts < 20) {
                console.log('Waiting for Firebase SDK... attempt', attempts + 1);
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (typeof firebase !== 'undefined') {
                // Set up auth state listener
                firebase.auth().onAuthStateChanged(user => {
                    this.currentUser = user;
                    if (user) {
                        console.log('User authenticated:', user.email);
                        this.showUserInfo(user);
                        this.authInitialized = true;
                    } else {
                        console.log('User not authenticated');
                        this.redirectToLogin();
                    }
                });
            } else {
                console.error('Firebase SDK not available');
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('Authentication initialization failed:', error);
            this.redirectToLogin();
        }
    }

    showUserInfo(user) {
        const userInfo = document.getElementById('userInfo');
        const userEmail = document.getElementById('userEmail');
        if (userInfo && userEmail) {
            userEmail.textContent = user.email;
            userInfo.style.display = 'block';
        }
    }

    redirectToLogin() {
        window.location.href = 'login.html';
    }

    async logout() {
        try {
            await firebase.auth().signOut();
            console.log('User logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
        }
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

        // Recurrence type toggle
        document.getElementById('isRecurring').addEventListener('change', (e) => {
            this.toggleRecurrenceOptions(e.target.checked);
        });

        // Enhanced filter controls
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.updateCategoryFilter(e.target.value);
        });

        document.getElementById('clearCategoryFilter').addEventListener('click', () => {
            this.clearCategoryFilter();
        });

        document.getElementById('dateRangePreset').addEventListener('change', (e) => {
            this.updateDateRangePreset(e.target.value);
        });

        document.getElementById('dateRangeStart').addEventListener('change', (e) => {
            this.updateCustomDateRange();
        });

        document.getElementById('dateRangeEnd').addEventListener('change', (e) => {
            this.updateCustomDateRange();
        });

        document.getElementById('clearDateRangeFilter').addEventListener('click', () => {
            this.clearDateRangeFilter();
        });

        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.updateSearchFilter(e.target.value);
        });

        document.getElementById('clearSearch').addEventListener('click', () => {
            this.clearSearchFilter();
        });

        document.getElementById('clearAllFilters').addEventListener('click', () => {
            this.clearAllFilters();
        });

        // Data management controls
        document.getElementById('exportEventsBtn').addEventListener('click', () => {
            this.exportEvents();
        });

        document.getElementById('importEventsBtn').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });

        document.getElementById('importFileInput').addEventListener('change', (e) => {
            this.importEvents(e.target.files[0]);
        });

        document.getElementById('createBackupBtn').addEventListener('click', () => {
            this.createBackup();
        });

        document.getElementById('restoreBackupBtn').addEventListener('click', () => {
            this.restoreBackup();
        });

        document.getElementById('forceSyncBtn').addEventListener('click', () => {
            this.forceSync();
        });

        // Authentication controls
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
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
            
            // Add events for this day (using cache)
            const dayEvents = this.getCachedEventsForDate(year, month, day);
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
                const recurrenceText = event.recurrenceType === 'monthly' ? 'monthly' : 'annually';
                tooltipText += `\n🔁 Recurring ${recurrenceText}`;
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
        const recurrenceType = document.getElementById('recurrenceType').value;
        const editingId = document.getElementById('editingEventId').value;

        const eventData = {
            title,
            date,
            category,
            time: time || null,
            description: description || null,
            isRecurring,
            recurrenceType: isRecurring ? recurrenceType : null,
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
        // Handle recurring events - generate multiple instances
        const eventsToAdd = [];
        if (eventData.isRecurring && (eventData.recurrenceType === 'annual' || eventData.recurrenceType === 'monthly')) {
            eventsToAdd.push(...this.generateRecurringEvents(eventData));
        } else {
            eventsToAdd.push(eventData);
        }

        // Add all events to local storage
        this.events.push(...eventsToAdd);
        this.saveEventsToLocalStorage();
        this.invalidateCache();
        this.updateCache();
        this.renderCalendar();
        this.clearForm();
        this.showSuccessMessage(`Event${eventsToAdd.length > 1 ? 's' : ''} created successfully!`);

        // Then try to sync with Firebase in background
        if (this.firebase && this.firebase.isInitialized()) {
            try {
                for (const event of eventsToAdd) {
                    console.log('Attempting to save event to Firebase:', event);
                    // Clean event data for Firebase
                    const cleanEventData = this.cleanEventForFirebase(event);
                    const firebaseId = await this.firebase.saveEvent(cleanEventData);
                    if (firebaseId) {
                        console.log('Event saved to Firebase with ID:', firebaseId);
                        // Update the event in our local array with the Firebase ID
                        const eventIndex = this.events.findIndex(e => e.id === event.id);
                        if (eventIndex >= 0) {
                            this.events[eventIndex].firebaseId = firebaseId;
                        }
                    }
                }
                this.saveEventsToLocalStorage();
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
                // Clean event data for Firebase
                const cleanEventData = this.cleanEventForFirebase(eventData);
                await this.firebase.updateEvent(existingEvent.firebaseId, cleanEventData);
            } catch (error) {
                console.warn('Failed to update in Firebase:', error);
            }
        }

        this.events[eventIndex] = updatedEvent;
        this.saveEventsToLocalStorage();
        this.invalidateCache();
        this.updateCache();
        this.renderCalendar();
        this.clearForm();
        this.showSuccessMessage('Event updated successfully!');
    }

    async deleteEvent(eventId) {
        const eventIndex = this.events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) return;

        const event = this.events[eventIndex];

        // Check if this is a recurring event
        const isRecurringEvent = event.isRecurring || event.parentEventId;
        let eventsToDelete = [event];
        
        if (isRecurringEvent) {
            // Find all related recurring events
            const baseTitle = event.title.replace(/ \(\d{4}\)$/, ''); // Remove year suffix if present
            const relatedEvents = this.events.filter(e => {
                // Match by base title and same category, or same parentEventId
                const eventBaseTitle = e.title.replace(/ \(\d{4}\)$/, '');
                return (eventBaseTitle === baseTitle && e.category === event.category && e.isRecurring) ||
                       (event.parentEventId && e.parentEventId === event.parentEventId) ||
                       (e.id === event.parentEventId) ||
                       (event.id === e.parentEventId);
            });
            
            eventsToDelete = relatedEvents.length > 0 ? relatedEvents : [event];
            
            // Confirm deletion of multiple events
            const eventCount = eventsToDelete.length;
            if (eventCount > 1) {
                if (!confirm(`This will delete all ${eventCount} instances of "${baseTitle}". Are you sure?`)) {
                    return;
                }
            } else if (!confirm('Are you sure you want to delete this event?')) {
                return;
            }
        } else {
            if (!confirm('Are you sure you want to delete this event?')) {
                return;
            }
        }

        // Delete from Firebase if available
        for (const eventToDelete of eventsToDelete) {
            if (this.firebase && this.firebase.isInitialized() && eventToDelete.firebaseId) {
                try {
                    await this.firebase.deleteEvent(eventToDelete.firebaseId);
                } catch (error) {
                    console.warn('Failed to delete from Firebase:', error);
                }
            }
        }

        // Remove events from local array
        this.events = this.events.filter(e => !eventsToDelete.some(del => del.id === e.id));

        this.saveEventsToLocalStorage();
        this.invalidateCache();
        this.updateCache();
        this.renderCalendar();
        
        const deletedCount = eventsToDelete.length;
        if (deletedCount > 1) {
            this.showSuccessMessage(`All ${deletedCount} recurring events deleted successfully!`);
        } else {
            this.showSuccessMessage('Event deleted successfully!');
        }
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

    toggleRecurrenceOptions(isRecurring) {
        const container = document.getElementById('recurrenceTypeContainer');
        if (isRecurring) {
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    clearForm() {
        document.getElementById('eventForm').reset();
        document.getElementById('editingEventId').value = '';
        document.getElementById('formTitle').textContent = 'Add Event';
        document.getElementById('submitBtn').textContent = 'Add Event';
        document.getElementById('cancelBtn').style.display = 'none';
        this.editingEventId = null;
        this.clearErrors();
        // Reset recurrence options
        this.toggleRecurrenceOptions(false);
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
        document.getElementById('recurrenceType').value = event.recurrenceType || 'annual';
        document.getElementById('editingEventId').value = eventId;
        
        // Show/hide recurrence options based on current state
        this.toggleRecurrenceOptions(event.isRecurring || false);

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
        
        // Apply all active filters
        const filteredEvents = this.applyAllFilters(this.events);
        
        return filteredEvents.filter(event => event.date === targetDate);
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

    // Enhanced filtering system
    updateCategoryFilter(category) {
        this.activeFilters.category = category;
        this.updateFilterUI();
        this.renderCalendar();
    }

    clearCategoryFilter() {
        this.activeFilters.category = '';
        document.getElementById('categoryFilter').value = '';
        this.updateFilterUI();
        this.renderCalendar();
    }

    updateDateRangePreset(preset) {
        this.activeFilters.dateRange.preset = preset;
        
        if (preset) {
            const ranges = this.getPresetDateRange(preset);
            this.activeFilters.dateRange.start = ranges.start;
            this.activeFilters.dateRange.end = ranges.end;
            
            // Update custom date inputs
            document.getElementById('dateRangeStart').value = this.formatDateForInput(ranges.start);
            document.getElementById('dateRangeEnd').value = this.formatDateForInput(ranges.end);
        } else {
            // Clear custom dates when switching to custom
            this.activeFilters.dateRange.start = null;
            this.activeFilters.dateRange.end = null;
        }
        
        this.updateFilterUI();
        this.renderCalendar();
    }

    updateCustomDateRange() {
        const startInput = document.getElementById('dateRangeStart');
        const endInput = document.getElementById('dateRangeEnd');
        
        // Clear preset when using custom dates
        document.getElementById('dateRangePreset').value = '';
        this.activeFilters.dateRange.preset = '';
        
        this.activeFilters.dateRange.start = startInput.value ? new Date(startInput.value) : null;
        this.activeFilters.dateRange.end = endInput.value ? new Date(endInput.value) : null;
        
        this.updateFilterUI();
        this.renderCalendar();
    }

    clearDateRangeFilter() {
        this.activeFilters.dateRange = { start: null, end: null, preset: '' };
        document.getElementById('dateRangePreset').value = '';
        document.getElementById('dateRangeStart').value = '';
        document.getElementById('dateRangeEnd').value = '';
        this.updateFilterUI();
        this.renderCalendar();
    }

    updateSearchFilter(searchTerm) {
        this.activeFilters.search = searchTerm.trim();
        this.updateFilterUI();
        this.renderCalendar();
    }

    clearSearchFilter() {
        this.activeFilters.search = '';
        document.getElementById('searchInput').value = '';
        this.updateFilterUI();
        this.renderCalendar();
    }

    clearAllFilters() {
        this.activeFilters = {
            category: '',
            dateRange: { start: null, end: null, preset: '' },
            search: ''
        };
        
        // Clear UI elements
        document.getElementById('categoryFilter').value = '';
        document.getElementById('dateRangePreset').value = '';
        document.getElementById('dateRangeStart').value = '';
        document.getElementById('dateRangeEnd').value = '';
        document.getElementById('searchInput').value = '';
        
        this.updateFilterUI();
        this.renderCalendar();
    }

    applyAllFilters(events) {
        let filtered = [...events];
        
        // Apply category filter
        if (this.activeFilters.category) {
            filtered = filtered.filter(event => event.category === this.activeFilters.category);
        }
        
        // Apply date range filter
        if (this.activeFilters.dateRange.start || this.activeFilters.dateRange.end) {
            filtered = filtered.filter(event => {
                const eventDate = new Date(event.date);
                let inRange = true;
                
                if (this.activeFilters.dateRange.start) {
                    inRange = inRange && eventDate >= this.activeFilters.dateRange.start;
                }
                
                if (this.activeFilters.dateRange.end) {
                    inRange = inRange && eventDate <= this.activeFilters.dateRange.end;
                }
                
                return inRange;
            });
        }
        
        // Apply search filter
        if (this.activeFilters.search) {
            const searchLower = this.activeFilters.search.toLowerCase();
            filtered = filtered.filter(event => {
                return event.title.toLowerCase().includes(searchLower) ||
                       (event.description && event.description.toLowerCase().includes(searchLower));
            });
        }
        
        return filtered;
    }

    updateFilterUI() {
        // Update clear button visibility
        document.getElementById('clearCategoryFilter').style.display = 
            this.activeFilters.category ? 'inline-block' : 'none';
        
        document.getElementById('clearDateRangeFilter').style.display = 
            (this.activeFilters.dateRange.start || this.activeFilters.dateRange.end) ? 'inline-block' : 'none';
        
        document.getElementById('clearSearch').style.display = 
            this.activeFilters.search ? 'inline-block' : 'none';
        
        // Update active filters display
        this.updateActiveFiltersDisplay();
    }

    updateActiveFiltersDisplay() {
        const activeFiltersContainer = document.getElementById('activeFilters');
        const activeFiltersList = document.getElementById('activeFiltersList');
        
        const activeFilters = [];
        
        if (this.activeFilters.category) {
            const categoryName = this.getCategoryDisplayName(this.activeFilters.category);
            activeFilters.push(`Category: ${categoryName}`);
        }
        
        if (this.activeFilters.dateRange.preset) {
            activeFilters.push(`Date Range: ${this.getPresetDisplayName(this.activeFilters.dateRange.preset)}`);
        } else if (this.activeFilters.dateRange.start || this.activeFilters.dateRange.end) {
            const start = this.activeFilters.dateRange.start ? this.formatDateForDisplay(this.activeFilters.dateRange.start) : 'Start';
            const end = this.activeFilters.dateRange.end ? this.formatDateForDisplay(this.activeFilters.dateRange.end) : 'End';
            activeFilters.push(`Date Range: ${start} - ${end}`);
        }
        
        if (this.activeFilters.search) {
            activeFilters.push(`Search: "${this.activeFilters.search}"`);
        }
        
        if (activeFilters.length > 0) {
            activeFiltersList.innerHTML = activeFilters.map(filter => `<span class="filter-tag">${filter}</span>`).join('');
            activeFiltersContainer.style.display = 'block';
        } else {
            activeFiltersContainer.style.display = 'none';
        }
    }

    getPresetDateRange(preset) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        switch (preset) {
            case 'thisMonth':
                return {
                    start: new Date(currentYear, currentMonth, 1),
                    end: new Date(currentYear, currentMonth + 1, 0)
                };
            case 'nextMonth':
                return {
                    start: new Date(currentYear, currentMonth + 1, 1),
                    end: new Date(currentYear, currentMonth + 2, 0)
                };
            case 'thisYear':
                return {
                    start: new Date(currentYear, 0, 1),
                    end: new Date(currentYear, 11, 31)
                };
            case 'next3Months':
                return {
                    start: new Date(currentYear, currentMonth, 1),
                    end: new Date(currentYear, currentMonth + 3, 0)
                };
            default:
                return { start: null, end: null };
        }
    }

    getCategoryDisplayName(category) {
        const categories = {
            'birthday': '🎂 Birthday',
            'entertainment': '🎭 Entertainment',
            'holiday': '🎉 Holiday',
            'personal': '👤 Personal',
            'crypto': '₿ Crypto',
            'expense': '💰 Expense'
        };
        return categories[category] || category;
    }

    getPresetDisplayName(preset) {
        const presets = {
            'thisMonth': 'This Month',
            'nextMonth': 'Next Month',
            'thisYear': 'This Year',
            'next3Months': 'Next 3 Months'
        };
        return presets[preset] || preset;
    }

    formatDateForInput(date) {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatDateForDisplay(date) {
        if (!date) return '';
        return date.toLocaleDateString();
    }

    generateRecurringEvents(baseEvent) {
        const events = [];
        const baseDate = new Date(baseEvent.date);
        
        if (baseEvent.recurrenceType === 'annual') {
            // Generate events for current year + next 4 years (5 years total)
            const currentYear = new Date().getFullYear();
            for (let yearOffset = 0; yearOffset < 5; yearOffset++) {
                const recurringDate = new Date(baseDate);
                recurringDate.setFullYear(currentYear + yearOffset);
                
                const recurringEvent = {
                    ...baseEvent,
                    id: this.generateId(),
                    date: this.formatDateForInput(recurringDate),
                    title: baseEvent.title + (yearOffset > 0 ? ` (${currentYear + yearOffset})` : ''),
                    isRecurring: true,
                    parentEventId: baseEvent.id,
                    createdAt: new Date().toISOString()
                };
                
                events.push(recurringEvent);
            }
        } else if (baseEvent.recurrenceType === 'monthly') {
            // Generate events for 12 consecutive months
            for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
                const recurringDate = new Date(baseDate);
                recurringDate.setMonth(baseDate.getMonth() + monthOffset);
                
                // Handle month overflow (e.g., Jan 31 -> Feb 28/29)
                if (recurringDate.getDate() !== baseDate.getDate()) {
                    // Set to last day of the month if original date doesn't exist
                    recurringDate.setDate(0);
                }
                
                const monthName = recurringDate.toLocaleDateString('en-US', { month: 'short' });
                const year = recurringDate.getFullYear();
                
                const recurringEvent = {
                    ...baseEvent,
                    id: this.generateId(),
                    date: this.formatDateForInput(recurringDate),
                    title: baseEvent.title + (monthOffset > 0 ? ` (${monthName} ${year})` : ''),
                    isRecurring: true,
                    parentEventId: baseEvent.id,
                    createdAt: new Date().toISOString()
                };
                
                events.push(recurringEvent);
            }
        }
        
        return events;
    }

    // Data Management Methods
    exportEvents() {
        try {
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                totalEvents: this.events.length,
                events: this.events.map(event => ({
                    ...event,
                    // Remove internal IDs for cleaner export
                    firebaseId: undefined
                })).filter(event => event.firebaseId !== undefined || true) // Keep all events
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/[:.]/g, '-');
            link.download = `calendar-events-${timestamp}.json`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(link.href);
            
            this.showSuccessMessage(`Successfully exported ${exportData.totalEvents} events`);
            
        } catch (error) {
            console.error('Export failed:', error);
            this.showErrorMessage('Failed to export events. Please try again.');
        }
    }

    async importEvents(file) {
        if (!file) {
            this.showErrorMessage('No file selected');
            return;
        }

        if (file.type !== 'application/json') {
            this.showErrorMessage('Please select a valid JSON file');
            return;
        }

        try {
            const fileContent = await this.readFileAsText(file);
            const importData = JSON.parse(fileContent);
            
            // Validate import data structure
            if (!this.validateImportData(importData)) {
                this.showErrorMessage('Invalid file format. Please select a valid calendar export file.');
                return;
            }

            // Show import options dialog
            this.showImportDialog(importData);
            
        } catch (error) {
            console.error('Import failed:', error);
            if (error instanceof SyntaxError) {
                this.showErrorMessage('Invalid JSON file. Please check the file format.');
            } else {
                this.showErrorMessage('Failed to import events. Please try again.');
            }
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    validateImportData(data) {
        if (!data || typeof data !== 'object') return false;
        if (!data.events || !Array.isArray(data.events)) return false;
        
        // Validate each event has required fields
        return data.events.every(event => 
            event.title && 
            event.date && 
            event.category &&
            typeof event.title === 'string' &&
            typeof event.date === 'string' &&
            typeof event.category === 'string'
        );
    }

    showImportDialog(importData) {
        const existingCount = this.events.length;
        const importCount = importData.events.length;
        
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content import-dialog">
                <h3>Import Events</h3>
                <div class="import-info">
                    <p><strong>Import File:</strong> ${importData.totalEvents || importCount} events</p>
                    <p><strong>Current Calendar:</strong> ${existingCount} events</p>
                    <p><strong>Export Date:</strong> ${importData.exportDate ? new Date(importData.exportDate).toLocaleDateString() : 'Unknown'}</p>
                </div>
                <div class="import-options">
                    <label class="import-option">
                        <input type="radio" name="importMode" value="merge" checked>
                        <span>Merge with existing events</span>
                    </label>
                    <label class="import-option">
                        <input type="radio" name="importMode" value="replace">
                        <span>Replace all existing events</span>
                    </label>
                </div>
                <div class="modal-buttons">
                    <button class="apply-btn" onclick="calendar.processImport('${btoa(JSON.stringify(importData))}')">Import</button>
                    <button class="cancel-btn" onclick="calendar.closeImportDialog()">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.currentImportModal = modal;
    }

    async processImport(encodedData) {
        try {
            const importData = JSON.parse(atob(encodedData));
            const selectedMode = document.querySelector('input[name="importMode"]:checked').value;
            
            let processedEvents = [...importData.events];
            
            // Process events and handle recurring events
            const finalEvents = [];
            processedEvents.forEach(event => {
                const cleanedEvent = {
                    ...event,
                    id: this.generateId(),
                    firebaseId: undefined, // Will be assigned when synced
                    createdAt: event.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    // Convert string "true"/"false" to boolean
                    isRecurring: event.isRecurring === true || event.isRecurring === "true"
                };

                // If this is a recurring event, generate multiple instances
                if (cleanedEvent.isRecurring && (cleanedEvent.recurrenceType === 'annual' || cleanedEvent.recurrenceType === 'monthly')) {
                    const recurringEvents = this.generateRecurringEvents(cleanedEvent);
                    finalEvents.push(...recurringEvents);
                } else {
                    finalEvents.push(cleanedEvent);
                }
            });
            
            processedEvents = finalEvents;

            if (selectedMode === 'replace') {
                // Clear existing events
                this.events = [];
            }
            
            // Add imported events
            this.events.push(...processedEvents);
            
            // Remove duplicates based on title + date + category
            this.events = this.removeDuplicateEvents(this.events);
            
            // Save and refresh
            this.saveEventsToLocalStorage();
            this.renderCalendar();
            
            // Sync with Firebase
            if (this.firebase && this.firebase.isInitialized()) {
                this.syncImportedEventsToFirebase(processedEvents);
            }
            
            this.closeImportDialog();
            this.showSuccessMessage(`Successfully imported ${processedEvents.length} events`);
            
        } catch (error) {
            console.error('Process import failed:', error);
            this.showErrorMessage('Failed to process import. Please try again.');
        }
    }

    removeDuplicateEvents(events) {
        const seen = new Set();
        return events.filter(event => {
            const key = `${event.title}-${event.date}-${event.category}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    async syncImportedEventsToFirebase(events) {
        let syncedCount = 0;
        for (const event of events) {
            try {
                // Clean event data for Firebase (remove internal fields)
                const cleanEventData = this.cleanEventForFirebase(event);
                const firebaseId = await this.firebase.saveEvent(cleanEventData);
                if (firebaseId) {
                    const eventIndex = this.events.findIndex(e => e.id === event.id);
                    if (eventIndex >= 0) {
                        this.events[eventIndex].firebaseId = firebaseId;
                    }
                    syncedCount++;
                }
            } catch (error) {
                console.warn('Failed to sync imported event:', event.title, error);
            }
        }
        
        if (syncedCount > 0) {
            this.saveEventsToLocalStorage();
            console.log(`Synced ${syncedCount}/${events.length} imported events to Firebase`);
        }
    }

    cleanEventForFirebase(event) {
        // Remove internal fields that shouldn't be saved to Firebase
        const cleanEvent = { ...event };
        delete cleanEvent.firebaseId; // Firebase generates its own ID
        return cleanEvent;
    }

    closeImportDialog() {
        if (this.currentImportModal) {
            document.body.removeChild(this.currentImportModal);
            this.currentImportModal = null;
        }
    }

    createBackup() {
        try {
            const backupData = {
                version: '1.0',
                backupDate: new Date().toISOString(),
                events: this.events,
                calendarState: {
                    currentDate: this.currentDate.toISOString(),
                    viewMode: this.viewMode,
                    activeFilters: this.activeFilters
                }
            };
            
            localStorage.setItem('calendarBackup', JSON.stringify(backupData));
            
            // Update backup info display
            this.updateBackupInfo();
            
            this.showSuccessMessage('Backup created successfully');
            
        } catch (error) {
            console.error('Backup failed:', error);
            this.showErrorMessage('Failed to create backup. Please try again.');
        }
    }

    restoreBackup() {
        try {
            const backupData = localStorage.getItem('calendarBackup');
            if (!backupData) {
                this.showErrorMessage('No backup found');
                return;
            }

            const backup = JSON.parse(backupData);
            
            if (!this.validateBackupData(backup)) {
                this.showErrorMessage('Invalid backup data');
                return;
            }

            // Confirm restore
            if (!confirm('This will replace all current events with the backup. Are you sure?')) {
                return;
            }

            // Restore events
            this.events = [...backup.events];
            
            // Restore calendar state if available
            if (backup.calendarState) {
                if (backup.calendarState.currentDate) {
                    this.currentDate = new Date(backup.calendarState.currentDate);
                }
                if (backup.calendarState.viewMode) {
                    this.switchView(backup.calendarState.viewMode);
                }
                if (backup.calendarState.activeFilters) {
                    this.activeFilters = backup.calendarState.activeFilters;
                    this.restoreFilterUI();
                }
            }

            // Save and refresh
            this.saveEventsToLocalStorage();
            this.renderCalendar();
            this.updateMonthDisplay();
            
            // Sync with Firebase
            if (this.firebase && this.firebase.isInitialized()) {
                this.syncRestoredEventsToFirebase();
            }
            
            this.showSuccessMessage(`Backup restored: ${backup.events.length} events`);
            
        } catch (error) {
            console.error('Restore failed:', error);
            this.showErrorMessage('Failed to restore backup. Please try again.');
        }
    }

    validateBackupData(backup) {
        return backup && 
               backup.events && 
               Array.isArray(backup.events) &&
               backup.events.every(event => event.title && event.date && event.category);
    }

    async syncRestoredEventsToFirebase() {
        // This could be implemented to sync restored events to Firebase
        // For now, we'll just log the action
        console.log('Syncing restored events to Firebase...');
    }

    restoreFilterUI() {
        // Restore filter UI elements
        if (this.activeFilters.category) {
            document.getElementById('categoryFilter').value = this.activeFilters.category;
        }
        if (this.activeFilters.search) {
            document.getElementById('searchInput').value = this.activeFilters.search;
        }
        // Date range restoration would be more complex, skipping for now
        
        this.updateFilterUI();
    }

    updateBackupInfo() {
        const backupData = localStorage.getItem('calendarBackup');
        const infoElement = document.getElementById('lastBackupInfo');
        
        if (backupData) {
            try {
                const backup = JSON.parse(backupData);
                const backupDate = new Date(backup.backupDate);
                infoElement.textContent = `Last backup: ${backupDate.toLocaleString()}`;
            } catch (error) {
                infoElement.textContent = 'Backup data corrupted';
            }
        } else {
            infoElement.textContent = 'No backup available';
        }
    }

    async forceSync() {
        if (!this.firebase || !this.firebase.isInitialized()) {
            this.showErrorMessage('Firebase not available');
            this.updateSyncStatus('error', '❌ Firebase not available');
            return;
        }

        this.updateSyncStatus('syncing', '🔄 Syncing...');

        try {
            // Force reload from Firebase
            const firebaseEvents = await this.firebase.loadEvents();
            
            // Merge with local events
            const mergedEvents = this.mergeEvents(this.events, firebaseEvents);
            
            // Update local storage
            this.events = mergedEvents;
            this.saveEventsToLocalStorage();
            
            // Re-render calendar
            this.renderCalendar();
            
            this.updateSyncStatus('success', `✅ Synced (${this.events.length} events)`);
            this.showSuccessMessage('Data synchronized successfully');
            
        } catch (error) {
            console.error('Force sync failed:', error);
            this.updateSyncStatus('error', '❌ Sync failed');
            this.showErrorMessage('Failed to synchronize data');
        }
    }

    updateSyncStatus(status, message) {
        const indicator = document.getElementById('syncStatusIndicator');
        indicator.textContent = message;
        indicator.className = `sync-indicator sync-${status}`;
    }

    // Initialize sync status on load
    initializeSyncStatus() {
        if (this.firebase && this.firebase.isInitialized()) {
            this.updateSyncStatus('success', '✅ Connected');
        } else {
            this.updateSyncStatus('offline', '📱 Offline mode');
        }
        
        // Update backup info
        this.updateBackupInfo();
    }

    // Performance optimization methods
    getCachedEventsForDate(year, month, day) {
        const cacheKey = `${year}-${month}-${day}`;
        const cached = this.eventCache.get(cacheKey);
        
        if (cached && this.isCacheValid()) {
            return cached;
        }
        
        const events = this.getEventsForDateUncached(year, month, day);
        this.eventCache.set(cacheKey, events);
        
        return events;
    }

    getEventsForDateUncached(year, month, day) {
        const targetDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Apply all active filters
        const filteredEvents = this.applyAllFilters(this.events);
        
        return filteredEvents.filter(event => event.date === targetDate);
    }

    isCacheValid() {
        if (!this.lastCacheUpdate) return false;
        
        const cacheTimeout = 30000; // 30 seconds
        return Date.now() - this.lastCacheUpdate < cacheTimeout;
    }

    invalidateCache() {
        this.eventCache.clear();
        this.lastCacheUpdate = null;
    }

    updateCache() {
        this.lastCacheUpdate = Date.now();
    }

    // Enhanced validation with detailed error reporting
    validateEventData(eventData) {
        const errors = [];
        
        if (!eventData.title || typeof eventData.title !== 'string' || eventData.title.trim().length === 0) {
            errors.push('Title is required and must be a non-empty string');
        }
        
        if (!eventData.date || typeof eventData.date !== 'string') {
            errors.push('Date is required and must be a valid date string');
        } else {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(eventData.date)) {
                errors.push('Date must be in YYYY-MM-DD format');
            } else {
                const parsedDate = new Date(eventData.date);
                if (isNaN(parsedDate.getTime())) {
                    errors.push('Date must be a valid date');
                }
            }
        }
        
        const validCategories = ['birthday', 'entertainment', 'holiday', 'personal', 'crypto', 'expense'];
        if (!eventData.category || !validCategories.includes(eventData.category)) {
            errors.push(`Category must be one of: ${validCategories.join(', ')}`);
        }
        
        if (eventData.time && typeof eventData.time === 'string') {
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(eventData.time)) {
                errors.push('Time must be in HH:MM format (24-hour)');
            }
        }
        
        if (eventData.description && typeof eventData.description !== 'string') {
            errors.push('Description must be a string');
        }
        
        if (eventData.isRecurring !== undefined && typeof eventData.isRecurring !== 'boolean') {
            errors.push('isRecurring must be a boolean');
        }
        
        if (eventData.recurrenceType && !['annual', 'monthly'].includes(eventData.recurrenceType)) {
            errors.push('recurrenceType must be either "annual" or "monthly"');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Enhanced error handling with user-friendly messages
    handleError(error, operation = 'operation') {
        console.error(`Error during ${operation}:`, error);
        
        let userMessage = `An error occurred during ${operation}.`;
        
        if (error.name === 'QuotaExceededError') {
            userMessage = 'Storage quota exceeded. Please clear some data and try again.';
        } else if (error.name === 'NetworkError') {
            userMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.name === 'SecurityError') {
            userMessage = 'Security error. Please ensure you have proper permissions.';
        } else if (error.message && error.message.includes('Firebase')) {
            userMessage = 'Cloud sync error. Your data has been saved locally.';
        } else if (error.message && error.message.includes('JSON')) {
            userMessage = 'Data format error. Please check the file format and try again.';
        }
        
        this.showErrorMessage(userMessage);
        
        return {
            handled: true,
            userMessage: userMessage,
            originalError: error
        };
    }

    // Optimized rendering with debouncing
    debounceRender() {
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
        }
        
        this.renderTimeout = setTimeout(() => {
            this.renderCalendar();
            this.renderTimeout = null;
        }, 100);
    }

    // Memory management
    cleanup() {
        this.invalidateCache();
        
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
            this.renderTimeout = null;
        }
        
        // Remove any event listeners that might cause memory leaks
        document.querySelectorAll('.event-actions').forEach(menu => {
            menu.remove();
        });
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
    category: 'birthday|entertainment|holiday|personal|crypto|expense',
    description: 'Optional description',
    isRecurring: false,
    recurrenceType: 'annual|monthly', // optional
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