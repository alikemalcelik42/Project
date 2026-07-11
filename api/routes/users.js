var express = require('express');
var router = express.Router();
const Users = require('../db/models/Users');
const UserRoles = require('../db/models/UserRoles');
const Roles = require('../db/models/Roles');
const RolePrivileges = require('../db/models/RolePrivileges');
const privs = require("../config/role_privileges");
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const Enum = require('../config/Enum');
const bcrypt = require('bcrypt-nodejs');
const is = require('is_js');
const mongoose = require('mongoose');
const config = require("../config")
const jwt = require("jwt-simple");
const auth = require("../lib/auth");
const AuditLogger = require("../lib/AuditLogger");
const logger = require("../lib/logger/LoggerClass");
const { rateLimit } = require('express-rate-limit');
const RateLimitMongo = require("rate-limit-mongo");

const limiter = rateLimit({
    store: new RateLimitMongo({
        uri: config.CONNECTION_STRING,
        collectionName: "rateLimits",
        expireTimeMs: 1 * 60 * 1000,
    }),
	windowMs: 1 * 60 * 1000,
	limit: 5,
	legacyHeaders: false,
	ipv6Subnet: 56,
    handler: (req, res, next, options) => {
		let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.TOO_MANY_REQUESTS, "Too Many Requests", "Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin."));
		res.status(errorResponse.code).json(errorResponse);
	}
})

router.post('/firstadd', async function(req, res) {

    let findedUser = await Users.findOne({});
    if(findedUser) {
        let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.CONFLICT, "Conflict", "Zaten en az bir tane kullanıcı var. Bu servis aktif değil."));
        return res.status(errorResponse.code).json(errorResponse);
    }

    let body = req.body;
    try {
        if (!body.email) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Email gerekli."));
            return res.status(errorResponse.code).json(errorResponse);
        }
        else if (!body.password) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Şifre gerekli."));
            return res.status(errorResponse.code).json(errorResponse);
        }
        else if (!body.first_name) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "İsim gerekli."));
            return res.status(errorResponse.code).json(errorResponse);
        }
        else if (!body.last_name) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Soy isim gerekli."));
            return res.status(errorResponse.code).json(errorResponse);
        }
        
        if (is.not.email(body.email)) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Email doğru formatta değil"));
            return res.status(errorResponse.code).json(errorResponse);
        }

        if(body.password.length < Enum.PASS_LENGTH) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Şifre en az " + Enum.PASS_LENGTH + " uzunluğunda olmalı."));
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

        let permissions = privs.privileges.map(p => p.key);

        for (let permission of permissions) {
            let priv = new RolePrivileges({
                role_id: role._id,
                permission: permission,
                created_by: user._id
            });
            await priv.save();
        }

        await user.save();

        AuditLogger.info(body.email, "Users", "FirstAdd", user);
        logger.info(body.email, "Users", "FirstAdd", user);

        res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse({success: true}));
    }
    catch (error) {
        logger.error(body?.email, "Users", "FirstAdd", error);
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);    
    }   
});

router.post("/auth", limiter, async function (req, res) {
    try {
        let { email, password } = req.body;
        Users.validateFieldsBeforeAuth(email, password);

        let user = await Users.findOne({email: email}).select('+password');
        if(!user) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "Validation Error", "Bu emaile sahip kullanıcı yok.");

        if(!user.validatePassword(password)) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "Validation Error", "Şifre hatalı.");

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
        logger.error(req.body?.email, "Users", "Auth", error);
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse); 
    }

});

router.all("*", auth().authenticate(), (req, res, next) => {
    next();
});

