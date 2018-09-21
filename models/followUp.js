'use strict';

module.exports = function(mongoose) {
  const Schema = mongoose.Schema;
  require('mongoose-currency').loadType(mongoose);
  const Types = Schema.Types;

  const FollowUpSchema = new Schema({
    date: {
      type: Types.Date,
      default: Date.now
    },
    dateOfReply: {
      type: Types.Date
    },
    replyResult: Types.String,
    notes: [new Schema({ text: Types.String}, { timestamps: true })],
    mode: {
      type: Types.String,
      enum: {
        values: ['Email', 'Snail Mail', 'In Person', 'Phone'],
        message: "Unknown mode of requesting an followUp: '{VALUE}'"
      },
      trim: true,
      required: [true, 'No mode of requesting an followUp supplied']
    },
  }, {
    timestamps: true
  });

  return FollowUpSchema;
};
