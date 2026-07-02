var express = require('express');
var router = express.Router();

const fs = require('fs');
let routes = fs.readdirSync(__dirname);

for (let route of routes) {
    if(route !== "index.js" && route.endsWith(".js")) {
        router.use(`/${route.replace(".js", "")}`, require(`./${route}`));
        console.log(`Route /${route.replace(".js", "")} loaded`);
    }
}

module.exports = router;
