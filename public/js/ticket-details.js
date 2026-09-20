// Get ticket ID from URL
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

// Get ticket ID from URL
const urlParams = new URLSearchParams(window.location.search);

const ticketId = urlParams.get("id");


// Get HTML elements
const ticketTitle = document.getElementById("ticketTitle");
const ticketIdElement = document.getElementById("ticketId");
const ticketDescription = document.getElementById("ticketDescription");
const ticketPriority = document.getElementById("ticketPriority");
const statusSelect = document.getElementById("statusSelect");
const ticketCategory = document.getElementById("ticketCategory");
const ticketCreatedBy = document.getElementById("ticketCreatedBy");
const ticketAssignedTo = document.getElementById("ticketAssignedTo");
const ticketCreatedAt = document.getElementById("ticketCreatedAt");
const ticketUpdatedAt = document.getElementById("ticketUpdatedAt");
const commentsList =
    document.getElementById("commentsList");


// =========================
// CHECK TICKET ID
// =========================

if (!ticketId) {

    ticketTitle.textContent =
        "Ticket not found";

} else {

    loadTicket();
    loadComments();

}


// =========================
// LOAD TICKET
// =========================

async function loadTicket() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(
            "/api/tickets/" + ticketId,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {

            ticketTitle.textContent = "Ticket not found";

            return;
        }


        const ticket = await response.json();


        // Display ticket information

        ticketTitle.textContent = ticket.title;

        ticketIdElement.textContent =
            "Ticket #" + ticket.id;

        ticketDescription.textContent =
            ticket.description;

        ticketPriority.textContent =
            ticket.priority;

        ticketPriority.classList.add(
            "priority-badge",
            "priority-" + ticket.priority.toLowerCase()
             );


        statusSelect.value = ticket.status;

        ticketCategory.textContent =
            ticket.category;

        ticketCreatedBy.textContent =
            ticket.created_by;

        ticketAssignedTo.textContent =
            ticket.assigned_to || "Not assigned";

        ticketCreatedAt.textContent =
            new Date(ticket.created_at).toLocaleString();

        ticketUpdatedAt.textContent =
            new Date(ticket.updated_at).toLocaleString();

    } catch (error) {

        console.error(
            "Failed to load ticket:",
            error
        );

        ticketTitle.textContent =
            "Failed to load ticket";

    }

}

// =========================
// LOAD COMMENTS
// =========================

async function loadComments() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(
            "/api/tickets/" + ticketId + "/comments",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        if (!response.ok) {

            commentsList.innerHTML =
                "<p>Failed to load comments.</p>";

            return;
        }


        const comments =
            await response.json();


        if (comments.length === 0) {

            commentsList.innerHTML =
                "<p>No comments yet.</p>";

            return;
        }


        commentsList.innerHTML = "";


        comments.forEach(comment => {

            const commentElement =
                document.createElement("div");

            commentElement.classList.add(
                "comment-item"
            );


            commentElement.innerHTML = `

                <strong>
                    ${comment.user_name}
                </strong>

                <small>
                    ${new Date(
                        comment.created_at
                    ).toLocaleString()}
                </small>

                <p>
                    ${comment.comment}
                </p>

            `;


            commentsList.appendChild(
                commentElement
            );

        });

    } catch (error) {

        console.error(
            "Failed to load comments:",
            error
        );

        commentsList.innerHTML =
            "<p>Failed to load comments.</p>";
    }
}

// =========================
// ADD COMMENT
// =========================

const commentInput =
    document.getElementById("commentInput");

const addCommentButton =
    document.getElementById("addCommentButton");


addCommentButton.addEventListener(
    "click",
    async function () {

        const comment =
            commentInput.value.trim();


        if (!comment) {

            alert("Please enter a comment.");

            return;
        }


        const token =
            localStorage.getItem("token");


        try {

            const response =
                await fetch(
                    "/api/tickets/" +
                    ticketId +
                    "/comments",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            comment: comment
                        })
                    }
                );


            const result =
                await response.json();


            if (response.ok) {

                alert(
                    "Comment added successfully!"
                );


                commentInput.value = "";


                await loadComments();

            } else {

                alert(
                    result.error ||
                    "Failed to add comment."
                );

            }

        } catch (error) {

            console.error(
                "Failed to add comment:",
                error
            );


            alert(
                "Something went wrong. Please try again."
            );
        }

    }
);

// =========================
// UPDATE TICKET STATUS
// =========================

statusSelect.addEventListener("change", async function() {

    const newStatus = statusSelect.value;

    const token = localStorage.getItem("token");

    try {

        const response = await fetch(
            "/api/tickets/" + ticketId + "/status",
            {
                method: "PATCH",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        const result = await response.json();

        if (response.ok) {

            alert("Ticket status updated successfully!");

        } else {

            alert("Failed to update ticket status.");

            console.error(result);

        }

    } catch (error) {

        console.error(
            "Failed to update ticket status:",
            error
        );

        alert(
            "Something went wrong. Please try again."
        );

    }

});