/*!
 * Copyright (c) 2018-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {createAccount, login} from './helpers.js';
import delay from 'delay';
import {mockData} from './mockData.js';
import {SessionService} from '@bedrock/web-session';

const sessionService = new SessionService();

describe('sessionService API', () => {
  describe('unauthenticated request', () => {
    afterEach(async function() {
      await sessionService.logout();
    });
    it('should get session data with no account', async () => {
      let err;
      let data = null;
      try {
        data = await sessionService.get();
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(data);
      data.should.be.an('object');
      // an unauthenticated session has no data
      data.should.eql({});
    });
    it('should get the same session data with concurrent calls', async () => {
      let err;
      let data1;
      let data2;
      try {
        const promise = sessionService.get();
        data2 = await sessionService.get();
        data1 = await promise;
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(data1);
      should.exist(data2);
      data1.should.be.an('object');
      // an unauthenticated session has no data
      data1.should.eql({});
      data1.should.equal(data2);
    });
  }); // end unauthenticated request
  describe('authenticated request', () => {
    const {email, password} = mockData.accounts.alice;
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
    });
    it('should get session data with an account', async () => {
      let err = null;
      let data = null;
      try {
        data = await sessionService.get();
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(data);
      data.should.be.an('object');
      // an authenticated session data has an account
      data.should.have.keys(['account']);
      data.account.should.be.an('object');
      data.account.should.have.property('id');
      data.account.id.should.equal(account.id);
    });
    it('should logout a session', async () => {
      let err = null;
      let data = null;
      try {
        data = await sessionService.get();
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(data);
      data.should.be.an('object');
      // an authenticated session data has an account
      data.should.have.keys(['account']);
      data.account.should.be.an('object');
      data.account.should.have.property('id');
      data.account.id.should.equal(account.id);
      await sessionService.logout();
      data = await sessionService.get();
      // an unauthenticated session data is empty
      data.should.eql({});
    });
    it('should expire after 1 second', async function() {
      let err = null;
      let data = null;
      try {
        data = await sessionService.get();
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(data);
      data.should.be.an('object');
      // an authenticated session data has an account
      data.should.have.keys(['account']);
      data.account.should.be.an('object');
      data.account.should.have.property('id');
      data.account.id.should.equal(account.id);
      // wait at least 1 second to expire session
      await delay(1000);
      data = await sessionService.get();
      // an unauthenticated session data is empty
      data.should.eql({});
    });
    it('should refresh on get', async function() {
      let err = null;
      let data = null;
      try {
        data = await sessionService.get();
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(data);
      data.should.be.an('object');
      // an authenticated session data has an account
      data.should.have.keys(['account']);
      data.account.should.be.an('object');
      data.account.should.have.property('id');
      data.account.id.should.equal(account.id);
      // this will refresh 3 times over 1 seconds
      // demonstrating that the session remains authenticated
      // provided we refresh before the session times out after 1000 ms
      for(let i = 0; i < 4; i++) {
        await delay(250);
        data = await sessionService.get();
        // an authenticated session data has an account
        data.should.have.keys(['account']);
        data.account.should.be.an('object');
        data.account.should.have.property('id');
        data.account.id.should.equal(account.id);
      }
    });
  }); // end authenticated request
});
