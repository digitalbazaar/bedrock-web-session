/*!
 * Copyright (c) 2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

// const {constants} = require('security-context');

const mocks = {};
module.exports = mocks;

// this should match the value in test.config.js
// config.express.session.ttl
mocks.expectedTTL = 1000;

mocks.accounts = {
  sessionService: {
    email: 'session-service@example.com',
    password: 'Test0123456789!!!'
  },
  session: {
    email: 'session@example.com',
    password: 'Test0123456789!!!'
  }
};
