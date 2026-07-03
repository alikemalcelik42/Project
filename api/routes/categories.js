var express = require('express');
var router = express.Router();
const Categories = require('../db/models/Categories');
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const Enum = require('../config/Enum');
const mongoose = require('mongoose');
const AuditLogger = require("../lib/AuditLogger");
const logger = require("../lib/logger/LoggerClass");
const auth = require("../lib/auth");

router.all("*", auth().authenticate(), (req, res, next) => {
    next();
})

router.get('/', async function(req, res, next) {

    try {
        let categories = await Categories.find({});
        res.json(Response.successResponse(categories));
    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/add', async function(req, res, next) {
    let body = req.body;
    try {
        if (!body.category_name) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "category_name is required"));
            return res.status(errorResponse.code).json(errorResponse);
        }

        let category = new Categories({
            category_name: body.category_name,
            is_active: true,
            created_by: req.user?.id
        });

        await category.save();

        AuditLogger.info(req.user?.email, "Categories", "Add", category);
        logger.info(req.user?.email, "Categories", "Add", category)

        res.json(Response.successResponse({success: true}));
    }
    catch (error) {
        logger.error(req.user?.email, "Categories", "Add", error)
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);    
    }   
});

router.post('/update', async function(req, res, next) {
    let body = req.body;

    if (!body._id) {
        let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "_id is required"));
        return res.status(errorResponse.code).json(errorResponse);
    }

    if (!mongoose.Types.ObjectId.isValid(body._id)) {
        let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "_id is not valid"));
        return res.status(errorResponse.code).json(errorResponse);
    }

    try {
        let updates = {}
        if(body.category_name) updates.category_name = body.category_name;
        if(typeof body.is_active === "boolean") updates.is_active = body.is_active;
        
        let updatedCategory = await Categories.findByIdAndUpdate(body._id, updates, { new: true });

        if (!updatedCategory) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "This category doesn't exist"));
            return res.status(errorResponse.code).json(errorResponse);
        }

        AuditLogger.info(req.user?.email, "Categories", "Update", {id:body._id, updates:updates});


        res.json(Response.successResponse({success: true}));
    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/delete', async function(req, res, next) {
    let body = req.body;
    if (!body._id) {
        let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "_id is required"));
        return res.status(errorResponse.code).json(errorResponse);
    }

    if (!mongoose.Types.ObjectId.isValid(body._id)) {
        let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "_id is not valid"));
        return res.status(errorResponse.code).json(errorResponse);
    }

    try {
        await Categories.findByIdAndDelete(body._id);

        AuditLogger.info(req.user?.email, "Categories", "Delete", {id:body._id});

        res.json(Response.successResponse({success: true}));
    }   
    catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

module.exports = router;