// =========================
// ADMIN PAGE PROTECTION
// =========================

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}


// =========================
// GET HTML ELEMENTS
// =========================

const ticketTableBody =
    document.getElementById("ticketTableBody");

const searchInput =
    document.getElementById("searchInput");

const statusFilter =
    document.getElementById("statusFilter");

const priorityFilter =
    document.getElementById("priorityFilter");

const logoutButton =
    document.getElementById("logoutButton");


// =========================
// STORE DATA
// =========================

let allTickets = [];
let technicians = [];


// =========================
// CHECK ADMIN ROLE
// =========================

function checkAdminRole() {

    try {

        const payload =
            JSON.parse(
                atob(
                    token.split(".")[1]
                )
            );

        if (payload.role !== "admin") {

            alert("Access denied. Admin only.");

            window.location.href =
                "dashboard.html";

            return false;
        }

        return true;

    } catch (error) {

        console.error(
            "Invalid token:",
            error
        );

        localStorage.removeItem("token");

        window.location.href =
            "login.html";

        return false;
    }
}


// =========================
// LOAD ALL TICKETS
// =========================

async function loadTickets() {

    try {

        const response =
            await fetch(
                "/api/tickets",
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            localStorage.removeItem("token");

            window.location.href =
                "login.html";

            return;
        }


        const tickets =
            await response.json();


        if (!response.ok) {

            console.error(tickets);

            return;
        }


        allTickets = tickets;

        displayTickets(allTickets);

    } catch (error) {

        console.error(
            "Failed to load tickets:",
            error
        );
    }
}


// =========================
// LOAD TECHNICIANS
// =========================

async function loadTechnicians() {

    try {

        const response =
            await fetch(
                "/api/users",
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            console.error(
                "Admin access required"
            );

            return;
        }


        const users =
            await response.json();


        if (!response.ok) {

            console.error(users);

            return;
        }


        technicians = users;

        displayTickets(allTickets);

    } catch (error) {

        console.error(
            "Failed to load technicians:",
            error
        );
    }
}


// =========================
// DISPLAY TICKETS
// =========================

function displayTickets(tickets) {

    ticketTableBody.innerHTML = "";


    if (tickets.length === 0) {

        ticketTableBody.innerHTML = `
            <tr>
                <td colspan="9">
                    No tickets found
                </td>
            </tr>
        `;

        return;
    }


    tickets.forEach(ticket => {

        const row =
            document.createElement("tr");


        // =========================
        // TECHNICIAN OPTIONS
        // =========================

        let technicianOptions = `
            <option value="">
                Select Technician
            </option>
        `;


        technicians.forEach(technician => {

            const selected =
                ticket.assigned_to ===
                technician.name
                    ? "selected"
                    : "";


            technicianOptions += `
                <option
                    value="${technician.id}"
                    ${selected}
                >
                    ${technician.name}
                </option>
            `;

        });


        // =========================
        // TABLE ROW
        // =========================

        row.innerHTML = `

            <td>
                ${ticket.id}
            </td>


            <td>
                <a href="ticket-details.html?id=${ticket.id}">
                    ${ticket.title}
                </a>
            </td>


            <td>
                ${ticket.category}
            </td>


            <td>
                ${ticket.priority}
            </td>


            <td>
                <select
        class="statusSelect"
        data-ticket-id="${ticket.id}"
    >

        <option value="Open"
            ${ticket.status === "Open" ? "selected" : ""}>
            Open
        </option>

        <option value="In Progress"
            ${ticket.status === "In Progress" ? "selected" : ""}>
            In Progress
        </option>

        <option value="Resolved"
            ${ticket.status === "Resolved" ? "selected" : ""}>
            Resolved
        </option>

        <option value="Closed"
            ${ticket.status === "Closed" ? "selected" : ""}>
            Closed
        </option>

    </select>
            </td>


            <td>
                ${ticket.created_by}
            </td>


            <td>
                ${ticket.assigned_to || "Not assigned"}
            </td>


            <td>

                <select
                    class="technicianSelect"
                    data-ticket-id="${ticket.id}"
                >

                    ${technicianOptions}

                </select>


                <button
                    class="assignButton"
                    data-ticket-id="${ticket.id}"
                >
                    Assign
                </button>

            </td>


            <td>
                ${new Date(
                    ticket.created_at
                ).toLocaleString()}
            </td>

        `;


        ticketTableBody.appendChild(row);

    });


    addAssignButtonEvents();
    addStatusChangeEvents();
}

