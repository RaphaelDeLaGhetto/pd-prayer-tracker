'use strict';

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const bcrypt = require('bcrypt-nodejs');
const partners = require('./partners').Partner;

exports.Agent = {
  danny: {
    _id: new ObjectId(),
    email: 'danny@example.com',
    password: 'secret',
    partners: [partners.horst]
  },
  manny: {
    _id: new ObjectId(),
    email: 'manny@example.com',
    password: 'topsecret',
    partners: [partners.horst, partners.ben, partners.vincent]
  },
  lanny: {
    _id: new ObjectId(),
    email: 'lanny@example.com',
    password: 'supersecret',
    partners: [partners.horst]
  }
};
