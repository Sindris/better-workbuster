// Debug logging function
function log(message, data = null) {
    const prefix = '[Workbuster Calendar]';
    if (data) {
        console.log(`${prefix} ${message}:`, data);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

// Function to format date for Google Calendar
function formatGoogleDateTime(date) {
    const formatted = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    log('Formatted date for Google Calendar', { original: date, formatted });
    return formatted;
}

// Function to parse time string (e.g., "14:30 - 15:30")
function parseTimeRange(timeStr) {
    log('Parsing time range', { timeStr });
    const [start, end] = timeStr.split(' - ');
    const result = { start, end };
    log('Parsed time range result', result);
    return result;
}

// Function to create Google Calendar URL
function createGoogleCalendarUrl(event) {
    log('Creating Google Calendar URL for event', event);
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `[R&M] ${event.title}`,
        details: event.description || '',
    });

    // Add dates if available
    if (event.startDateTime && event.endDateTime) {
        const datesParam = `${formatGoogleDateTime(event.startDateTime)}/${formatGoogleDateTime(event.endDateTime)}`;
        params.append('dates', datesParam);
        log('Added dates parameter', { datesParam });
    } else {
        log('No dates available for event', { event });
    }

    const url = `${baseUrl}?${params.toString()}`;
    log('Generated Google Calendar URL', { url });
    return url;
}

// Function to add export button to an event
function addExportButton(eventElement, eventData) {
    log('Adding export button to event', { eventData });
    
    // Check if button already exists to avoid duplicates
    const existingButton = eventElement.querySelector('.wb-calendar-export-btn');
    if (existingButton) {
        log('Export button already exists, skipping', { eventElement });
        return;
    }
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'wb-calendar-export-btn-container';
    
    const exportButton = document.createElement('a');
    exportButton.href = createGoogleCalendarUrl(eventData);
    exportButton.className = 'wb-calendar-export-btn';
    exportButton.textContent = 'Add to Google Calendar';
    exportButton.target = '_blank';
    
    buttonContainer.appendChild(exportButton);
    eventElement.appendChild(buttonContainer);
    log('Export button added successfully');
}

// Function to parse event data from DOM element
function parseEventData(eventElement) {
    log('Parsing event data from element', { element: eventElement });
    
    // Get the title and description from the media-body div
    const mediaBody = eventElement.querySelector('.media-body');
    const titleElement = mediaBody ? mediaBody.querySelector('.title') : null;
    const noteElement = mediaBody ? mediaBody.querySelector('.note') : null;
    
    // Get the date and time from the media-left div
    const mediaLeft = eventElement.querySelector('.media-left');
    const dateSpan = mediaLeft ? mediaLeft.querySelector('span:first-child') : null;
    const timeSpan = mediaLeft ? mediaLeft.querySelector('span:nth-child(2)') : null;
    
    log('Found elements', { 
        hasTitleElement: !!titleElement, 
        hasNoteElement: !!noteElement,
        hasDateSpan: !!dateSpan,
        hasTimeSpan: !!timeSpan
    });
    
    let title = '';
    let description = '';
    let dateStr = '';
    let timeRange = '';
    
    if (titleElement) {
        title = titleElement.textContent.trim();
        log('Extracted title', { title });
    }
    
    if (noteElement) {
        description = noteElement.textContent.trim();
        log('Extracted description', { description });
    }
    
    if (dateSpan) {
        dateStr = dateSpan.textContent.trim();
        log('Extracted date', { dateStr });
    }
    
    if (timeSpan) {
        timeRange = timeSpan.textContent.trim();
        log('Extracted time range', { timeRange });
    }
    
    // Create event data object
    const eventData = {
        title: title,
        description: description,
        timeRange: timeRange,
        dateStr: dateStr
    };
    
    // If we have both date and time, create DateTime objects
    if (dateStr && timeRange) {
        try {
            // Parse the Swedish date format (e.g., "måndag 7/4")
            const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})/);
            if (dateMatch) {
                const day = parseInt(dateMatch[1]);
                const month = parseInt(dateMatch[2]) - 1; // JavaScript months are 0-indexed
                const year = new Date().getFullYear(); // Default to current year
                
                const { start, end } = parseTimeRange(timeRange);
                const [startHour, startMinute] = start.split(':');
                const [endHour, endMinute] = end.split(':');
                
                log('Parsing time components', { 
                    start, end, 
                    startHour, startMinute, 
                    endHour, endMinute 
                });
                
                const date = new Date(year, month, day);
                log('Created base date object', { dateStr, date });
                
                eventData.startDateTime = new Date(date);
                eventData.startDateTime.setHours(parseInt(startHour), parseInt(startMinute));
                
                eventData.endDateTime = new Date(date);
                eventData.endDateTime.setHours(parseInt(endHour), parseInt(endMinute));
                
                log('Created DateTime objects', { 
                    startDateTime: eventData.startDateTime, 
                    endDateTime: eventData.endDateTime 
                });
            } else {
                log('Could not parse date from string', { dateStr });
            }
        } catch (error) {
            log('Error creating DateTime objects', { error: error.message });
        }
    } else {
        log('Missing date or time information', { dateStr, timeRange });
    }
    
    log('Final parsed event data', eventData);
    return eventData;
}

// Main function to process all events
function processEvents() {
    log('Processing events');
    const events = document.querySelectorAll('.media');
    log(`Found ${events.length} events`);
    
    events.forEach((eventElement, index) => {
        log(`Processing event ${index + 1}/${events.length}`);
        const eventData = parseEventData(eventElement);
        addExportButton(eventElement, eventData);
    });
    
    log('Finished processing all events');
}

// Run when the page loads
log('Content script loaded');
processEvents();

// Create a MutationObserver to watch for new events
log('Setting up MutationObserver');
const observer = new MutationObserver((mutations) => {
    log('Mutation detected', { 
        mutationCount: mutations.length,
        addedNodes: mutations.reduce((count, m) => count + m.addedNodes.length, 0)
    });
    
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            log('New nodes added, reprocessing events');
            processEvents();
        }
    });
});

// Start observing the event list container
const eventListContainer = document.querySelector('#event-list');
if (eventListContainer) {
    log('Found event list container, starting observation');
    observer.observe(eventListContainer, {
        childList: true,
        subtree: true
    });
} else {
    log('Event list container not found, observer not started');
} 