// =========================
// UPDATE TICKET STATUS
// =========================

function addStatusChangeEvents() {

    const statusSelects =
        document.querySelectorAll(
            ".statusSelect"
        );


    statusSelects.forEach(select => {

        select.addEventListener(
            "change",
            async function () {

                const ticketId =
                    this.dataset.ticketId;

                const newStatus =
                    this.value;


                try {

                    const response =
                        await fetch(
                            `/api/tickets/${ticketId}/status`,
                            {
                                method: "PATCH",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        `Bearer ${token}`
                                },

                                body: JSON.stringify({
                                    status: newStatus
                                })
                            }
                        );


                    const result =
                        await response.json();


                    if (response.ok) {

                        alert(
                            "Ticket status updated successfully!"
                        );

                        await loadTickets();

                    } else {

                        alert(
                            result.error ||
                            "Failed to update ticket status."
                        );

                    }

                } catch (error) {

                    console.error(
                        "Failed to update status:",
                        error
                    );

                    alert(
                        "Something went wrong. Please try again."
                    );

                }

            }
        );

    });

}

// =========================
// ASSIGN TECHNICIAN
// =========================

function addAssignButtonEvents() {

    const assignButtons =
        document.querySelectorAll(
            ".assignButton"
        );


    assignButtons.forEach(button => {

        button.addEventListener(
            "click",
            async function () {

                const ticketId =
                    this.dataset.ticketId;


                const select =
                    document.querySelector(
                        `.technicianSelect[data-ticket-id="${ticketId}"]`
                    );


                const technicianId =
                    select.value;


                if (!technicianId) {

                    alert(
                        "Please select a technician."
                    );

                    return;
                }


                try {

                    const response =
                        await fetch(
                            `/api/tickets/${ticketId}/assign`,
                            {
                                method: "PATCH",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        `Bearer ${token}`
                                },

                                body: JSON.stringify({
                                    assigned_to:
                                        Number(
                                            technicianId
                                        )
                                })
                            }
                        );


                    const result =
                        await response.json();


                    if (response.ok) {

                        alert(
                            "Technician assigned successfully!"
                        );


                        await loadTickets();

                    } else {

                        alert(
                            result.error ||
                            "Failed to assign technician."
                        );

                    }

                } catch (error) {

                    console.error(
                        "Failed to assign technician:",
                        error
                    );


                    alert(
                        "Something went wrong. Please try again."
                    );
                }

            }
        );

    });
}


// =========================
// FILTER TICKETS
// =========================

function filterTickets() {

    const searchText =
        searchInput.value
            .toLowerCase()
            .trim();


    const selectedStatus =
        statusFilter.value;


    const selectedPriority =
        priorityFilter.value;


    const filteredTickets =
        allTickets.filter(ticket => {


            const searchMatch =
                String(ticket.id)
                    .includes(searchText)

                ||

                ticket.title
                    .toLowerCase()
                    .includes(searchText)

                ||

                ticket.category
                    .toLowerCase()
                    .includes(searchText)

                ||

                ticket.created_by
                    .toLowerCase()
                    .includes(searchText);


            const statusMatch =
                selectedStatus === "All"

                ||

                ticket.status ===
                    selectedStatus;


            const priorityMatch =
                selectedPriority === "All"

                ||

                ticket.priority ===
                    selectedPriority;


            return (
                searchMatch &&
                statusMatch &&
                priorityMatch
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
// LOGOUT
// =========================

logoutButton.addEventListener(
    "click",
    () => {

        localStorage.removeItem("token");

        window.location.href =
            "login.html";

    }
);


// =========================
// START
// =========================

if (checkAdminRole()) {

    loadTechnicians();

    loadTickets();

}