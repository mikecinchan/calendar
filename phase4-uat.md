# Phase 4 UAT Document - Advanced Calendar Features

## Overview
This User Acceptance Testing (UAT) document covers Phase 4 implementation of the My Calendar application, focusing on advanced filtering, search, and recurring event functionality.

**Phase 4 Features:**
- Category filtering system with visual feedback
- Date range filtering (custom and predefined ranges)
- Combined filtering capabilities
- Search functionality for event titles and descriptions
- Recurring events implementation (annual recurrence)
- Advanced UI interactions for filters and search

---

## Test Environment Setup

### Prerequisites
- Web browser (Chrome, Firefox, Safari, or Edge)
- Calendar application accessible via local server or file system
- Test data: Create sample events across different categories and dates

### Test Data Requirements
Create the following test events before testing:
1. **Birthday Events**: "John's Birthday" (2024-12-15), "Mom's Birthday" (2025-01-20)
2. **Holiday Events**: "Christmas" (2024-12-25), "New Year" (2025-01-01)
3. **Personal Events**: "Dentist Appointment" (2024-11-15), "Vacation" (2024-12-10)
4. **Work Events**: "Team Meeting" (2024-11-08), "Project Deadline" (2024-11-30)
5. **Special Events**: "Anniversary" (2024-11-25), "Concert" (2024-12-05)

---

## Test Cases

### TC1: Category Filtering System

#### TC1.1: Basic Category Filter
**Objective**: Verify category filtering works correctly

**Steps**:
1. Open the calendar application
2. Locate the "Category Filter" dropdown in the sidebar
3. Select "🎂 Birthday" from the dropdown
4. Observe the calendar display

**Expected Results**:
- Only birthday events are displayed on the calendar
- Non-birthday events are hidden
- Calendar refreshes automatically
- "Clear" button appears next to the category filter

**Pass/Fail**: ☐

---

#### TC1.2: Category Filter Clear Functionality
**Objective**: Verify clear category filter works correctly

**Steps**:
1. Apply a category filter (e.g., "Personal")
2. Click the "Clear" button next to the category filter
3. Observe the calendar display and filter UI

**Expected Results**:
- All events are displayed again (filter removed)
- "Clear" button disappears
- Category dropdown shows "All Categories"
- Calendar refreshes to show all events

**Pass/Fail**: ☐

---

#### TC1.3: Category Filter Visual Feedback
**Objective**: Verify visual feedback for active category filters

**Steps**:
1. Select different categories one by one
2. Observe the "Active Filters" section
3. Note the filter tag display

**Expected Results**:
- "Active Filters" section becomes visible when filter is applied
- Filter tag shows "Category: [Selected Category]"
- Filter tag has proper styling and is readable
- Active filters section hides when no filters are active

**Pass/Fail**: ☐

---

### TC2: Date Range Filtering

#### TC2.1: Predefined Date Range - This Month
**Objective**: Verify "This Month" preset filter works correctly

**Steps**:
1. Select "This Month" from the "Date Range Filter" dropdown
2. Observe the calendar display
3. Check the custom date inputs

**Expected Results**:
- Only events from the current month are displayed
- Custom date inputs are automatically filled with month start/end dates
- "Clear" button appears for date range filter
- Active filters section shows "Date Range: This Month"

**Pass/Fail**: ☐

---

#### TC2.2: Predefined Date Range - Next Month
**Objective**: Verify "Next Month" preset filter works correctly

**Steps**:
1. Select "Next Month" from the date range preset dropdown
2. Observe the calendar and filter display

**Expected Results**:
- Only next month's events are displayed
- Custom date inputs show next month's start/end dates
- Filter is properly indicated in active filters section

**Pass/Fail**: ☐

---

#### TC2.3: Custom Date Range
**Objective**: Verify custom date range filtering works correctly

