/*!
 * Copyright (c) 2018-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {createSession, session, _setSession} from 'bedrock-web-session';
import delay from 'delay';
import {login, logout, createAccount} from './helpers.js';
import {mockData} from './mockData.js';

describe('session API', () => {
  describe('unauthenticated request', () => {
    beforeEach(function() {
      _setSession({newSession: null});
    });
    afterEach(async function() {
      await logout();
    });
    it('should create the session singleton', async () => {
      let err;
      let s;
      try {
        s = await createSession();
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(s);
      should.exist(session);
      session.should.equal(s);
      session.should.be.an('object');
      session.should.have.keys(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      // an unauthenticated session has no data
      session.data.should.eql({});
    });
  }); // end unauthenticated request

  describe('authenticated request', () => {
    const {email, password} = mockData.accounts.bob;
    let account = null;
    let totp = null;
    before(async function() {
      await logout();
      ({account, totp} = await createAccount({email, password}));
    });
    beforeEach(async function() {
      _setSession({newSession: null});
      await createSession();
      await login({email, password, totp});
      await session.refresh();
    });
    afterEach(async function() {
      await logout();
    });
    it('should confirm session has account data', async () => {
      session.should.be.an('object');
      session.should.have.keys(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      // an authenticated session has account data
      session.data.should.have.keys(['account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
    });
    it('should end a session', async () => {
      session.should.be.an('object');
      session.should.have.keys(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      session.data.should.have.keys(['account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      should.exist(session.end);
      await session.end();
      session.should.have.keys(['data', '_service', '_eventTypeListeners']);
      // data should now be empty
      session.data.should.eql({});
    });
    it('should expire after 1 second', async function() {
      should.exist(session);
      session.should.be.an('object');
      session.should.have.keys(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      // an authenticated session has data
      session.data.should.have.keys(['account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      await delay(2000);
      await session.refresh();
      session.should.have.keys(['data', '_service', '_eventTypeListeners']);
      session.data.should.eql({});
    });
    it('should refresh', async function() {
      should.exist(session);
      session.should.be.an('object');
      session.should.have.keys(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      session.data.should.have.keys(['account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      // this will refresh 3 times over 1 second
      // demonstrating that the session remains authenticated
      // provided we refresh before the session timeout of 1000 ms
      for(let i = 0; i < 5; ++i) {
        await delay(250);
        await session.refresh();
        session.should.have.keys(['data', '_service', '_eventTypeListeners']);
        session.data.should.be.an('object');
        session.data.should.have.keys(['account']);
        session.data.account.should.be.an('object');
        session.data.account.should.have.property('id');
        session.data.account.id.should.equal(account.id);
      }
    });
    it('should emit change event on refresh when session expired', async () => {
      should.exist(session);
      session.should.be.an('object');
      session.should.have.keys(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      session.data.should.have.keys(['account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      let changed = false;
      const remove = session.on(
        'change', async ({oldEnded, oldData, newData}) => {
          should.exist(oldEnded);
          should.exist(oldData);
          should.exist(newData);
          oldData.should.not.eql(newData);
          // `oldEnded` is not set to true unless `end` is called; it is not
          // set when a session merely expires, other information in `data` will
          // need to be used to determine what behavior a `change` listener
          // will take
          oldEnded.should.eql(false);
          changed = true;
          remove();
        });
      await delay(2000);
      await session.refresh();
      session.should.have.keys(['data', '_service', '_eventTypeListeners']);
      // an unauthenticated session has no data
      session.data.should.eql({});
      // change listener should have been called
      changed.should.eql(true);
    });
    it('should emit change event on session.end', async function() {
      should.exist(session);
      session.should.be.an('object');
      session.should.have.keys(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      // an authenticated session has data
      session.data.should.have.keys(['account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      let changed = false;
      const remove = session.on(
        'change', async ({oldEnded, oldData, newData}) => {
          should.exist(oldEnded);
          should.exist(oldData);
          should.exist(newData);
          oldData.should.not.eql(newData);
          oldEnded.should.eql(true);
          changed = true;
          remove();
        });
      await session.end();
      session.should.have.keys(['data', '_service', '_eventTypeListeners']);
      // data should now be empty
      session.data.should.eql({});
      // change listener should have been called
      changed.should.eql(true);
    });
  }); // end authenticated request
});
