'use strict';

const express = require('express');
const passport = require('passport');
const router = express.Router();
const models = require('../models');

/**
 * POST /partner
 */
router.post('/', (req, res) => {
  if (!req.isAuthenticated()) { return res.sendStatus(401); }

  models.Agent.findById(req.user._id).then(agent => {
    const partner = new models.Partner(req.body);
    agent.partners.unshift(partner);
    agent.save().then(results => {
      req.flash('success', `Added ${partner.name} to prayer chain`);
      res.redirect('/partner/' + partner._id);
    }).catch(err => {
      for (const key in err.errors) {
        req.flash('error', err.errors[key].message);
      }
      res.redirect('/');     
    });
  }).catch(err => {
    res.status(400).send(err);
  });
});


/**
 * GET /partner/:id
 */
router.get('/:id', (req, res) => {
  if (!req.isAuthenticated()) { 
    req.flash('info', 'Login first');
    return res.redirect('/');
  }

  const partner = req.user.partners.find(partner => partner._id.toString() === req.params.id);

  if (!partner) {
    req.flash('error', 'That partner does not exist');
    return res.redirect('/');
  }

  res.render('partner/show', { agent: req.user,
                               partner: partner,
                               modesOfThanks: models.ThankYou.schema.path('mode').enumValues,
                               messages: req.flash() });
});


/**
 * GET /partner/:id/edit
 */
router.get('/:id/edit', (req, res) => {
  if (!req.isAuthenticated()) { 
    req.flash('info', 'Login first');
    return res.redirect('/');
  }

  const partner = req.user.partners.find(partner => partner._id.toString() === req.params.id);

  if (!partner) {
    req.flash('error', 'You have no such partner');
    return res.redirect('/');
  }

  res.render('partner/edit', { agent: req.user,
                               partner: partner,
                               messages: req.flash() });
});

/**
 * PUT /partner/:id
 */
router.put('/:id', (req, res) => {
  if (!req.isAuthenticated()) { 
    req.flash('info', 'Login first');
    return res.redirect('/');
  }

  const partner = req.user.partners.find(partner => partner._id.toString() === req.params.id);

  if (!partner) {
    req.flash('error', 'You are unauthorized');
    return res.status(401).send('You are unauthorized');
  }

  for (const param in req.body) {
    if (req.body[param].trim()) {
      partner[param] = req.body[param];
    }
  }

  req.user.save(req.body).then(results => {
    req.flash('success', 'Update successful');
    res.redirect(`/partner/${partner._id}`);
  }).catch(err => {
    let messages = { error: [] };
    for (const msg in err.errors) {
      messages.error.push(err.errors[msg]);
    }
    res.render('partner/edit', { agent: req.user,
                                 partner: partner,
                                 messages: messages });
  });
});

module.exports = router;
