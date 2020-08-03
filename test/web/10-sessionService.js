/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */

import {SessionService} from 'bedrock-web-session';
import {login, createAccount} from './helpers.js';
import mockData from './mock-data.js';

const sessionService = new SessionService();

describe('sessionService API', () => {
  describe('unauthenticated request', () => {
    let session;
    beforeEach(function() {
      session = null;
    });
    afterEach(async function() {
      await sessionService.logout();
    });
    it('should get a session', async () => {
      let err;
      try {
        session = await sessionService.get();
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      const keys = Object.keys(session);
      // an unauthenticated session has no data
      keys.should.deep.equal([]);
    });
  }); // end unauthenticated request
  describe('authenticated request', () => {
    let session, account, totp, email, password = null;
    before(async function() {
      ({account, totp, email, password} = await createAccount(
        mockData.accounts.sessionService));
    });
    beforeEach(async function() {
      session = null;
      await login({email, password, totp});
    });
    afterEach(async function() {
      await sessionService.logout();
    });
    it('should get a session', async () => {
      let err;
      try {
        session = await sessionService.get();
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      const keys = Object.keys(session);
      // an unauthenticated session has data
      keys.should.deep.equal(['account']);
      session.account.should.be.an('object');
      session.account.should.have.property('id');
      session.account.id.should.equal(account.id);
    });
    it('should logout a session', async () => {
      let err;
      try {
        session = await sessionService.get();
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      let keys = Object.keys(session);
      // an unauthenticated session has data
      keys.should.deep.equal(['account']);
      session.account.should.be.an('object');
      session.account.should.have.property('id');
      session.account.id.should.equal(account.id);
      await sessionService.logout();
      session = await sessionService.get();
      keys = Object.keys(session);
      // an unauthenticated session has no data
      keys.should.deep.equal([]);
    });
  }); // end unauthenticated request
});
