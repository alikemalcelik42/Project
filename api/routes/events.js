var express = require('express');
var router = express.Router();
const { HTTP_CODES } = require("../config/Enum");
const emitter = require("../lib/Emitter");

emitter.addEmitter("notifications");


router.get("/", async (req, res, next) => {
    try {
        res.writeHead(HTTP_CODES.OK, {
            "Content-Type": "text/event-stream",
            "connection": "keep-alive",
            "cache-control": "no-cache, no-transform" 
        });

        const listener = (data) => {
            res.write("data:" + JSON.stringify(data) + "\n\n")
        } 

        emitter.getEmitter("notifications").on("messages", listener);

        req.on("close", () => {
            emitter.getEmitter("notifications").off("messages", listener);
        })

    } catch(error) {

    }
})

module.exports = router;