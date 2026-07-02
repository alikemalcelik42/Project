const mongoose = require('mongoose');

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

}

schema.loadClass(Users);
module.exports = mongoose.model('users', schema);