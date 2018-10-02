'use strict';

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

exports.Partner = {
  horst: {
    _id: new ObjectId(),
    email: 'horst@example.com',
    name: 'Pastor Horst',
  },
  ben: {
    _id: new ObjectId(),
    email: 'ben@example.com',
    name: 'Benny S',
  },
  vincent: {
    _id: new ObjectId(),
    email: 'vincent@example.com',
    name: 'Vinny E',
  }
};
