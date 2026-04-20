# Workbuster to Google Calendar Extension

A Chrome extension that allows you to easily export Workbuster events to Google Calendar.

## Features

- Automatically detects Workbuster events on the schedule page
- Adds "Add to Google Calendar" buttons to each event
- Exports event title, date, time, and description to Google Calendar
- Works with dynamically loaded events
- Clean and simple interface

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The extension will now be installed and ready to use

## Usage

1. Navigate to your Workbuster schedule page (https://secure.workbuster.com/portal/schedules/)
2. Each event will have an "Add to Google Calendar" button below it
3. Click the button to open Google Calendar with the event details pre-filled
4. Review and save the event in your Google Calendar

## Permissions

This extension requires:
- Access to https://secure.workbuster.com/* to read event data
- No additional permissions are required

## Development

The extension is built using:
- Manifest V3
- Vanilla JavaScript
- CSS for styling

## License

MIT License 