router.get('/', auth().checkRoles("user_view"), async function(req, res) {

    try {
        let users = await Users.find({}).lean();
        for(let i=0;i<users.length;i++) {
            let userRoles = await UserRoles.find({user_id: users[i]._id}).lean();
            let roles = [];
            for(let userRole of userRoles) {
                let role = await Roles.findById(userRole.role_id).lean();
                roles.push(role);
            }

            for(let i=0;i<roles.length;i++) {
                let permissions = await RolePrivileges.find({role_id: roles[i]._id});
                roles[i].permissions = permissions;
            }

            users[i].roles = roles;
        }
        res.json(Response.successResponse(users));
    } catch (error) {
        logger.error(req.user?.email, "Users", "View", error);
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.get('/find/:id', auth().checkRoles("user_view"), async function(req, res) {

    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Id değeri geçersiz"));
            return res.status(errorResponse.code).json(errorResponse);
        }

        let user = await Users.findById(req.params.id);

        if(!user) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Bu id değerine sahip kullanıcı bulunmuyor"));
            return res.status(errorResponse.code).json(errorResponse);
        }

        let userRoles = await UserRoles.find({user_id: user._id}).lean();
        let roles = [];
        for(let userRole of userRoles) {
            let role = await Roles.findById(userRole.role_id).lean();
            roles.push(role);
        }

        for(let i=0;i<roles.length;i++) {
            let permissions = await RolePrivileges.find({role_id: roles[i]._id});
            roles[i].permissions = permissions;
        }

        user.roles = roles;

        res.json(Response.successResponse(user));
    } catch (error) {
        logger.error(req.user?.email, "Users", "View", error);
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/add', auth().checkRoles("user_add"), async function(req, res) {
    let body = req.body;
    try {
        let findedUser = await Users.findOne({});
        if(!findedUser) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Hiç kullanıcı yok. İlk kullanıcı eklenmeli."));
            return res.status(errorResponse.code).json(errorResponse);
        }
        if (!body.email) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Email gerekli."));
            return res.status(errorResponse.code).json(errorResponse);
        }
        else if (!body.password) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Şifre gerekli."));
            return res.status(errorResponse.code).json(errorResponse);
        }
        else if (!body.first_name) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "İsim gerekli."));
            return res.status(errorResponse.code).json(errorResponse);
        }
        else if (!body.last_name) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Soy isim gerekli."));
            return res.status(errorResponse.code).json(errorResponse);
        }
        else if(!body.roles || !Array.isArray(body.roles) || body.roles.length == 0) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Roller gerekli."));
            return res.status(errorResponse.code).json(errorResponse);
        }
        
        if (is.not.email(body.email)) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Email doğru formatta değil."));
            return res.status(errorResponse.code).json(errorResponse);
        }
        if(body.password.length < Enum.PASS_LENGTH) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Şifre en az " + Enum.PASS_LENGTH + " uzunluğunda olmalı."));
            return res.status(errorResponse.code).json(errorResponse);
        }

        let existingUser = await Users.findOne({ email: body.email });
        if (existingUser) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.CONFLICT, "Conflict", "Aynı email ile bir kullanıcı zaten bulunuyor."));
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
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Rol id eşleşmedi."));
            return res.status(errorResponse.code).json(errorResponse);
        }
        
        await user.save();

        for(let role of roles) {
          await UserRoles.create({
            role_id: role._id,
            user_id: user._id
          });
        }

        AuditLogger.info(req.user?.email, "Users", "Add", user);
        logger.info(req.user?.email, "Users", "Add", user);

        res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse({success: true}));
    }
    catch (error) {
        logger.error(req.user?.email, "Users", "Add", error);
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);    
    }   
});

router.post('/update', auth().checkRoles("user_update"), async function(req, res) {
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

        let existingUser = await Users.findById(body._id);
        if (!existingUser) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Bu kullanıcı bulunamadı."));
            return res.status(errorResponse.code).json(errorResponse);
        }

        if (body.email && is.not.email(body.email)) {
              let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Email doğru formatta değil."));
              return res.status(errorResponse.code).json(errorResponse);    
        }

        if (body.password && body.password.length < Enum.PASS_LENGTH) {
              let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Şifre en az " + Enum.PASS_LENGTH + " uzunluğunda olmalı."));
              return res.status(errorResponse.code).json(errorResponse);
        }

        let updates = {}
        if(body.email) updates.email = body.email;
        if(body.first_name) updates.first_name = body.first_name;
        if(body.last_name) updates.last_name = body.last_name;
        if(body.password) updates.password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8, null));
        if(typeof body.is_active === "boolean") updates.is_active = body.is_active;
        if(typeof body.rank === "number") updates.rank = body.rank;

        if(body.roles && Array.isArray(body.roles) && body.roles.length != 0) {
          let updatedRoles = await Roles.find({_id: { $in: body.roles }});

          if(updatedRoles.length == 0) {
            let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "Rol id eşleşmedi."));
            return res.status(errorResponse.code).json(errorResponse);
          }

          let userRoles = await UserRoles.find({ user_id: body._id });

          if(req.user.id === body.id) {
            body.roles = userRoles;
          }

          let removedRoles = await userRoles.filter(r => !body.roles.includes(r.role_id.toString()));
          
          let newRolesIds = await body.roles.filter(x => !userRoles.map(r => r.role_id.toString()).includes(x));
          
          if(removedRoles.length > 0) {
              let removedRolesIds = removedRoles.map(r => r._id);
              await UserRoles.deleteMany({ _id: { $in: removedRolesIds } });
          }
  
          if(newRolesIds.length > 0) {
              for (let roleId of newRolesIds) {
                  let userRole = new UserRoles({
                    role_id: roleId,
                    user_id: body._id
                  });
                  await userRole.save();
              }
          }
        }
        
        await Users.findByIdAndUpdate(body._id, updates, { new: true });

        AuditLogger.info(req.user?.email, "Users", "Update", {id:body._id, updates:updates});
        logger.info(req.user?.email, "Users", "Update", {id:body._id, updates:updates});

        res.json(Response.successResponse({success: true}));
    } catch (error) {
        logger.error(req.user?.email, "Users", "Update", error);
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/delete', auth().checkRoles("user_delete"), async function(req, res) {
    let body = req.body;
    if (!body._id) {
        let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "_id gerekli."));
        return res.status(errorResponse.code).json(errorResponse);
    }

    if (!mongoose.Types.ObjectId.isValid(body._id)) {
        let errorResponse = Response.errorResponse(new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Bad Request", "_id doğru fromatta değil."));
        return res.status(errorResponse.code).json(errorResponse);
    }

    try {

        await UserRoles.deleteMany({ user_id: body._id });
        await Users.findByIdAndDelete(body._id);

        AuditLogger.info(req.user?.email, "Users", "Delete", {id:body._id});
        logger.info(req.user?.email, "Users", "Delete", {id:body._id});

        res.json(Response.successResponse({success: true}));
    }   
    catch (error) {
        logger.error(req.user?.email, "Users", "Delete", error);
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});


module.exports = router;