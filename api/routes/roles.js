var express = require('express');
var router = express.Router();
const Roles = require('../db/models/Roles');
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const Enum = require('../config/Enum');
const role_privileges = require('../config/role_privileges');
const RolePrivileges = require('../db/models/RolePrivileges');
const mongoose = require('mongoose');
const auth = require("../lib/auth");
const AuditLogger = require("../lib/AuditLogger");
const logger = require("../lib/logger/LoggerClass");

router.all("*", auth().authenticate(), (req, res, next) => {
    next();
});

router.get('/', auth().checkRoles("role_view"), async function(req, res) {

    try {
        let roles = await Roles.find({});
        res.json(Response.successResponse(roles));
    } catch (error) {
        logger.error(req.user?.email, "Roles", "View", error);
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.get('/find/:id', auth().checkRoles("role_view"), async function(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Id değeri geçersiz."));
            return res.status(errorResponse.code).json(errorResponse);
        }

        let role = await Roles.findById(req.params.id);

        if(!role) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Bu id değerine sahip rol bulunmuyor."));
            return res.status(errorResponse.code).json(errorResponse);
        }

        res.json(Response.successResponse(role));
    } catch (error) {
        logger.error(req.user?.email, "Roles", "View", error);
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/add', auth().checkRoles("role_add"), async function(req, res) {
    let body = req.body;
    try {
        if (!body.role_name) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Role adı gerekli."));
            return res.status(errorResponse.code).json(errorResponse);
        }

        if(!body.permissions || !Array.isArray(body.permissions) || body.permissions.length === 0) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "İzinler gerekli ve bir dizi olmalı."));
            return res.status(errorResponse.code).json(errorResponse);
        }

        let role = new Roles({
            role_name: body.role_name,
            is_active: true,
            created_by: req.user?.id
        });

        await role.save();


        for (let permission of body.permissions) {
            let priv = new RolePrivileges({
                role_id: role._id,
                permission: permission,
                created_by: req.user?.id
            });
            await priv.save();
        }

        AuditLogger.info(req.user?.email, "Roles", "Add", role);
        logger.info(req.user?.email, "Roles", "Add", role);

        res.json(Response.successResponse({success: true}));
    }
    catch (error) {
        logger.error(req.user?.email, "Roles", "Add", error);
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);    
    }   
});

router.post('/update', auth().checkRoles("role_update"), async function(req, res) {
    try{
        let body = req.body;

        if (!body._id) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "_id gerekli."));
            return res.status(errorResponse.code).json(errorResponse);
        }
        
        if (!mongoose.Types.ObjectId.isValid(body._id)) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "_id doğru formatta değil."));
            return res.status(errorResponse.code).json(errorResponse);
        }
        
        if(body.permissions && Array.isArray(body.permissions)) {

            let permissions = await RolePrivileges.find({ role_id: body._id });  
            
            let removedPermissions = await permissions.filter(p => !body.permissions.includes(p.permission));
            
            let newPermissionsIds = await body.permissions.filter(x => !permissions.map(p => p.permission).includes(x));

            if(removedPermissions.length > 0) {
                let removedPermissionIds = removedPermissions.map(p => p._id);
                await RolePrivileges.deleteMany({ _id: { $in: removedPermissionIds } });
            }

            if(newPermissionsIds.length > 0) {
                for (let permissionId of newPermissionsIds) {
                    let priv = new RolePrivileges({
                        role_id: body._id,
                        permission: permissionId,
                        created_by: req.user?.id
                    });
                    await priv.save();
                }
            }
        }

        let updates = {}
        if(body.role_name) updates.role_name = body.role_name;
        if(typeof body.is_active === "boolean") updates.is_active = body.is_active;
        
        let updatedRole = await Roles.findByIdAndUpdate(body._id, updates, { new: true });

        if (!updatedRole) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Bu rol bulunamadı."));
            return res.status(errorResponse.code).json(errorResponse);
        }

        AuditLogger.info(req.user?.email, "Roles", "Update", {id:body._id, updates:updates});
        logger.info(req.user?.email, "Roles", "Update", {id:body._id, updates:updates});

        res.json(Response.successResponse({success: true}));
    } catch (error) {
        logger.error(req.user?.email, "Roles", "Update", error);
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/delete', auth().checkRoles("role_delete"), async function(req, res) {
    let body = req.body;
    if (!body._id) {
        let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "_id gerekli"));
        return res.status(errorResponse.code).json(errorResponse);
    }

    try {
        await Roles.findByIdAndDelete(body._id);

        AuditLogger.info(req.user?.email, "Roles", "Delete", {id:body._id});
        logger.info(req.user?.email, "Roles", "Delete", {id:body._id});

        res.json(Response.successResponse({success: true}));
    }   
    catch (error) {
        logger.error(req.user?.email, "Roles", "Delete", error);
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.get('/role_privileges', async function(req, res) {
    res.json(Response.successResponse(role_privileges));
});

module.exports = router;