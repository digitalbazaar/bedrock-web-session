/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */

import delay from 'delay';
import {spy, match} from 'sinon';
import {createSession, getSession} from 'bedrock-web-session';
import {login, createAccount, store, logout} from './helpers.js';
import mockData from './mock-data.js';

describe('session API', () => {
  describe('unauthenticated request', () => {
    let session;
    beforeEach(function() {
      session = null;
    });
    afterEach(async function() {
      await logout({session});
    });
    it('should create a session', async () => {
      let err;
      try {
        session = await createSession({id: 'get-unauth-session', store});
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      const keys = Object.keys(session);
      keys.should.eql(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      // an unauthenticated session has no data
      Object.keys(session.data).should.eql([]);
    });
    it('should get a session with no data', async () => {
      let err;
      try {
        session = await getSession({id: 'get-unauth-session', store});
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      const keys = Object.keys(session);
      keys.should.eql(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      // an unauthenticated session has no data
      Object.keys(session.data).should.eql([]);
    });
  }); // end unauthenticated request
  describe('authenticated request', () => {
    const {email, password} = mockData.accounts.session;
    let session = null;
    let account = null;
    let totp = null;
    before(async function() {
      await logout({session});
      ({account, totp} = await createAccount({email, password}));
    });
    beforeEach(async function() {
      session = null;
      await login({email, password, totp});
    });
    afterEach(async function() {
      await logout({session});
    });
    it('should get a session with data', async () => {
      let err;
      try {
        session = await getSession({id: 'get-auth-session', store});
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      const keys = Object.keys(session);
      keys.should.eql(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      // an authenticated session has data
      Object.keys(session.data).should.eql(['account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
    });
    it('should logout a session', async () => {
      let err;
      try {
        session = await getSession({id: 'auth-logout-session', store});
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      let keys = Object.keys(session);
      keys.should.eql(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      Object.keys(session.data).should.eql(['account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      should.exist(session.end);
      await session.end();
      keys = Object.keys(session);
      keys.should.eql(['data', '_service', '_eventTypeListeners']);
      Object.keys(session.data).should.eql([]);
    });
    it('should expire after 1 second', async function() {
      let err;
      try {
        session = await getSession({id: 'auth-expire-session', store});
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      let keys = Object.keys(session);
      keys.should.eql(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      // an authenticated session has data
      Object.keys(session.data).should.eql(['account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      await delay(2000);
      await session.refresh();
      keys = Object.keys(session);
      // an unauthenticated session has no data
      keys.should.eql(['data', '_service', '_eventTypeListeners']);
      session.data.should.eql({});
    });
    it('should refresh', async function() {
      let err;
      try {
        session = await getSession({id: 'auth-refresh-session', store});
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      let keys = Object.keys(session);
      keys.should.eql(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      Object.keys(session.data).should.eql(['account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      // this will refresh 4 times over 2 seconds
      // demonstrating that the session remains authenticated
      // provided we refresh before the session timeout of 1000 ms
      for(let i = 0; i < 5; i++) {
        await delay(250);
        await session.refresh();
        keys = Object.keys(session);
        // an authenticated session has data
        keys.should.eql(['data', '_service', '_eventTypeListeners']);
        Object.keys(session.data).should.eql(['account']);
        session.data.account.should.be.an('object');
        session.data.account.should.have.property('id');
        session.data.account.id.should.equal(account.id);
      }
    });
    it('should emit change event on refresh when session expired',
      async function() {
        let err;
        try {
          session = await getSession({id: 'auth-emit-change', store});
        } catch(e) {
          err = e;
        }
        should.not.exist(err);
        should.exist(session);
        session.should.be.an('object');
        let keys = Object.keys(session);
        keys.should.eql(['data', '_service', '_eventTypeListeners']);
        session.data.should.be.an('object');
        Object.keys(session.data).should.eql(['account']);
        session.data.account.should.be.an('object');
        session.data.account.should.have.property('id');
        session.data.account.id.should.equal(account.id);
        const changeEvent = new Promise((resolve, reject) => {
          session.on('change', ({authentication, oldData, newData}) => {
            try {
              should.not.exist(authentication);
              should.exist(oldData);
              should.exist(newData);
              oldData.should.not.eql(newData);
              resolve();
            } catch(e) {
              reject(e);
            }
          });
        });
        await delay(2000);
        await session.refresh();
        keys = Object.keys(session);
        keys.should.eql(['data', '_service', '_eventTypeListeners']);
        // an unauthenticated session has no data
        Object.keys(session.data).should.eql([]);
        await changeEvent;
      });
    it('should emit change event on session.end', async function() {
      let err;
      try {
        session = await getSession({id: 'end-emit-change', store});
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      let keys = Object.keys(session);
      keys.should.eql(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      // an authenticated session has data
      Object.keys(session.data).should.eql(['account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      const changeEvent = new Promise((resolve, reject) => {
        session.on('change', ({authentication, oldData, newData}) => {
          try {
            should.not.exist(authentication);
            should.exist(oldData);
            should.exist(newData);
            oldData.should.not.eql(newData);
            resolve();
          } catch(e) {
            reject(e);
          }
        });
      });
      await session.end();
      keys = Object.keys(session);
      keys.should.eql(['data', '_service', '_eventTypeListeners']);
      Object.keys(session.data).should.eql([]);
      await changeEvent;
    });
    it('should emit change event if authentication passed to refresh',
      async function() {
        const expectedAuth = {foo: true};
        let err;
        try {
          session = await getSession({id: 'emit-change-auth', store});
        } catch(e) {
          err = e;
        }
        should.not.exist(err);
        should.exist(session);
        session.should.be.an('object');
        let keys = Object.keys(session);
        keys.should.eql(['data', '_service', '_eventTypeListeners']);
        session.data.should.be.an('object');
        Object.keys(session.data).should.eql(['account']);
        session.data.account.should.be.an('object');
        session.data.account.should.have.property('id');
        session.data.account.id.should.equal(account.id);
        let authSpy = null;
        const changeEvent = new Promise((resolve, reject) => {
          authSpy = spy(() => {
            try {
              resolve();
            } catch(e) {
              reject(e);
            }
          });
          session.on('change', authSpy);
        });
        await session.refresh({authentication: expectedAuth});
        keys = Object.keys(session);
        keys.should.eql(['data', '_service', '_eventTypeListeners']);
        Object.keys(session.data).should.eql(['account']);
        await changeEvent;
        authSpy.withArgs({
          authentication: expectedAuth,
          oldData: match.object,
          newData: match.object
        }).calledOnce.should.equal(true);
      });
  }); // end authenticated request
});
