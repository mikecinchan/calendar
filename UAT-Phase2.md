# User Acceptance Testing (UAT) - Phase 2: Event Management

## Test Overview
This document contains comprehensive test cases to validate the completion of Phase 2 deliverables for the My Calendar application.

**Test Environment:**
- Browser: Chrome, Firefox, Safari, Edge
- Device: Desktop and Mobile
- Prerequisites: Firebase project configured and Firestore database enabled

---

## Test Case 1: Event Form Validation

### TC1.1 - Required Field Validation
**Objective:** Verify that all required fields are properly validated

**Steps:**
1. Open the calendar application
2. Attempt to submit the event form without filling any fields
3. Fill only the title field and submit
4. Fill only title and date, leave category empty and submit

**Expected Results:**
- [x] Error messages appear for missing required fields
- [x] Form fields highlight in red when invalid
- [x] Error messages: "Title is required", "Date is required", "Category is required"
- [x] Form does not submit until all required fields are filled

### TC1.2 - Form Input Validation
**Objective:** Verify form accepts valid inputs correctly

**Steps:**
1. Fill in all required fields with valid data:
   - Title: "Test Event"
   - Date: Today's date
   - Category: Select "Birthday"
2. Submit the form

**Expected Results:**
- [x] No error messages appear
- [x] Form submits successfully
- [x] Success message displays: "Event created successfully!"
- [x] Form resets after submission

---

## Test Case 2: Create Event Functionality

### TC2.1 - Basic Event Creation
**Objective:** Verify new events can be created with required fields only

**Steps:**
1. Fill the event form:
   - Title: "John's Birthday"
   - Date: Select any future date
   - Category: "Birthday"
2. Submit the form

**Expected Results:**
- [x] Event appears on the calendar on the selected date
- [x] Event displays with pink background color (birthday category)
- [x] Event shows title "John's Birthday"
- [x] Success message appears
- [x] Form clears after creation

### TC2.2 - Complete Event Creation with Optional Fields
**Objective:** Verify events can be created with all fields populated

**Steps:**
1. Fill the event form:
   - Title: "Annual Company Meeting"
   - Date: Select a future date
   - Category: "Event"
   - Time: "14:30"
   - Description: "Quarterly review and planning session"
   - Check "Recurring event (annually)"
2. Submit the form

**Expected Results:**
- [x] Event appears on calendar with orange background
- [x] Event tooltip shows title, time, and description
- [x] Event data includes recurring flag
- [x] Event saves to Firebase (check browser console for confirmation)

### TC2.3 - Multiple Events on Same Date
**Objective:** Verify multiple events can be created for the same date

**Steps:**
1. Create first event for today's date with title "Morning Meeting"
2. Create second event for today's date with title "Lunch Break"
3. Check the calendar display

**Expected Results:**
- [X] Both events appear on the same calendar day
- [X] Events stack vertically in the day cell
- [X] Each event maintains its category color
- [X] Both events are clickable

---

## Test Case 3: Read/Display Events Functionality

### TC3.1 - Event Display on Calendar
**Objective:** Verify events display correctly on the calendar grid

**Steps:**
1. Create events for different dates and categories
2. Navigate between months to view events
3. Check event appearance and formatting

