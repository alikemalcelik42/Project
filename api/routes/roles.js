var express = require('express');
var router = express.Router();
const Roles = require('../db/models/Roles');
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const Enum = require('../config/Enum');
const role_privileges = require('../config/role_privileges');
const RolePrivileges = require('../db/models/RolePrivileges');
const mongoose = require('mongoose');

router.get('/', async function(req, res) {

    try {
        let roles = await Roles.find({});
        res.json(Response.successResponse(roles));
    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/add', async function(req, res) {
    let body = req.body;
    try {
        if (!body.role_name) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "role_name is required"));
            return res.status(errorResponse.code).json(errorResponse);
        }

        if(!body.permissions || !Array.isArray(body.permissions) || body.permissions.length === 0) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "permissions is required and should be an array"));
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

        res.json(Response.successResponse({success: true}));
    }
    catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);    
    }   
});

router.post('/update', async function(req, res) {
    try{
        let body = req.body;

        if (!body._id) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "_id is required"));
            return res.status(errorResponse.code).json(errorResponse);
        }
        
        if (!mongoose.Types.ObjectId.isValid(body._id)) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "_id is not valid"));
            return res.status(errorResponse.code).json(errorResponse);
        }
        
        if(body.permissions && Array.isArray(body.permissions)) {

            let permissions = await RolePrivileges.find({ role_id: body._id });  
            
            let removedPermissions = await permissions.filter(p => !body.permissions.includes(p.permission));
            
            let newPermissions = await body.permissions.filter(x => !permissions.map(p => p.permission).includes(x));

            if(removedPermissions.length > 0) {
                let removedPermissionIds = removedPermissions.map(p => p._id);
                await RolePrivileges.deleteMany({ _id: { $in: removedPermissionIds } });
            }

            if(newPermissions.length > 0) {
                for (let permission of newPermissions) {
                    let priv = new RolePrivileges({
                        role_id: body._id,
                        permission: permission,
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
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "This role doesn't exist"));
            return res.status(errorResponse.code).json(errorResponse);
        }

        res.json(Response.successResponse({success: true}));
    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/delete', async function(req, res) {
    let body = req.body;
    if (!body._id) {
        let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "_id is required"));
        return res.status(errorResponse.code).json(errorResponse);
    }

    try {
        await Roles.findByIdAndDelete(body._id);
        res.json(Response.successResponse({success: true}));
    }   
    catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.get('/role_privileges', async function(req, res) {
    res.json(Response.successResponse(role_privileges));
});

module.exports = router;