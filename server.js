const express = require("express");
const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const app = express();

const PORT = 3000;


// =========================
// MIDDLEWARE
// =========================

// Allow Express to read JSON data
app.use(express.json());

// Serve files from public folder
app.use(express.static("public"));

// =========================
// AUTHENTICATION MIDDLEWARE
// =========================

function authenticateToken(req, res, next) {

    const authHeader = req.headers["authorization"];

    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {

        return res.status(401).json({
            error: "Access token required"
        });

    }

    jwt.verify(
        token,
        process.env.JWT_SECRET,
        (err, user) => {

            if (err) {

                return res.status(403).json({
                    error: "Invalid or expired token"
                });

            }

            req.user = user;

            next();

        }
    );

}


// =========================
// LOGIN
// =========================

app.post("/api/login", async (req, res) => {

    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {

        return res.status(400).json({
            error: "Email and password are required"
        });

    }

    const sql = `
        SELECT
            id,
            name,
            email,
            password,
            role
        FROM users
        WHERE email = ?
    `;

    db.query(sql, [email], async (err, results) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                error: "Database query failed"
            });

        }

        // User not found
        if (results.length === 0) {

            return res.status(401).json({
                error: "Invalid email or password"
            });

        }

        const user = results[0];

        // Compare entered password with hashed password
        const passwordMatch =
            await bcrypt.compare(password, user.password);

        if (!passwordMatch) {

            return res.status(401).json({
                error: "Invalid email or password"
            });

        }

        // Login successful
        const token = jwt.sign(
    {
        id: user.id,
        role: user.role
    },
    process.env.JWT_SECRET,
    {
        expiresIn: "1h"
    }
);

res.json({
    message: "Login successful",
    token: token,
    user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
            }
        });

    });

});


// =========================
// GET ALL TICKETS
// =========================

app.get("/api/tickets", authenticateToken, (req, res) => {

    const userId = req.user.id;
    const userRole = req.user.role;

    let sql;
    let values = [];


    // ADMIN CAN SEE ALL TICKETS

    if (userRole === "admin") {

        sql = `
            SELECT
                tickets.id,
                tickets.title,
                tickets.description,
                tickets.priority,
                tickets.status,
                categories.name AS category,
                creator.name AS created_by,
                technician.name AS assigned_to,
                tickets.created_at,
                tickets.updated_at

            FROM tickets

            JOIN categories
                ON tickets.category_id = categories.id

            JOIN users AS creator
                ON tickets.created_by = creator.id

            LEFT JOIN users AS technician
                ON tickets.assigned_to = technician.id
        `;

    }


    // NORMAL USER CAN ONLY SEE THEIR OWN TICKETS

    else {

        sql = `
            SELECT
                tickets.id,
                tickets.title,
                tickets.description,
                tickets.priority,
                tickets.status,
                categories.name AS category,
                creator.name AS created_by,
                technician.name AS assigned_to,
                tickets.created_at,
                tickets.updated_at

            FROM tickets

            JOIN categories
                ON tickets.category_id = categories.id

            JOIN users AS creator
                ON tickets.created_by = creator.id

            LEFT JOIN users AS technician
                ON tickets.assigned_to = technician.id

            WHERE tickets.created_by = ?
        `;

        values = [userId];

    }


    db.query(sql, values, (err, results) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                error: "Database query failed"
            });

        }

        res.json(results);

    });

});

// =========================
// GET TICKET BY ID
// =========================

