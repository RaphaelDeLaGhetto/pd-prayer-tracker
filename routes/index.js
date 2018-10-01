'use strict';

const express = require('express');
const router = express.Router();
const Agent = require('../models').Agent;

/**
 * GET /
 */
router.get('/', (req, res, next) => {
  if (req.user) {
    Agent.findById(req.user._id).then((agent) => {
      res.render('index', { agent: agent, messages: req.flash() });
    }).catch((error) => {
      return res.sendStatus(501);         
    });
  } else {
    res.render('index', { title: 'Accountant', agent: null, messages: req.flash() });
  }
});

module.exports = router;
