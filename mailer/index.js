'use strict';

const nodemailer = require('nodemailer');
//const mockTransport;
//if (process.env.NODE_ENV !== 'production') {
//   mockTransport = require('nodemailer-mock-transport');
//}

module.exports = function() {
  let env = process.env.NODE_ENV || 'development';
  let transport;

  if (env == 'production') {
    transport = {
      service: 'gmail',
      auth: {
        user: process.env.FROM,
        pass: process.env.PASSWORD
      }
    };
  }
  else if (env == 'development') {
    transport = {
      port: 25,
      ignoreTLS: true
    };
  }
  else {
    transport = require('nodemailer-mock-transport')({
      foo: 'bar'
    });
  }

  const transporter = nodemailer.createTransport(transport);

 
  return { transporter: transporter, transport: transport };
}();
