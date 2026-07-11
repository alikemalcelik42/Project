const mongoose = require('mongoose');
const RolePrivileges = require('./RolePrivileges');
const UserRoles = require('./UserRoles');

const schema = new mongoose.Schema({
  role_name: {
    type: String,
    required: true,
    unique: true,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    // required: true,
  }

},{
    versionKey: false,
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'    
    }
});

class Roles extends mongoose.Model {

  static async findByIdAndDelete(id) {
    await super.findByIdAndDelete(id);
    if (id)
      await RolePrivileges.deleteMany({ role_id: id });
      await UserRoles.deleteMany({ role_id: id });
  }
}

schema.loadClass(Roles);
module.exports = mongoose.model('roles', schema);