**Steps**:
1. Select "Custom Range" from the preset dropdown
2. Set a start date (e.g., today's date)
3. Set an end date (e.g., 2 weeks from today)
4. Observe the results

**Expected Results**:
- Only events within the selected date range are displayed
- Preset dropdown resets to "Custom Range"
- Active filters shows "Date Range: [Start Date] - [End Date]"
- Events outside the range are hidden

**Pass/Fail**: ☐

---

#### TC2.4: Date Range Clear Functionality
**Objective**: Verify clearing date range filter works correctly

**Steps**:
1. Apply any date range filter
2. Click the "Clear" button for date range
3. Observe the results

**Expected Results**:
- All events are displayed regardless of date
- Date range inputs are cleared
- Preset dropdown shows "Custom Range"
- "Clear" button disappears
- Date range filter tag is removed from active filters

**Pass/Fail**: ☐

---

### TC3: Search Functionality

#### TC3.1: Title Search
**Objective**: Verify searching by event title works correctly

**Steps**:
1. Enter a partial event title in the search box (e.g., "birth")
2. Observe the calendar display in real-time
3. Try different search terms

**Expected Results**:
- Events matching the search term in title are displayed
- Non-matching events are hidden
- Search works in real-time as you type
- Search is case-insensitive
- "×" clear button appears in search box

**Pass/Fail**: ☐

---

#### TC3.2: Description Search
**Objective**: Verify searching by event description works correctly

**Steps**:
1. Create an event with a description containing unique text
2. Search for text that only exists in the description
3. Observe the results

**Expected Results**:
- Events with matching description text are displayed
- Search includes both title and description content
- Results update in real-time

**Pass/Fail**: ☐

---

#### TC3.3: Search Clear Functionality
**Objective**: Verify clearing search works correctly

**Steps**:
1. Enter a search term
2. Click the "×" button in the search box
3. Observe the results

**Expected Results**:
- Search box is cleared
- All events are displayed again
- "×" button disappears
- Search filter is removed from active filters

**Pass/Fail**: ☐

---

### TC4: Combined Filtering

#### TC4.1: Category + Date Range Filter
**Objective**: Verify multiple filters work together

**Steps**:
1. Apply a category filter (e.g., "Personal")
2. Apply a date range filter (e.g., "This Month")
3. Observe the results

**Expected Results**:
- Only events matching BOTH criteria are displayed
- Both filters appear in active filters section
- Calendar shows intersection of both filters
- Clear buttons work independently

**Pass/Fail**: ☐

---

#### TC4.2: Category + Search Filter
**Objective**: Verify category and search filters work together

**Steps**:
1. Apply a category filter
2. Enter a search term
3. Observe the combined results

**Expected Results**:
- Only events matching both category AND search term are shown
- Both filters are indicated in active filters
- Results update in real-time

**Pass/Fail**: ☐

---

#### TC4.3: All Filters Combined
**Objective**: Verify all three filter types work together

**Steps**:
1. Apply a category filter
2. Apply a date range filter
3. Enter a search term
4. Observe the results

**Expected Results**:
- Only events matching ALL three criteria are displayed
- All three filters appear in active filters section
- Results are accurate intersection of all filters

**Pass/Fail**: ☐

---

#### TC4.4: Clear All Filters
**Objective**: Verify "Clear All Filters" functionality

**Steps**:
1. Apply multiple filters (category, date range, search)
2. Click "Clear All Filters" button
3. Observe the results

**Expected Results**:
- All filters are cleared simultaneously
- All events are displayed
- All filter inputs are reset
- Active filters section disappears
- All clear buttons disappear

**Pass/Fail**: ☐

---

### TC5: Recurring Events

#### TC5.1: Create Annual Recurring Event
**Objective**: Verify recurring event creation works correctly

**Steps**:
1. Click to add a new event
2. Fill in event details (title, date, category)
3. Check the "Recurring event (annually)" checkbox
4. Submit the event
5. Navigate through different years to verify

**Expected Results**:
- Event is created for current year
- Additional instances are created for next 4 years (5 total)
- Each instance has proper year suffix in title (except current year)
- All instances have isRecurring flag set to true
- Success message indicates multiple events created

**Pass/Fail**: ☐

---

#### TC5.2: Recurring Event Visual Indicators
**Objective**: Verify recurring events have proper visual indicators

**Steps**:
1. Create a recurring event
2. Locate the event on the calendar
3. Hover over or click the event to see details

**Expected Results**:
- Recurring events have visual distinction (styling)
- Tooltip shows "🔁 Recurring annually" indicator
- Event title includes year for future instances

**Pass/Fail**: ☐

---

#### TC5.3: Edit Recurring Event
**Objective**: Verify editing individual recurring event instances

**Steps**:
1. Create a recurring event
2. Click on one instance of the recurring event
3. Select "Edit" from the action menu
4. Modify the event details
5. Save changes

**Expected Results**:
- Only the selected instance is modified
- Other instances remain unchanged
- Changes are saved correctly
- No impact on parent/child relationship

**Pass/Fail**: ☐

---

#### TC5.4: Delete Recurring Event Instance
**Objective**: Verify deleting individual recurring event instances

**Steps**:
1. Create a recurring event
2. Click on one instance
3. Select "Delete" from the action menu
4. Confirm deletion

**Expected Results**:
- Only the selected instance is deleted
- Other recurring instances remain intact
- Calendar updates correctly
- No cascade deletion occurs

**Pass/Fail**: ☐

---

### TC6: UI/UX Testing

#### TC6.1: Mobile Responsiveness - Filters
**Objective**: Verify filter interface works properly on mobile devices

**Steps**:
1. Open application on mobile device or resize browser to mobile width
2. Test all filter interactions
3. Verify filter visibility and usability

**Expected Results**:
- Filter controls are properly sized for mobile
- Date range inputs stack vertically
- Filter tags are readable and properly sized
- All buttons remain accessible
- Touch interactions work smoothly

**Pass/Fail**: ☐

---

#### TC6.2: Filter Performance
**Objective**: Verify filter performance with large number of events

**Steps**:
1. Create 50+ events across different categories and dates
2. Test various filter combinations
3. Measure response time and smoothness

**Expected Results**:
- Filtering happens instantly (< 1 second)
- No noticeable lag during real-time search
- Calendar updates smoothly
- No browser freezing or errors

**Pass/Fail**: ☐

---

#### TC6.3: Filter State Persistence
**Objective**: Verify filter states are maintained during navigation

**Steps**:
1. Apply multiple filters
2. Navigate between months using calendar controls
3. Change view modes (single/multi)
4. Refresh the page

**Expected Results**:
- Filters remain active during month navigation
- Filters work correctly in both view modes
- Filter states persist after page refresh (if implemented)
- Active filters display remains accurate

**Pass/Fail**: ☐

---

## Edge Cases and Error Handling

### EC1: Invalid Date Ranges
**Steps**:
1. Set end date before start date in custom range
2. Observe behavior

**Expected Results**:
- System handles gracefully (no errors)
- Results are logical or user is warned

**Pass/Fail**: ☐

---

### EC2: Empty Search Results
**Steps**:
1. Search for text that doesn't exist in any events
2. Observe the display

**Expected Results**:
- Calendar shows empty state appropriately
- No JavaScript errors occur
- Clear search functionality still works

**Pass/Fail**: ☐

---

### EC3: Filter Combinations with No Results
**Steps**:
1. Apply filter combination that yields no results
2. Observe the behavior

**Expected Results**:
- Calendar displays empty state gracefully
- Filter controls remain functional
- User can clear filters to restore events

**Pass/Fail**: ☐

---

## Browser Compatibility Testing

Test all above scenarios in:
- ☐ Chrome (latest version)
- ☐ Firefox (latest version)  
- ☐ Safari (latest version)
- ☐ Edge (latest version)

---

## Performance Benchmarks

### Load Time Targets:
- Initial filter application: < 500ms
- Real-time search response: < 200ms
- Calendar refresh with filters: < 300ms

### Memory Usage:
- No memory leaks after extensive filtering
- Reasonable memory usage with large datasets

---

## Sign-off

### Test Results Summary:
- **Total Test Cases**: 26
- **Passed**: ___
- **Failed**: ___
- **Blocked**: ___

### Critical Issues Found:
_List any critical issues that prevent core functionality_

### Minor Issues Found:
_List any minor issues or improvements needed_

### Overall Assessment:
☐ **PASS** - Phase 4 ready for production
☐ **CONDITIONAL PASS** - Minor issues need resolution
☐ **FAIL** - Critical issues require fixes before release

---

**Tested by**: ________________  
**Date**: ________________  
**Environment**: ________________  
**Browser/Device**: ________________  

---

## Notes and Observations
_Space for additional notes, observations, or recommendations_

---

*This UAT document should be completed before proceeding to Phase 5 implementation.*