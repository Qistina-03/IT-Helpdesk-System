const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

const ticketForm = document.getElementById("ticketForm");


ticketForm.addEventListener("submit", async (event) => {

    // Prevent page from refreshing
    event.preventDefault();


    // Get values from the form
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const category_id = document.getElementById("category").value;
    const priority = document.getElementById("priority").value;


    // Create data object
    const ticketData = {
        title: title,
        description: description,
        priority: priority,
        category_id: Number(category_id)
    };


    // Get JWT token from browser
    const token = localStorage.getItem("token");


    try {

        // Send data to backend API
        const response = await fetch("/api/tickets", {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify(ticketData)

        });


        // Convert response to JSON
        const result = await response.json();


        // Check if request was successful
        if (response.ok) {

            alert("Ticket created successfully!");

            console.log(result);

            // Clear the form
            ticketForm.reset();

        } else {

            alert("Failed to create ticket.");

            console.error(result);

        }


    } catch (error) {

        console.error(error);

        alert("Something went wrong. Please try again.");

    }

});