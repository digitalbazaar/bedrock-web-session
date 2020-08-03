/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */

import {SessionService} from 'bedrock-web-session';
import {login, createAccount} from './helpers.js';
import mockData from './mock-data.js';

const sessionService = new SessionService();
// import mockData from './mock-data.js';

describe('sessionService API', () => {
  describe('get API', () => {
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
      let session, account = null;
      before(async function() {
        const results = await createAccount(mockData.accounts.sessionService);
        account = results.account;
        await login(results);
      });
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
        // an unauthenticated session has data
        keys.should.deep.equal(['account']);
        session.account.should.be.an('object');
        session.account.should.have.property('id');
        session.account.id.should.equal(account.id);
      });
    }); // end unauthenticated request
  }); // end get
});
