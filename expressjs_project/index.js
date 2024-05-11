const express = require("express");
const path = require("path");
const collection = require("./db");
const bcrypt = require('bcrypt');
const session = require('express-session');
const crypto = require('crypto');
const fs = require('fs');



const app = express();
const port = 3000;
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');



app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/about.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/service.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'service.html'));
});

app.get('/why.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'why.html'));
});

app.get('/team.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'team.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});


app.post("/signup", async (req, res) => {
    const data = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    };

    const existingUser = await collection.findOne({ email: data.email });

    if (existingUser) {
        res.send('User already exists. Please choose a different email.');
    } else {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        data.password = hashedPassword;

        try {
            const insertedUser = await collection.insertMany(data);
            console.log(insertedUser);
            res.write("<h1>Your Data has been submitted</h1>");
            res.write("<script> setTimeout(()=>{  window.location.href = '/login'; },2000) </script>");
            res.end();
        } catch (error) {
            console.error("Error inserting user:", error);
            res.status(500).send('Internal Server Error');
        }
    }
});





app.use(session({
    secret: crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: true
}));

app.post("/login", async (req, res) => {
    try {
        const check = await collection.findOne({ email: req.body.email });
        if (!check) {
            res.send("User name not found");
        }

        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
        if (!isPasswordMatch) {
            res.send("Wrong password");
        }

        // Store user information in session
        req.session.user = {
            name: check.name,
            email: check.email,
            password: check.password,
        };

        res.redirect("/home");
    } catch (error) {
        console.error(error);
        res.send("Something went wrong");
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session:", err);
            res.send("Error logging out");
        } else {
            res.redirect("/");
        }
    });
});




app.get("/home", (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'home.html'));
    } else {
        res.redirect("/login");
    }
});












app.use((req, res, next) => {
    res.status(404).send(`
        <p><h1>Page Not Found!</h1></p>
        <script>
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
        </script>
    `);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