app.get("/api/tickets/:id", authenticateToken, (req, res) => {

    const ticketId = req.params.id;

    const userId = req.user.id;
    const userRole = req.user.role;

    let sql;
    let values;


    // ADMIN CAN VIEW ANY TICKET

    if (userRole === "admin") {

        sql = `
            SELECT
                tickets.id,
                tickets.title,
                tickets.description,
                tickets.priority,
                tickets.status,
                categories.name AS category,
                creator.name AS created_by,
                technician.name AS assigned_to,
                tickets.created_at,
                tickets.updated_at

            FROM tickets

            JOIN categories
                ON tickets.category_id = categories.id

            JOIN users AS creator
                ON tickets.created_by = creator.id

            LEFT JOIN users AS technician
                ON tickets.assigned_to = technician.id

            WHERE tickets.id = ?
        `;

        values = [ticketId];

    }


    // NORMAL USER CAN ONLY VIEW THEIR OWN TICKET

    else {

        sql = `
            SELECT
                tickets.id,
                tickets.title,
                tickets.description,
                tickets.priority,
                tickets.status,
                categories.name AS category,
                creator.name AS created_by,
                technician.name AS assigned_to,
                tickets.created_at,
                tickets.updated_at

            FROM tickets

            JOIN categories
                ON tickets.category_id = categories.id

            JOIN users AS creator
                ON tickets.created_by = creator.id

            LEFT JOIN users AS technician
                ON tickets.assigned_to = technician.id

            WHERE tickets.id = ?
            AND tickets.created_by = ?
        `;

        values = [ticketId, userId];

    }


    db.query(sql, values, (err, results) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                error: "Database query failed"
            });

        }


        if (results.length === 0) {

            return res.status(404).json({
                error: "Ticket not found"
            });

        }


        res.json(results[0]);

    });

});

// =========================
// ADD TICKET COMMENT
// =========================

app.post("/api/tickets/:id/comments", authenticateToken, (req, res) => {

    const ticketId = req.params.id;

    const userId = req.user.id;
    const userRole = req.user.role;

    const { comment } = req.body;


    if (!comment || comment.trim() === "") {

        return res.status(400).json({
            error: "Comment is required"
        });

    }


    // Check ticket access

    let checkSql;
    let checkValues;


    if (userRole === "admin") {

        checkSql = `
            SELECT id
            FROM tickets
            WHERE id = ?
        `;

        checkValues = [ticketId];

    } else {

        checkSql = `
            SELECT id
            FROM tickets
            WHERE id = ?
            AND created_by = ?
        `;

        checkValues = [
            ticketId,
            userId
        ];

    }


    db.query(
        checkSql,
        checkValues,
        (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    error: "Database query failed"
                });

            }


            if (results.length === 0) {

                return res.status(404).json({
                    error: "Ticket not found"
                });

            }


            // Insert comment

            const sql = `
                INSERT INTO comments
                (
                    ticket_id,
                    user_id,
                    comment
                )
                VALUES (?, ?, ?)
            `;


            db.query(
                sql,
                [
                    ticketId,
                    userId,
                    comment.trim()
                ],
                (err, result) => {

                    if (err) {

                        console.error(err);

                        return res.status(500).json({
                            error: "Failed to add comment"
                        });

                    }


                    res.status(201).json({
                        message: "Comment added successfully",
                        comment_id: result.insertId
                    });

                }
            );

        }
    );

});

// =========================
// GET TICKET COMMENTS
// =========================

app.get("/api/tickets/:id/comments", authenticateToken, (req, res) => {

    const ticketId = req.params.id;

    const userId = req.user.id;
    const userRole = req.user.role;


    // Check ticket access

    let checkSql;
    let checkValues;


    if (userRole === "admin") {

        checkSql = `
            SELECT id
            FROM tickets
            WHERE id = ?
        `;

        checkValues = [ticketId];

    } else {

        checkSql = `
            SELECT id
            FROM tickets
            WHERE id = ?
            AND created_by = ?
        `;

        checkValues = [
            ticketId,
            userId
        ];

    }


    db.query(
        checkSql,
        checkValues,
        (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    error: "Database query failed"
                });

            }


            if (results.length === 0) {

                return res.status(404).json({
                    error: "Ticket not found"
                });

            }


            // Get comments

            const sql = `
                SELECT
                    comments.id,
                    comments.comment,
                    comments.created_at,
                    users.name AS user_name,
                    users.role AS user_role

                FROM comments

                JOIN users
                    ON comments.user_id = users.id

                WHERE comments.ticket_id = ?

                ORDER BY comments.created_at ASC
            `;


            db.query(
                sql,
                [ticketId],
                (err, results) => {

                    if (err) {

                        console.error(err);

                        return res.status(500).json({
                            error: "Failed to load comments"
                        });

                    }


                    res.json(results);

                }
            );

        }
    );

});

