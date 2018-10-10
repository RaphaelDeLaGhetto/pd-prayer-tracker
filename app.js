"use strict";
require('dotenv').config()

const express = require('express');
const path = require('path');
const models = require('./models');

const app = express();

/**
 * view engine setup
 */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/**
 * body-parser
 */
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * For PUT, PATCH, and DELETE
 */
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

/**
 * Flash
 */
const flash = require('connect-flash');
app.use(flash());

/**
 * Sessions
 */
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/config/config.json')[env];

const sessionConfig = {
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: false
};

if (env == 'production') {
  sessionConfig.store = new MongoStore({ mongooseConnection: models });
}

app.use(session(sessionConfig));

/**
 * Passport
 */
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({
    usernameField: 'email'
  },
  function(email, password, done) {
    models.Agent.findOne({ email: email }).then((agent) => {
      if (!agent) {
        return done(null, false, 'Login failed');
      }
      models.Agent.validPassword(password, agent.password, (err, res) => {
        if (err)  {
          return done(err);
        }
        if (!res) {
          return done(null, false, 'Login failed');
        }
        done(err, res, `Hello, ${agent.email}!`);
      }, agent);
    }).catch((err) => {
      return done(err);
    });
  }
));

passport.serializeUser((agent, done) => {
  done(null, agent.id);
});

passport.deserializeUser((id, done) => {
  models.Agent.findById(id, (err, agent) => {
    done(err, agent);
  });
});

/**
 * Routes
 */
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/index'));
app.use('/login', require('./routes/login'));
app.use('/logout', require('./routes/logout'));
app.use('/reset', require('./routes/reset'));
app.use('/partner', require('./routes/partner'));

/**
 * Start server
 */
let port = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'tor' ? 3000 : 3001;
app.listen(port, '0.0.0.0', () => {
  console.log('prayer-chain listening on ' + port + '!');
});

module.exports = app;
