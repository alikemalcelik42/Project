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
const emitter = require("../lib/Emitter");
const _export = new (require("../lib/Export"))();
const _import = new (require("../lib/Import"))();
const fs = require("fs");
const multer = require("multer");
const config = require("../config");
const path = require("path");

let multerStorage = multer.diskStorage({
    destination: (req, file, next) => {
        next(null, config.PATH.FILE_UPLOAD_PATH);
    },
    filename: (req, file, next) => {
        next(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }, 
});

const upload = multer({storage: multerStorage}).single("im_file");

router.all("*", auth().authenticate(), (req, res, next) => {
    next();
})

router.get('/', auth().checkRoles("category_view"), async function(req, res, next) {

    try {
        let categories = await Categories.find({});
        res.json(Response.successResponse(categories));
    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/add', auth().checkRoles("category_add"), async function(req, res, next) {
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
        logger.info(req.user?.email, "Categories", "Add", category);

        emitter.getEmitter("notifications").emit("messages", {message: category.category_name + " is added" })

        res.json(Response.successResponse({success: true}));
    }
    catch (error) {
        logger.error(req.user?.email, "Categories", "Add", error)
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);    
    }   
});

router.post('/update', auth().checkRoles("category_update"), async function(req, res, next) {
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

router.post('/delete', auth().checkRoles("category_delete"), async function(req, res, next) {
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

router.post('/export', auth().checkRoles("category_view"), async function(req, res, next) {
    try {
        let categories = await Categories.find({});
        let excel =_export.toExcel(
            ["CATEGORY_NAME", "IS ACTIVE", "CREATED BY", "CREATED_AT", "UPDATED_AT"],
            ["category_name", "is_active", "created_by", "created_at", "updated_at"],
            categories
        );

        let filePath = __dirname + "/../tmp/categories_excel_" + Date.now() + ".xlsx";
        fs.writeFileSync(filePath, excel, "utf8");
        res.download(filePath);
        // fs.unlinkSync(filePath);
    }   
    catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/import', auth().checkRoles("category_add"), upload, async function(req, res, next) {
    try {
        let file = req.file;
        let body = req.body;

        let rows = _import.fromExcel(file.path);
        rows = rows.slice(1);

        for(let row of rows) {
            if(row.length > 0) {
                let [category_name, is_active, created_by, created_at, updated_at] = row;
                await Categories.create({
                    category_name: category_name,
                    is_active: is_active,
                    created_by: req.user?._id
                });
            }
        }

        res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse({success: true}, Enum.HTTP_CODES.CREATED));
    }   
    catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

module.exports = router;