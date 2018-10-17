'use strict';

const express = require('express');
const passport = require('passport');
const router = express.Router({ mergeParams: true });
const models = require('../models');

/**
 * GET /prayer
 */
router.get('/', (req, res) => {
  if (!req.isAuthenticated()) { 
    req.flash('info', 'Login first');
    return res.redirect('/');
  }

  res.render('prayer/index', { agent: req.user, messages: req.flash() });
});

/**
 * POST /prayer
 */
router.post('/', (req, res) => {
  if (!req.isAuthenticated()) { 
    return res.status(403).send();
  }

  res.render('prayer/index', { agent: req.user, messages: req.flash() });
});


module.exports = router;
