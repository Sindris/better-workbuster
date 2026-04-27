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
// Returns a "floating" time string (e.g. 20260420T080000) so it uses the time exactly as written
function formatGoogleDateTimeLocal(dateObj) {
    const pad = (n) => n.toString().padStart(2, '0');
    const formatted = `${dateObj.getFullYear()}${pad(dateObj.getMonth() + 1)}${pad(dateObj.getDate())}T${pad(dateObj.getHours())}${pad(dateObj.getMinutes())}00`;
    log('Formatted local date for Google Calendar', { original: dateObj, formatted });
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
        const datesParam = `${formatGoogleDateTimeLocal(event.startDateTime)}/${formatGoogleDateTimeLocal(event.endDateTime)}`;
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
    buttonContainer.style.textAlign = 'left';
    buttonContainer.style.marginTop = '8px';
    
    const exportButton = document.createElement('a');
    exportButton.href = createGoogleCalendarUrl(eventData);
    exportButton.className = 'wb-calendar-export-btn';
    exportButton.textContent = 'Lägg till i Google Calendar';
    exportButton.target = '_blank';
    
    buttonContainer.appendChild(exportButton);
    
    const contentDiv = eventElement.children[1];
    if (contentDiv) {
        contentDiv.appendChild(buttonContainer);
    } else {
        eventElement.appendChild(buttonContainer);
    }
    log('Export button added successfully');
}

// Function to parse event data from DOM element
function parseEventData(eventElement) {
    log('Parsing event data from element', { element: eventElement });
    
    const dayCard = eventElement.closest('.card.day');
    const dateStr = dayCard ? dayCard.id : ''; // e.g. "2026-04-20"
    
    const timeDiv = eventElement.children[0];
    const timeRange = timeDiv ? timeDiv.textContent.trim() : '';
    
    const contentDiv = eventElement.children[1];
    
    let title = '';
    let description = '';
    
    if (contentDiv) {
        const titleElement = contentDiv.querySelector('strong');
        if (titleElement) {
            title = titleElement.textContent.trim();
        }
        
        const contentClone = contentDiv.cloneNode(true);
        const titleEl = contentClone.querySelector('strong');
        if (titleEl) titleEl.remove();
        const hostEl = contentClone.querySelector('span');
        if (hostEl) hostEl.remove();
        
        description = contentClone.textContent.trim().replace(/\s+/g, ' ');
    }
    
    log('Extracted details', { title, dateStr, timeRange, description });
    
    const eventData = {
        title: title,
        description: description,
        timeRange: timeRange,
        dateStr: dateStr
    };
    
    if (dateStr && timeRange) {
        try {
            const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
            const { start, end } = parseTimeRange(timeRange);
            
            if (start && end) {
                const [startHour, startMinute] = start.split(':');
                const [endHour, endMinute] = end.split(':');
                
                eventData.startDateTime = new Date(year, month - 1, day, parseInt(startHour, 10), parseInt(startMinute, 10));
                eventData.endDateTime = new Date(year, month - 1, day, parseInt(endHour, 10), parseInt(endMinute, 10));
                
                log('Created DateTime objects', { 
                    startDateTime: eventData.startDateTime, 
                    endDateTime: eventData.endDateTime 
                });
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
    const events = document.querySelectorAll('#event-list .card.day > .flex-container');
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
let debounceTimer = null;

const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
            shouldProcess = true;
            break;
        }
    }
    
    if (shouldProcess) {
        log('New nodes added, queuing event reprocessing');
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            processEvents();
        }, 300); // 300ms debounce
    }
});

// Start observing a higher level container since Livewire might replace the entire #event-list
const appContainer = document.querySelector('.main-container') || document.body;
log('Found main container, starting observation');
observer.observe(appContainer, {
    childList: true,
    subtree: true
}); 