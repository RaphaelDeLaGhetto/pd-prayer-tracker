'use strict';

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

exports.Partner = {
  horst: {
    _id: new ObjectId(),
    email: 'horst@example.com',
    name: 'Pastor Horst',
  }
};
