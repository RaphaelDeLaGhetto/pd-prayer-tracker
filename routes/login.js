'use strict';

const express = require('express');
const passport = require('passport');
const router = express.Router();

router.post('/', passport.authenticate('local', {
                      successRedirect : '/',
                      successFlash : true,
                      failureRedirect : '/',
                      failureFlash : true 
                  }), (req, res) => {

  res.redirect('/');
});

module.exports = router;
