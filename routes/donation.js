'use strict';

const express = require('express');
const passport = require('passport');
const router = express.Router();
const models = require('../models');

/**
 * GET /donation
 */
router.get('/', (req, res) => {
  if (!req.isAuthenticated()) { 
    req.flash('info', 'Login first');
    return res.redirect('/');
  }

  res.render('donation/index', { agent: req.user, messages: req.flash() });
});

module.exports = router;
