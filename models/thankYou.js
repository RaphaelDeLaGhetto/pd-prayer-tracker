'use strict';

module.exports = function(mongoose) {
  const Schema = mongoose.Schema;
  const Types = Schema.Types;

  const ThankYouSchema = new Schema({
    date: {
      type: Types.Date,
      default: Date.now
    },
    mode: {
      type: Types.String,
      enum: {
        values: ['Email', 'Snail Mail', 'In Person', 'Phone'],
        message: "Unknown mode of expressing thanks: '{VALUE}'"
      },
      trim: true,
      required: [true, 'No mode of expressing thanks supplied']
    },
  }, {
    timestamps: true
  });

  /**
   * Get formatted currency string
   */
  ThankYouSchema.methods.formatAmount = function() {
    return (this.amount / 100).toFixed(2);
  };

  return ThankYouSchema;
};