// =========================
// CREATE NEW TICKET
// =========================

app.post("/api/tickets", authenticateToken, (req, res) => {

    const {
    title,
    description,
    priority,
    category_id
} = req.body;

const created_by = req.user.id;


    const sql = `
        INSERT INTO tickets
        (
            title,
            description,
            priority,
            category_id,
            created_by
        )
        VALUES (?, ?, ?, ?, ?)
    `;


    const values = [
        title,
        description,
        priority,
        category_id,
        created_by
    ];


    db.query(sql, values, (err, result) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                error: "Failed to create ticket"
            });
        }


        res.status(201).json({
            message: "Ticket created successfully",
            ticket_id: result.insertId
        });

    });

});

// =========================
// UPDATE TICKET STATUS
// =========================

app.patch("/api/tickets/:id/status", authenticateToken, (req, res) => {

    const ticketId = req.params.id;

    const userId = req.user.id;
    const userRole = req.user.role;

    const { status } = req.body;


    // Allowed status values

    const allowedStatuses = [
        "Open",
        "In Progress",
        "Resolved",
        "Closed"
    ];


    // Check status

    if (!allowedStatuses.includes(status)) {

        return res.status(400).json({
            error: "Invalid status"
        });

    }


    let sql;
    let values;


    // ADMIN CAN UPDATE ANY TICKET

    if (userRole === "admin") {

        sql = `
            UPDATE tickets
            SET status = ?
            WHERE id = ?
        `;

        values = [
            status,
            ticketId
        ];

    }


    // NORMAL USER CAN ONLY UPDATE THEIR OWN TICKET

    else {

        sql = `
            UPDATE tickets
            SET status = ?
            WHERE id = ?
            AND created_by = ?
        `;

        values = [
            status,
            ticketId,
            userId
        ];

    }


    db.query(
        sql,
        values,
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    error: "Failed to update ticket status"
                });

            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error: "Ticket not found"
                });

            }


            res.json({
                message: "Ticket status updated successfully"
            });

        }
    );

});

// =========================
// GET TECHNICIANS
// =========================

app.get("/api/users", authenticateToken, (req, res) => {

    // ONLY ADMIN CAN VIEW USERS

    if (req.user.role !== "admin") {

        return res.status(403).json({
            error: "Admin access required"
        });

    }


    const sql = `
        SELECT
            id,
            name,
            email,
            role
        FROM users
        WHERE role = 'user'
        ORDER BY name
    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                error: "Failed to load technicians"
            });

        }


        res.json(results);

    });

});

// =========================
// ASSIGN TECHNICIAN
// =========================

app.patch("/api/tickets/:id/assign", authenticateToken, (req, res) => {

    const ticketId = req.params.id;

    const userRole = req.user.role;

    const { assigned_to } = req.body;


    // ONLY ADMIN CAN ASSIGN TECHNICIAN

    if (userRole !== "admin") {

        return res.status(403).json({
            error: "Admin access required"
        });

    }


    // CHECK ASSIGNED USER

    if (!assigned_to) {

        return res.status(400).json({
            error: "Technician is required"
        });

    }


    const sql = `
        UPDATE tickets
        SET assigned_to = ?
        WHERE id = ?
    `;


    db.query(
        sql,
        [assigned_to, ticketId],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    error: "Failed to assign technician"
                });

            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error: "Ticket not found"
                });

            }


            res.json({
                message: "Technician assigned successfully"
            });

        }
    );

});

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});

