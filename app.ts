import express from "express";
import bodyParser from "body-parser";

const usersRoutes = require("./routes/users-routes");
const usersDeleteRoutes = require("./routes/users-delete-routes");
const usersModifyRoutes = require("./routes/users-modify-routes");
const logRoutes = require("./routes/log-routes");
const chartsRoutes = require("./routes/charts-routes");
const contactRoutes = require("./routes/contact-routes");
const goalsRoutes = require("./routes/goals-routes");

const app = express();

app.use("/", bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

app.use("/api/users", usersRoutes);
app.use("/api/users/delete", usersDeleteRoutes);
app.use("/api/users/modify", usersModifyRoutes);
app.use("/api/log", logRoutes);
app.use("/api/charts", chartsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/goals", goalsRoutes);

module.exports = app;
