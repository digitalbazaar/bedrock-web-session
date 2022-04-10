/*!
 * Copyright (c) 2018-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {createSession, session, _setSession} from '@bedrock/web-session';
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
    it('should detect double creation of the session singleton', async () => {
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

      s = null;
      try {
        s = await createSession();
      } catch(e) {
        err = e;
      }
      should.exist(err);
      should.not.exist(s);
      err.message.should.equal('Session singleton already created.');
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
      for(let i = 0; i < 4; ++i) {
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
      let changed = 0;
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
          changed++;
        });
      await delay(2000);
      await session.refresh();
      session.should.have.keys(['data', '_service', '_eventTypeListeners']);
      // an unauthenticated session has no data
      session.data.should.eql({});
      // change listener should have been called once
      changed.should.eql(1);
      remove();
    });
    it('should emit change event twice and end session on error', async () => {
      should.exist(session);
      session.should.be.an('object');
      session.should.have.keys(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      session.data.should.have.keys(['account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      let changed = 0;
      const remove = session.on(
        'change', async ({oldEnded, oldData, newData}) => {
          changed++;
          should.exist(oldEnded);
          should.exist(oldData);
          should.exist(newData);
          if(changed === 1) {
            oldData.should.not.eql(newData);
            oldEnded.should.eql(false);
            throw new Error('change listener error');
          } else {
            // should be ending on the second call due to the error from the
            // first
            oldEnded.should.eql(true);
          }
        });
      await delay(2000);
      let err;
      try {
        await session.refresh();
      } catch(e) {
        err = e;
      }
      should.exist(err);
      err.message.should.eql('change listener error');
      session.should.have.keys(['data', '_service', '_eventTypeListeners']);
      // an unauthenticated session has no data
      session.data.should.eql({});
      // change listener should have been called twice
      changed.should.eql(2);
      remove();
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
      let changed = 0;
      const remove = session.on(
        'change', async ({oldEnded, oldData, newData}) => {
          should.exist(oldEnded);
          should.exist(oldData);
          should.exist(newData);
          oldData.should.not.eql(newData);
          oldEnded.should.eql(true);
          changed++;
        });
      await session.end();
      session.should.have.keys(['data', '_service', '_eventTypeListeners']);
      // data should now be empty
      session.data.should.eql({});
      // change listener should have been called once
      changed.should.eql(1);
      remove();
    });
    it('should emit change event once on session.end ' +
      'when change listener throws error', async function() {
      should.exist(session);
      session.should.be.an('object');
      session.should.have.keys(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      // an authenticated session has data
      session.data.should.have.keys(['account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      let changed = 0;
      const remove = session.on(
        'change', async ({oldEnded, oldData, newData}) => {
          should.exist(oldEnded);
          should.exist(oldData);
          should.exist(newData);
          oldData.should.not.eql(newData);
          oldEnded.should.eql(true);
          changed++;
          throw new Error('change listener error');
        });
      let err;
      try {
        await session.end();
      } catch(e) {
        err = e;
      }
      should.exist(err);
      err.message.should.eql('change listener error');
      session.should.have.keys(['data', '_service', '_eventTypeListeners']);
      // data should now be empty
      session.data.should.eql({});
      // change listener should have been called once
      changed.should.eql(1);
      remove();
    });
  }); // end authenticated request
});
