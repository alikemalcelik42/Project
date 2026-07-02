const passport = require("passport");
const {ExtractJwt, Strategy} = require("passport-jwt");
const Users = require("../db/models/Users")

const config = require("../config")

module.exports = function() {
    let strategy = new Strategy({
        secretOrKey: config.JWT.SECRET,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    }, async (payload, done) => {
        let user = await Users.findById(payload._id);

        if(user) {

        } else {

        }
    }
);
}