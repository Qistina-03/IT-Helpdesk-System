const token = localStorage.getItem("token");

if (!token) {

    window.location.href = "login.html";

}

// Get the table body
const ticketTableBody = document.getElementById("ticketTableBody");

// Get search and filter elements
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");

// Store all tickets
let allTickets = [];

// =========================
// LOGOUT
// =========================

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", function() {

    localStorage.removeItem("token");

    window.location.href = "login.html";

});

// =========================
// LOAD TICKETS
// =========================

async function loadTickets() {

    try {

        const token = localStorage.getItem("token");

const response = await fetch("/api/tickets", {

    headers: {
        "Authorization": `Bearer ${token}`
    }

});



        allTickets = await response.json();

        displayTickets(allTickets);

    } catch (error) {

        console.error("Failed to load tickets:", error);

        ticketTableBody.innerHTML = "";

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 7;
        cell.textContent = "Failed to load tickets.";

        row.appendChild(cell);
        ticketTableBody.appendChild(row);
    }
}


// =========================
// DISPLAY TICKETS
// =========================

function displayTickets(tickets) {

    // Clear table
    ticketTableBody.innerHTML = "";


    // No tickets
    if (tickets.length === 0) {

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 7;
        cell.textContent = "No tickets found.";

        row.appendChild(cell);
        ticketTableBody.appendChild(row);

        return;
    }


    // Display tickets
    tickets.forEach(function(ticket) {

        const row = document.createElement("tr");


        // ID
        const idCell = document.createElement("td");
        idCell.textContent = ticket.id;
        row.appendChild(idCell);


        // Title
        const titleCell = document.createElement("td");

        const titleLink = document.createElement("a");

        titleLink.href =
        "ticket-details.html?id=" + ticket.id;

        titleLink.textContent =
        ticket.title;

        titleLink.classList.add("ticket-title-link");

        titleCell.appendChild(titleLink);

        row.appendChild(titleCell);


        // Priority
        const priorityCell = document.createElement("td");

        const priorityBadge = document.createElement("span");

        priorityBadge.classList.add(
            "priority-badge",
            "priority-" + ticket.priority.toLowerCase()
        );

        priorityBadge.textContent = ticket.priority;

        priorityCell.appendChild(priorityBadge);

        row.appendChild(priorityCell);


        // Status
        const statusCell = document.createElement("td");

        const statusBadge = document.createElement("span");

        statusBadge.classList.add(
            "status-badge",
            "status-" + ticket.status
                .toLowerCase()
                .replace(" ", "-")
        );

        statusBadge.textContent = ticket.status;

        statusCell.appendChild(statusBadge);

        row.appendChild(statusCell);


        // Category
        const categoryCell = document.createElement("td");

        categoryCell.textContent = ticket.category;

        row.appendChild(categoryCell);


        // Created By
        const createdByCell = document.createElement("td");

        createdByCell.textContent = ticket.created_by;

        row.appendChild(createdByCell);


        // Assigned To
        const assignedToCell = document.createElement("td");

        assignedToCell.textContent =
            ticket.assigned_to || "Not assigned";

        row.appendChild(assignedToCell);


        // Add row to table
        ticketTableBody.appendChild(row);

    });
}


// =========================
// FILTER TICKETS
// =========================

function filterTickets() {

    const searchText =
        searchInput.value.toLowerCase();

    const selectedStatus =
        statusFilter.value;

    const selectedPriority =
        priorityFilter.value;


    const filteredTickets =
        allTickets.filter(function(ticket) {

            const matchesSearch =
                ticket.title
                    .toLowerCase()
                    .includes(searchText);


            const matchesStatus =
                selectedStatus === "all" ||
                ticket.status === selectedStatus;


            const matchesPriority =
                selectedPriority === "all" ||
                ticket.priority === selectedPriority;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority
            );

        });


    displayTickets(filteredTickets);
}


// =========================
// SEARCH
// =========================

searchInput.addEventListener(
    "input",
    filterTickets
);


// =========================
// STATUS FILTER
// =========================

statusFilter.addEventListener(
    "change",
    filterTickets
);


// =========================
// PRIORITY FILTER
// =========================

priorityFilter.addEventListener(
    "change",
    filterTickets
);


// =========================
// START
// =========================

loadTickets();
