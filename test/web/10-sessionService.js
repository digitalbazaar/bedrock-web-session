/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */

import delay from 'delay';
import {SessionService} from 'bedrock-web-session';
import {login, createAccount} from './helpers.js';
import mockData from './mock-data.js';

const sessionService = new SessionService();

describe('sessionService API', () => {
  describe('unauthenticated request', () => {
    afterEach(async function() {
      await sessionService.logout();
      // this helps cut down on test failures
      // by waiting for the last test to expire
      await delay(mockData.expectedTTL + 50);
    });
    it('should get a session with no account', async () => {
      let err;
      let session = null;
      try {
        session = await sessionService.get();
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      // an unauthenticated session has a ttl
      session.should.have.keys(['ttl']);
      session.ttl.should.be.a('number');
      session.ttl.should.equal(mockData.expectedTTL);
    });
  }); // end unauthenticated request
  describe('authenticated request', () => {
    const {email, password} = mockData.accounts.sessionService;
    let account = null;
    let totp = null;
    before(async function() {
      // ensure we are logged out before creating an account
      await sessionService.logout();
      ({account, totp} = await createAccount({email, password}));
    });
    beforeEach(async function() {
      await login({email, password, totp});
    });
    afterEach(async function() {
      await sessionService.logout();
      // this helps cut down on test failures
      // by waiting for the last test to expire
      await delay(mockData.expectedTTL + 50);
    });
    it('should get a session with an account', async () => {
      let err = null;
      let session = null;
      try {
        session = await sessionService.get();
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      // an authenticated session has an account
      session.should.have.keys(['ttl', 'account']);
      session.account.should.be.an('object');
      session.account.should.have.property('id');
      session.account.id.should.equal(account.id);
    });
    it('should logout a session', async () => {
      let err = null;
      let session = null;
      try {
        session = await sessionService.get();
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      // an authenticated session has an account
      session.should.have.keys(['ttl', 'account']);
      session.account.should.be.an('object');
      session.account.should.have.property('id');
      session.account.id.should.equal(account.id);
      await sessionService.logout();
      session = await sessionService.get();
      // an unauthenticated session has a ttl
      session.should.have.keys(['ttl']);
      session.ttl.should.be.a('number');
      session.ttl.should.equal(mockData.expectedTTL);
    });
    it('should expire after 1 second', async function() {
      let err = null;
      let session = null;
      try {
        session = await sessionService.get();
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      // an authenticated session has an account
      session.should.have.keys(['ttl', 'account']);
      session.account.should.be.an('object');
      session.account.should.have.property('id');
      session.account.id.should.equal(account.id);
      // wait 2x the ttl for session expiration
      await delay(2 * mockData.expectedTTL);
      session = await sessionService.get();
      // an unauthenticated session has a ttl
      session.should.have.keys(['ttl']);
      session.ttl.should.be.a('number');
      session.ttl.should.equal(mockData.expectedTTL);
    });
    it('should refresh on get', async function() {
      let err = null;
      let session = null;
      try {
        session = await sessionService.get();
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      // an authenticated session has an account
      session.should.have.keys(['ttl', 'account']);
      session.account.should.be.an('object');
      session.account.should.have.property('id');
      session.account.id.should.equal(account.id);
      // this will refresh 4 times over 2 seconds
      // demonstrating that the session remains authenticated
      // provided we refresh before the session times out after 1000 ms
      for(let i = 0; i < 5; i++) {
        await delay(250);
        session = await sessionService.get();
        // an authenticated session has an account
        session.should.have.keys(['ttl', 'account']);
        session.account.should.be.an('object');
        session.account.should.have.property('id');
        session.account.id.should.equal(account.id);
        session.ttl.should.be.a('number');
        session.ttl.should.equal(mockData.expectedTTL);
      }
    });
  }); // end authenticated request
});
