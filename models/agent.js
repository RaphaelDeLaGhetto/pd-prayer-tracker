'use strict';

const bcrypt = require('bcrypt-nodejs');
const findOrCreate = require('mongoose-findorcreate');
const uniqueValidator = require('mongoose-unique-validator');

module.exports = function(mongoose) {
  const Partner = require('./partner')(mongoose);

  const Schema = mongoose.Schema;
  const Types = Schema.Types;

  const AgentSchema = new Schema({
    email: {
      type: Types.String,
      trim: true,
      required: [true, 'No email supplied'],
      unique: [true, 'That email is taken'],
      empty: [false, 'No email supplied'],
    },
    password: {
      type: Types.String,
      trim: true,
      required: [true, 'No password supplied'],
      empty: [false, 'No password supplied'],
    },
    name: {
      type: Types.String,
      trim: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    partners: {
      type: [Partner],
      validate: {
        validator: function(newPartners) {
          for (let newPartner of newPartners) {
            for (let partner of this.partners) {
              if ((partner._id !== newPartner._id) && (partner.email === newPartner.email)) {
                return false;
              }
            }
          }
          return true;
        },
        message: props => `You already have a partner with email: ${props.value[0].email}`
      }
    },
  }, {
      timestamps: true
  });

  AgentSchema.pre('save', function(next) {
    var agent = this;

    // Only hash the password if it has been modified (or is new)
    if (!agent.isModified('password')) return next();

    // Generate a salt
    bcrypt.genSalt(10, function(err, salt) {
      if (err) return next(err);
      // Hash the password using our new salt
      bcrypt.hash(agent.password, salt, null, function(err, hash) {
        if (err) return next(err);
        // Override the cleartext password with the hashed one
        agent.password = hash;
        next();
      });
    });
  });

  AgentSchema.statics.validPassword = function(password, hash, done, agent) {
    bcrypt.compare(password, hash, (err, isMatch) => {
      if (err) {
        console.log(err);
      }

      if (isMatch) {
        return done(null, agent);
      }
       else {
        return done(null, false);
      }
    });
  };

  AgentSchema.plugin(findOrCreate);
  AgentSchema.plugin(uniqueValidator, { message: 'That {PATH} is taken' });

  return AgentSchema;
};
