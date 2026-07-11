const mongoose = require('mongoose');
const {HTTP_CODES} = require("../../config/Enum");
const is = require("is_js");
const CustomError = require('../../lib/Error');
const bcrypt = require('bcrypt-nodejs');


const schema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    select: false
  },        
  is_active: {
    type: Boolean,
    default: true,
  },
  rank: {
    type: Number,
    default: 0,
  }
},{
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'    
    }
});

class Users extends mongoose.Model {
  static validateFieldsBeforeAuth(email, password) {
    if(typeof password !== "string" || is.not.email(email)) {
      throw new CustomError(HTTP_CODES.UNAUTHORIZED, "Validation Error", "Email or password wrong");
    }

    return null;
  }

  validatePassword(password) {
    return bcrypt.compareSync(password, this.password);
  }
}

schema.loadClass(Users);
module.exports = mongoose.model('users', schema);