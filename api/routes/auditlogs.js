var express = require('express');
var router = express.Router();
const Response = require('../lib/Response');
const AuditLogs = require('../db/models/AuditLogs');
const moment = require("moment")

router.post("/", (req, res, next) => {
    try {

        let body = req.body
        let query = {}

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
        

        let auditLogs = await AuditLogs.find(query, {limit: 500, skip: body.skip, sort: {created_at: -1}});
        res.json(Response.successResponse(auditLogs));
    }
    catch {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
})