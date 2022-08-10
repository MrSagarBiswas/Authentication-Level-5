require("dotenv").config();
const express = require("express");
const app = express();
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const e = require("express");

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    username:
    {
        type: String,
        required: true
    },
    password:
    {
        type: String
    }
});

userSchema.plugin(passportLocalMongoose);


const users = new mongoose.model("user", userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(users.createStrategy());

passport.serializeUser(users.serializeUser());
passport.deserializeUser(users.deserializeUser());

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/secrets", (req, res) => {
    if(req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
})

app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if(err) {
            console.log(err);
            return next(err);
        }
        res.redirect("/");
    });
})

app.route("/register")

    .get((req, res) => {
        res.render("register");
    })

    .post((req, res) => {
        users.findOne({username: req.body.username}, (err, doc) => {
            console.log(doc);
            if(doc){
                res.redirect("/login");
            } else {
                users.register({username: req.body.username}, req.body.password, (err, user) => {
                    if(err){
                        console.log(err);
                        res.redirect("/register");
                    } else {
                        passport.authenticate("local")(req, res, () => {
                            res.redirect("/secrets");
                        })
                    }
                });
            }
        });
    })

app.route("/login")

    .get((req, res) => {
        if(req.isAuthenticated()){
            res.redirect("/secrets");
        } else {
            res.render("login");
        }
    })

    .post((req, res) => {
        const user = new users({
            username: req.body.username,
            password: req.body.password
        });

        req.login(user, (err) => {
            if(err){
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect("/secrets");
                })
            }
        })
    })

app.listen(3000, () => {
    console.log("Hosted on Port 3000");
})