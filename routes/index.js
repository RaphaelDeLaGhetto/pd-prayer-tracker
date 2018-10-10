'use strict';

const express = require('express');
const router = express.Router();
const Agent = require('../models').Agent;

/**
 * GET /
 */
router.get('/', (req, res, next) => {
  res.render('index', { agent: req.user, messages: req.flash() });
});

module.exports = router;
