const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;


    try {

        const response = await fetch("/api/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email,
                password: password
            })

        });


        const result = await response.json();


        if (response.ok) {

    alert("Login successful!");

    localStorage.setItem("token", result.token);

    console.log(result);

    if (result.user.role === "admin") {
        window.location.href = "admin-dashboard.html";
    } else {
        window.location.href = "dashboard.html";
    }

} else {

    alert(result.error);

}

    } catch (error) {

        console.error(
            "Login failed:",
            error
        );

        alert(
            "Something went wrong. Please try again."
        );

    }

});