'use strict';

module.exports = function(mongoose) {
  const Schema = mongoose.Schema;
  require('mongoose-currency').loadType(mongoose);
  const Types = Schema.Types;

  const DonationSchema = new Schema({
    date: {
      type: Types.Date,
      default: Date.now
    },
    amount: {
      type: Types.Currency,
      required: [true, 'No donation amount supplied']
    },
  }, {
    timestamps: true
  });

  /**
   * Get formatted currency string
   */
  DonationSchema.methods.formatAmount = function() {
    return (this.amount / 100).toFixed(2);
  };

  return DonationSchema;
};
