var express = require('express');
var router = express.Router();
const Response = require('../lib/Response');
const AuditLogs = require('../db/models/AuditLogs');
const moment = require("moment");
const auth = require("../lib/auth");

router.all("*", auth().authenticate(), (req, res, next) => {
    next();
})

router.post("/", auth().checkRoles("auditlog_view"), async (req, res, next) => {
    try {

        let body = req.body
        let query = {}
        let skip = body.skip
        let limit = body.limit

        if(typeof body.skip !== "number" || body.skip < 0) {
            skip = 0;
        }

        if(typeof body.limit !== "number" || body.limit > 500 || body.limit < 1) {
            limit = 500;
        }

        if(body.begin_date && body.end_date) {
            query.created_at = {
                $gte: body.begin_date,
                $lte: body.end_date
            }
        } else {
            query.created_at = {
                $gte: moment().subtract(1, 'days').startOf("day"),
                $lte: moment()
            }
        }
        

        let auditLogs = await AuditLogs.find(query).sort({created_at: -1}).skip(skip).limit(limit);
        res.json(Response.successResponse(auditLogs));
    }
    catch(error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
})

module.exports = router;