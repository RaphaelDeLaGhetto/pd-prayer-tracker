'use strict';

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

exports.Partner = {
  horst: {
    _id: new ObjectId(),
    email: 'horst@example.com',
    name: 'Pastor Horst',
    notes: [{ text: 'Note 1' }, { text: 'Note 2' }, { text: 'Note 3' }, { text: 'Note 4' }],
    prayers: [{ text: 'Prayer 1' }, { text: 'Prayer 2' }, { text: 'Prayer 3' }, { text: 'Prayer 4' }]
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
