'use strict';

module.exports = function(mongoose) {
  const Schema = mongoose.Schema;
  require('mongoose-currency').loadType(mongoose);
  const Types = Schema.Types;

  const FollowUp = require('./followUp')(mongoose);

  const AppointmentSchema = new Schema({
    dateOfRequest: {
      type: Types.Date,
      default: Date.now
    },
    followUpOn: {
      type: Types.Date,
      default: new Date(new Date().getTime() + 60000 * 60 * 24 * 9),
      validate: {
        validator: function(date) {
          return date > this.dateOfRequest; 
        },
        message: 'You are not a time traveller'
      }
    },
    dateOfReply: {
      type: Types.Date
    },
    replyResult: Types.String,
    notes: [new Schema({ text: Types.String}, { timestamps: true })],
    requestMode: {
      type: Types.String,
      enum: {
        values: ['Email', 'Snail Mail', 'In Person', 'Phone'],
        message: "Unknown mode of requesting an appointment: '{VALUE}'"
      },
      trim: true,
      required: [true, 'No mode of requesting an appointment supplied']
    },
    followUps: [FollowUp]
  }, {
    timestamps: true
  });

  return AppointmentSchema;
};
