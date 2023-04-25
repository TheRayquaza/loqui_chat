const express = require("express")
const path = require("path")
const route = express.Router()
const controller = require(path.join(__dirname, "../controllers/logout"))

route.post("/", controller.logout)


module.exports = route;