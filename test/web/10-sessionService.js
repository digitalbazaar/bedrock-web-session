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
      // an unauthenticated session has no data
      session.should.eql({});
    });
  }); // end unauthenticated request
  describe('authenticated request', () => {
    let account, totp, email, password = null;
    before(async function() {
      ({account, totp, email, password} = await createAccount(
        mockData.accounts.sessionService));
    });
    beforeEach(async function() {
      await login({email, password, totp});
    });
    afterEach(async function() {
      await sessionService.logout();
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
      const keys = Object.keys(session);
      // an authenticated session has data
      keys.should.eql(['account']);
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
      const keys = Object.keys(session);
      // an authenticated session has data
      keys.should.eql(['account']);
      session.account.should.be.an('object');
      session.account.should.have.property('id');
      session.account.id.should.equal(account.id);
      await sessionService.logout();
      session = await sessionService.get();
      // an unauthenticated session has no data
      session.should.eql({});
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
      const keys = Object.keys(session);
      // an authenticated session has data
      keys.should.eql(['account']);
      session.account.should.be.an('object');
      session.account.should.have.property('id');
      session.account.id.should.equal(account.id);
      await delay(2000);
      session = await sessionService.get();
      // an unauthenticated session has no data
      session.should.eql({});
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
      let keys = Object.keys(session);
      // an authenticated session has data
      keys.should.eql(['account']);
      session.account.should.be.an('object');
      session.account.should.have.property('id');
      session.account.id.should.equal(account.id);
      // this will refresh 4 times over 2 seconds
      // demonstrating that the session remains authenticated
      // provided we refresh before the session times out after 1000 ms
      for(let i = 0; i < 5; i++) {
        await delay(250);
        session = await sessionService.get();
        keys = Object.keys(session);
        // an authenticated session has data
        keys.should.eql(['account']);
        session.account.should.be.an('object');
        session.account.should.have.property('id');
        session.account.id.should.equal(account.id);
      }
    });
  }); // end authenticated request
});
