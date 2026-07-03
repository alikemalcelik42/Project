var express = require('express');
var router = express.Router();
const Users = require('../db/models/Users');
const UserRoles = require('../db/models/UserRoles');
const Roles = require('../db/models/Roles');
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const Enum = require('../config/Enum');
const bcrypt = require('bcrypt-nodejs');
const is = require('is_js');
const mongoose = require('mongoose');
const config = require("../config")
const jwt = require("jwt-simple");

router.get('/', async function(req, res) {

    try {
        let users = await Users.find({});
        res.json(Response.successResponse(users));
    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/add', async function(req, res) {
    let body = req.body;
    try {
        let findedUser = await Users.findOne({});
        if(!findedUser) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "No user found. You must use first add method."));
            return res.status(errorResponse.code).json(errorResponse);
        }
        if (!body.email) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "email is required"));
            return res.status(errorResponse.code).json(errorResponse);
        }
        else if (!body.password) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "password is required"));
            return res.status(errorResponse.code).json(errorResponse);
        }
        else if (!body.first_name) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "first_name is required"));
            return res.status(errorResponse.code).json(errorResponse);
        }
        else if (!body.last_name) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "last_name is required"));
            return res.status(errorResponse.code).json(errorResponse);
        }
        else if(!body.roles || !Array.isArray(body.roles) || body.roles.length == 0) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "roles is required"));
            return res.status(errorResponse.code).json(errorResponse);
        }
        
        if (is.not.email(body.email)) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "email is not valid"));
            return res.status(errorResponse.code).json(errorResponse);
        }

        let existingUser = await Users.findOne({ email: body.email });
        if (existingUser) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.CONFLICT, "Conflict", "A user with the same email already exists"));
            return res.status(errorResponse.code).json(errorResponse);
        }

        let hashedPassword = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8, null));

        let user = new Users({
            email: body.email,
            first_name: body.first_name,
            last_name: body.last_name,
            password: hashedPassword,
            is_active: true,
            rank: body.rank || 0
        });

        let roles = await Roles.find({_id: { $in: body.roles }})

        if(roles.length == 0) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Rol id not matched"));
            return res.status(errorResponse.code).json(errorResponse);
        }
        
        await user.save();

        for(let role of roles) {
          await UserRoles.create({
            role_id: role._id,
            user_id: user._id
          });
        }

        res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse({success: true}));
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

        let existingUser = await Users.findById(body._id);
        if (!existingUser) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "This user don't exits"));
            return res.status(errorResponse.code).json(errorResponse);
        }

        if (is.not.email(body.email)) {
              let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "email is not valid"));
              return res.status(errorResponse.code).json(errorResponse);    
        }

        let updates = {}
        if(body.email) updates.email = body.email;
        if(body.first_name) updates.first_name = body.first_name;
        if(body.last_name) updates.last_name = body.last_name;
        if(body.password) updates.password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8, null));
        if(typeof body.is_active === "boolean") updates.is_active = body.is_active;
        if(body.rank) updates.rank = body.rank;

        if(body.roles && Array.isArray(body.roles) && body.roles.length != 0) {
          let updatedRoles = await Roles.find({_id: { $in: body.roles }});

          if(updatedRoles.length == 0) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Rol id not matched"));
            return res.status(errorResponse.code).json(errorResponse);
          }

          let userRoles = await UserRoles.find({ user_id: body._id });  

          let removedRoles = await userRoles.filter(r => !body.roles.includes(r.role_id));
          
          let newRoles = await body.roles.filter(x => !userRoles.map(r => r.role_id).includes(x));
          
          if(removedRoles.length > 0) {
              let removedRolesIds = removedRoles.map(r => r._id);
              await UserRoles.deleteMany({ _id: { $in: removedRolesIds } });
          }
  
          if(newRoles.length > 0) {
              for (let role of newRoles) {
                  let userRole = new UserRoles({
                    role_id: role.id,
                    user_id: body._id
                  });
                  await userRole.save();
              }
          }
        }
        
        await Users.findByIdAndUpdate(body._id, updates, { new: true });

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

    if (!mongoose.Types.ObjectId.isValid(body._id)) {
        let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "_id is not valid"));
        return res.status(errorResponse.code).json(errorResponse);
    }

    try {

        await UserRoles.deleteMany({ user_id: body._id });
        await Users.findByIdAndDelete(body._id);
        res.json(Response.successResponse({success: true}));
    }   
    catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/firstadd', async function(req, res) {

    let findedUser = await Users.findOne({});
    if(findedUser) {
        let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.CONFLICT, "Conflict", "A user already exists. First-time add is disabled."));
        return res.status(errorResponse.code).json(errorResponse);
    }

    let body = req.body;
    try {
        if (!body.email) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "email is required"));
            return res.status(errorResponse.code).json(errorResponse);
        }
        else if (!body.password) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "password is required"));
            return res.status(errorResponse.code).json(errorResponse);
        }
        else if (!body.first_name) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "first_name is required"));
            return res.status(errorResponse.code).json(errorResponse);
        }
        else if (!body.last_name) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "last_name is required"));
            return res.status(errorResponse.code).json(errorResponse);
        }
        
        if (is.not.email(body.email)) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "email is not valid"));
            return res.status(errorResponse.code).json(errorResponse);
        }

        let existingUser = await Users.findOne({ email: body.email });
        if (existingUser) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.CONFLICT, "Conflict", "A user with the same email already exists"));
            return res.status(errorResponse.code).json(errorResponse);
        }

        let hashedPassword = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8, null));

        let user = new Users({
            email: body.email,
            first_name: body.first_name,
            last_name: body.last_name,
            password: hashedPassword,
            is_active: true,
            rank: body.rank || 0
        });


        let role = await Roles.create({
            role_name: Enum.SUPER_ADMIN,
            created_by: user._id
        });

        await UserRoles.create({
            user_id: user._id,
            role_id: role._id,
        });

        await user.save();
        res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse({success: true}));
    }
    catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);    
    }   
});

router.post("/auth", async function (req, res) {
    try {
        let { email, password } = req.body;
        Users.validateFieldsBeforeAuth(email, password);

        let user = await Users.findOne({email: email});
        if(!user) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "Validation Error", "Email or password wrong");

        if(!user.validatePassword(password)) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "Validation Error", "Password wrong");

        let payload = {
            id: user._id,
            exp: parseInt(Date.now() / 1000) + config.JWT.EXPIRE_TIME
        }

        let token = jwt.encode(payload, config.JWT.SECRET);

        let userData = {
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name
        }

        res.json(Response.successResponse({token, user: userData}));
    } catch(error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse); 
    }

});


module.exports = router;