**Expected Results:**
- [X] Events appear on correct dates
- [X] Each category has distinct color coding:
  - Birthday: Pink (#ff4081)
  - Special Occasion: Purple (#9c27b0)
  - Holiday: Red (#f44336)
  - Personal: Green (#4caf50)
  - Event: Orange (#ff9800)
- [X] Event text is readable against background colors
- [x] Long event titles are truncated with ellipsis

### TC3.2 - Event Tooltip Information
**Objective:** Verify event tooltips show complete information

**Steps:**
1. Hover over events with different field combinations:
   - Event with only required fields
   - Event with time but no description
   - Event with full details (title, time, description)

**Expected Results:**
- [x] Tooltip appears on hover
- [x] Shows event title
- [x] Shows time when provided (format: "at HH:MM")
- [x] Shows description when provided
- [x] Information is properly formatted and readable

---

## Test Case 4: Update/Edit Events Functionality

### TC4.1 - Event Edit Mode Activation
**Objective:** Verify events can be selected for editing

**Steps:**
1. Create a test event
2. Click on the event in the calendar
3. Check that edit menu appears

**Expected Results:**
- [x] Click event shows action menu with "Edit" and "Delete" buttons
- [x] Edit button has blue background
- [x] Delete button has red background
- [x] Menu positions correctly near the clicked event

### TC4.2 - Edit Form Population
**Objective:** Verify edit form is populated with existing event data

**Steps:**
1. Create an event with all fields populated
2. Click the event and select "Edit"
3. Check form population

**Expected Results:**
- [x] Form title changes to "Edit Event"
- [x] Submit button text changes to "Update Event"
- [x] Cancel button becomes visible
- [x] All existing field values are populated correctly:
  - Title field shows existing title
  - Date field shows existing date
  - Category dropdown shows existing selection
  - Time field shows existing time
  - Description shows existing text
  - Recurring checkbox reflects existing state

### TC4.3 - Event Update Process
**Objective:** Verify event updates save correctly

**Steps:**
1. Edit an existing event
2. Change the title to "Updated Event Title"
3. Change the category to a different one
4. Add/modify description
5. Submit the form

**Expected Results:**
- [x] Event updates on calendar immediately
- [x] New category color is applied
- [x] Updated title displays
- [x] Success message: "Event updated successfully!"
- [x] Form returns to "Add Event" mode
- [x] Changes persist after page refresh

### TC4.4 - Cancel Edit Operation
**Objective:** Verify edit operation can be cancelled

**Steps:**
1. Start editing an event
2. Make some changes to form fields
3. Click "Cancel" button

**Expected Results:**
- [x] Form clears and returns to "Add Event" mode
- [x] Cancel button disappears
- [x] Original event remains unchanged
- [x] No updates are saved

---

## Test Case 5: Delete Events Functionality

### TC5.1 - Delete Confirmation
**Objective:** Verify delete operation requires confirmation

**Steps:**
1. Create a test event
2. Click the event and select "Delete"

**Expected Results:**
- [x] Confirmation dialog appears
- [x] Dialog asks "Are you sure you want to delete this event?"
- [x] Dialog has OK and Cancel options

### TC5.2 - Delete Execution
**Objective:** Verify event deletion works correctly

**Steps:**
1. Create and confirm delete of an event
2. Check calendar display

**Expected Results:**
- [x] Event disappears from calendar immediately
- [x] Success message: "Event deleted successfully!"
- [x] Event is removed from local storage
- [x] Event is removed from Firebase (check console)
- [x] Deletion persists after page refresh

### TC5.3 - Cancel Delete Operation
**Objective:** Verify delete can be cancelled

**Steps:**
1. Click delete on an event
2. Click "Cancel" in confirmation dialog

**Expected Results:**
- [x] Event remains on calendar
- [x] No changes are made
- [x] Action menu disappears

---

## Test Case 6: Category System with Color Coding

### TC6.1 - Category Color Validation
**Objective:** Verify each category has correct color coding

**Steps:**
1. Create one event for each category:
   - Birthday event
   - Special Occasion event  
   - Holiday event
   - Personal event
   - Event category
2. Check visual appearance

**Expected Results:**
- [x] Birthday events: Pink background (#ff4081)
- [x] Special Occasion events: Purple background (#9c27b0)
- [x] Holiday events: Red background (#f44336)
- [x] Personal events: Green background (#4caf50)
- [x] Event category: Orange background (#ff9800)
- [x] All text remains readable on colored backgrounds

### TC6.2 - Category Filter Integration
**Objective:** Verify category options are consistent between form and filter

**Steps:**
1. Check event form category dropdown
2. Check filter category dropdown
3. Compare options and formatting

**Expected Results:**
- [x] Both dropdowns have identical category options
- [x] Categories include emojis: 🎂 Birthday, ✨ Special Occasion, 🎉 Holiday, 👤 Personal, 📅 Event
- [x] Default "All Categories" option in filter
- [x] Consistent visual presentation

---

## Test Case 7: Firebase Data Persistence

### TC7.1 - Firebase Connection Test
**Objective:** Verify Firebase integration is working

**Steps:**
1. Open browser developer tools → Console
2. Create a new event
3. Check console messages

**Expected Results:**
- [x] Console shows "Firebase initialized successfully"
- [x] Console shows "Event saved to Firebase with ID: [firebase-id]"
- [x] No Firebase error messages appear

### TC7.2 - Data Persistence Test
**Objective:** Verify events persist across browser sessions

**Steps:**
1. Create several events
2. Close browser completely
3. Reopen application

**Expected Results:**
- [x] All events reappear on calendar
- [x] Events maintain correct dates, colors, and details
- [x] Firebase data matches local display

### TC7.3 - Local Storage Fallback
**Objective:** Verify local storage works when Firebase is unavailable

**Steps:**
1. Disable internet connection
2. Create events
3. Check functionality

**Expected Results:**
- [x] Events still save and display
- [x] Console shows fallback messages
- [x] Local storage contains event data
- [x] Functionality remains intact

---

## Test Case 8: Form Enhancement Features

### TC8.1 - Recurring Event Option
**Objective:** Verify recurring event checkbox functionality

**Steps:**
1. Create event with recurring option checked
2. Create event with recurring option unchecked
3. Edit events to toggle recurring status

**Expected Results:**
- [x] Checkbox state saves correctly
- [x] Recurring events have recurrenceType: "annual"
- [x] Non-recurring events have recurrenceType: null
- [x] Edit form shows correct checkbox state

### TC8.2 - Success Message Display
**Objective:** Verify success messages appear and disappear correctly

**Steps:**
1. Perform create, update, and delete operations
2. Observe success message behavior

**Expected Results:**
- [x] Success messages appear in top-right corner
- [x] Messages have green background and white text
- [x] Messages automatically disappear after 3 seconds
- [x] Messages don't overlap or interfere with UI

---

## Test Case 9: Error Handling and Edge Cases

### TC9.1 - Network Error Handling
**Objective:** Verify graceful handling of Firebase connection issues

**Steps:**
1. Temporarily disable internet connection
2. Attempt CRUD operations
3. Re-enable connection

**Expected Results:**
- [x] Operations continue to work with local storage
- [x] Warning messages appear in console
- [x] No application crashes or freezes
- [x] Data syncs when connection restored

### TC9.2 - Duplicate Event Handling
**Objective:** Verify application handles similar/duplicate events

**Steps:**
1. Create multiple events with same title and date
2. Create events with identical details

**Expected Results:**
- [x] All events are created successfully
- [x] Each event has unique ID
- [x] Events display correctly even when identical
- [x] Edit/delete operations target correct event

---

## Test Case 10: Mobile Responsiveness

### TC10.1 - Mobile Event Management
**Objective:** Verify event management works on mobile devices

**Steps:**
1. Access application on mobile device/responsive mode
2. Test all event CRUD operations
3. Check form usability

**Expected Results:**
- [x] Event form is usable on small screens
- [x] Touch interactions work for event selection
- [x] Edit/delete menus appear correctly
- [x] Success messages are visible and positioned well
- [x] All buttons and inputs are touch-friendly

---

## Pass/Fail Criteria

### Phase 2 is considered COMPLETE when:
- [x] **All 30+ test cases pass successfully**
- [x] **No critical bugs or crashes**
- [x] **Firebase integration works correctly**
- [x] **All CRUD operations function properly**
- [x] **Category system displays correct colors**
- [x] **Form validation prevents invalid submissions**
- [x] **Success/error messages display appropriately**
- [x] **Mobile responsiveness is maintained**

### Critical Issues that would FAIL Phase 2:
- Events cannot be created
- Events cannot be edited or deleted
- Form validation not working
- Firebase integration completely broken
- Category colors not displaying
- Application crashes during normal usage

---

## Test Execution Notes

**Test Environment Setup:**
1. Clear browser local storage before testing
2. Ensure stable internet connection for Firebase tests
3. Test in multiple browsers (Chrome, Firefox, Safari, Edge)
4. Test on both desktop and mobile viewports

**Test Data Preparation:**
- Use varied event titles and descriptions
- Test with past, current, and future dates
- Include special characters in event details
- Test with different time formats

**Documentation:**
- Mark each test case as Pass/Fail
- Document any issues found with screenshots
- Note browser/device specific behaviors
- Record performance observations

---

*This UAT document ensures comprehensive validation of Phase 2: Event Management functionality before proceeding to Phase 3.*