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

  const partner = req.user.partners.find(partner => partner._id.toString() === req.params.partnerId);

  if (!partner) {
    req.flash('error', 'You have no such partner');
    return res.redirect('/');
  }

  res.render('prayer/index', { agent: req.user, partner: partner, messages: req.flash() });
});

/**
 * POST /prayer
 */
router.post('/', (req, res) => {
  if (!req.isAuthenticated()) { 
    return res.status(403).send();
  }

  const partner = req.user.partners.find(partner => partner._id.toString() === req.params.partnerId);
  partner.prayers.unshift(req.body);

  req.user.save().then(results => {
    req.flash('success', `Prayer added`);
    res.redirect(`/partner/${partner._id}/prayer`);
  }).catch(err => {
    partner.prayers.shift();
    for (const key in err.errors) {
      req.flash('error', err.errors[key].message);
    }
    res.render('prayer/index', { agent: req.user, partner: partner, messages: req.flash() });
  });
});

module.exports = router;
