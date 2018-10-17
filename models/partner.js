'use strict';

const bcrypt = require('bcrypt-nodejs');
const findOrCreate = require('mongoose-findorcreate');
const uniqueValidator = require('mongoose-unique-validator');

module.exports = function(mongoose) {
  const Schema = mongoose.Schema;
  const Types = Schema.Types;

  const Donation = require('./donation')(mongoose);
  const ThankYou = require('./thankYou')(mongoose);

  /**
   * Partner
   */
  const PartnerSchema = new Schema({
    email: {
      type: Types.String,
      trim: true,
      required: [true, 'No email supplied'],
      empty: [false, 'No email supplied'],
    },
    name: {
      type: Types.String,
      trim: true,
      required: [true, 'No name supplied'],
      empty: [false, 'No name supplied'],
    },
    donations: [Donation],
    notes: [new Schema({ text: {
                           type: Types.String,
                           trim: true,
                           required: [true, 'No note text supplied'],
                           empty: [false, 'No note text supplied'] 
                         }
                       }, { timestamps: true })],
    prayers: [new Schema({ text: { 
                             type: Types.String,
                             trim: true,
                             required: [true, 'No prayer text supplied'],
                             empty: [false, 'No prayer text supplied'] 
                           }
                         }, { timestamps: true })],
    thankYous: [ThankYou]
  }, {
    timestamps: true
  });

  PartnerSchema.plugin(findOrCreate);
  PartnerSchema.plugin(uniqueValidator, { message: 'That {PATH} is taken' });

  return PartnerSchema;
};

