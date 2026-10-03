# CartShare

CartShare is a collaborative shopping web application built for the Internship Studio project brief.

## Features

- Create or join a unique shopping room
- Add and remove shared-cart items
- Track quantity, price, contributor, and group total
- Persist room data using browser localStorage
- Synchronize changes between browser tabs using the Storage Event API
- Activity log
- Participant list
- Printable group receipt
- Responsive design for mobile and desktop

## Tech Stack

- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- Browser localStorage
- JavaScript Storage Event API

## Run Locally

1. Download or clone the repository.
2. Open `index.html` in a browser.

For best results, use VS Code with the Live Server extension.

## Folder Structure

```text
CartShare/
├── index.html
├── README.md
├── css/
│   └── style.css
├── js/
│   └── app.js
└── assets/
```

## Testing Collaboration

1. Open the application in Browser Tab 1.
2. Enter a name and create a room.
3. Copy the room code shown in the dashboard.
4. Open the same `index.html` in Browser Tab 2.
5. Enter another name and join using the copied room code.
6. Add/remove items in either tab.
7. The other tab receives the update automatically.

## Printing

Use the **Receipt** button to open the browser print dialog. The page has print-specific CSS to produce a clean receipt.

## Project Brief Alignment

The application addresses the brief's shared-shopping coordination problem and implements room-based cart collaboration, activity tracking, persistence, tab synchronization, and printable receipts.
