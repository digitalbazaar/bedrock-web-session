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
      // this helps cut down on test failures
      await delay(250);
    });
    it('should create a session', async () => {
      let err;
      try {
        session = await createSession({id: 'create-unauth-session', store});
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      session.should.have.keys([
        'data',
        '_service',
        '_timeout',
        '_eventTypeListeners'
      ]);
      session.data.should.be.an('object');
      // a session that has not been created on the server
      // in turn has no ttl as it is untracked
      session.data.should.eql({});
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
      session.should.have.keys([
        'data',
        '_service',
        '_timeout',
        '_eventTypeListeners'
      ]);
      session.data.should.be.an('object');
      // an unauthenticated session has a ttl
      session.data.should.have.keys(['ttl']);
      session.data.ttl.should.be.a('number');
      session.data.ttl.should.equal(mockData.expectedTTL);
    });
  }); // end unauthenticated request
  describe('authenticated request', () => {
    const {email, password} = mockData.accounts.session;
    let session = null;
    let account = null;
    let totp = null;
    // all tests will use the same session id
    const sessionId = 'auth-session-tests';
    // this runs before once before all auth tests
    before(async function() {
      // ensure there is no existing session
      await logout({session});
      // create the account and get the totp
      ({account, totp} = await createAccount({email, password}));
    });
    beforeEach(async function() {
      session = null;
      await login({email, password, totp});
    });
    afterEach(async function() {
      // this will delete the session from the store
      // after ending it
      await logout({session, id: sessionId});
      // this is to prevent the ci from consistently failing
      await delay(250);
    });
    it('should get a session with data', async () => {
      let err;
      try {
        session = await getSession({id: sessionId, store});
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      session.should.have.keys([
        'data',
        '_service',
        '_timeout',
        '_eventTypeListeners'
      ]);
      session.data.should.be.an('object');
      // an authenticated session has data
      session.data.should.have.keys(['ttl', 'account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
    });
    it('should logout a session', async () => {
      let err;
      try {
        session = await getSession({id: sessionId, store});
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      session.should.have.keys([
        'data',
        '_service',
        '_timeout',
        '_eventTypeListeners'
      ]);
      session.data.should.be.an('object');
      session.data.should.have.keys(['ttl', 'account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      should.exist(session.end);
      await session.end();
      session.should.have.keys([
        'data',
        '_service',
        '_timeout',
        '_eventTypeListeners'
      ]);
      // an unauthenticated session has a ttl
      session.data.should.have.keys(['ttl']);
      session.data.ttl.should.be.a('number');
      session.data.ttl.should.equal(mockData.expectedTTL);
    });
    it('should expire after 1 second', async function() {
      let err;
      try {
        session = await getSession({id: sessionId, store});
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      session.should.have.keys([
        'data',
        '_service',
        '_timeout',
        '_eventTypeListeners'
      ]);
      session.data.should.be.an('object');
      // an authenticated session has data
      session.data.should.have.keys(['ttl', 'account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      await delay(mockData.expectedTTL * 2);
      // a session refreshed after 2 x ttl should be expired
      await session.refresh();
      session.should.have.keys([
        'data',
        '_service',
        '_timeout',
        '_eventTypeListeners'
      ]);
      // an unauthenticated session has a ttl
      session.data.should.have.keys(['ttl']);
      session.data.ttl.should.be.a('number');
      session.data.ttl.should.equal(mockData.expectedTTL);
    });
    it('should refresh', async function() {
      let err;
      try {
        session = await getSession({id: sessionId, store});
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      session.should.have.keys([
        'data',
        '_service',
        '_timeout',
        '_eventTypeListeners'
      ]);
      session.data.should.be.an('object');
      session.data.should.have.keys(['ttl', 'account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      // this will refresh 4 times over 2 seconds
      // demonstrating that the session remains authenticated
      // provided we refresh before the session timeout of 1000 ms
      for(let i = 0; i < 5; i++) {
        await delay(250);
        await session.refresh();
        session.should.have.keys([
          'data',
          '_service',
          '_timeout',
          '_eventTypeListeners'
        ]);
        session.data.should.be.an('object');
        session.data.should.have.keys(['ttl', 'account']);
        session.data.account.should.be.an('object');
        session.data.account.should.have.property('id');
        session.data.account.id.should.equal(account.id);
      }
    });
    it('should emit change event on refresh when session expired',
      async function() {
        let err;
        try {
          session = await getSession({id: sessionId, store});
        } catch(e) {
          err = e;
        }
        should.not.exist(err);
        should.exist(session);
        session.should.be.an('object');
        session.should.have.keys([
          'data',
          '_service',
          '_timeout',
          '_eventTypeListeners'
        ]);
        session.data.should.be.an('object');
        session.data.should.have.keys(['ttl', 'account']);
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
        session.should.have.keys([
          'data',
          '_service',
          '_timeout',
          '_eventTypeListeners'
        ]);
        // an unauthenticated session has a ttl
        session.data.should.have.keys(['ttl']);
        session.data.ttl.should.be.a('number');
        session.data.ttl.should.equal(mockData.expectedTTL);
        await changeEvent;
      });
    it('should emit change event on session.end', async function() {
      let err;
      try {
        session = await getSession({id: sessionId, store});
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(session);
      session.should.be.an('object');
      session.should.have.keys([
        'data',
        '_service',
        '_timeout',
        '_eventTypeListeners'
      ]);
      session.data.should.be.an('object');
      // an authenticated session has an account
      session.data.should.have.keys(['ttl', 'account']);
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
      session.should.have.keys([
        'data',
        '_service',
        '_timeout',
        '_eventTypeListeners'
      ]);
      // an unauthenticated session has a ttl
      session.data.should.have.keys(['ttl']);
      session.data.ttl.should.be.a('number');
      session.data.ttl.should.equal(mockData.expectedTTL);
      await changeEvent;
    });
    it('should emit change event if authentication passed to refresh',
      async function() {
        const expectedAuth = {foo: true};
        let err;
        try {
          session = await getSession({id: sessionId, store});
        } catch(e) {
          err = e;
        }
        should.not.exist(err);
        should.exist(session);
        session.should.be.an('object');
        session.should.have.keys([
          'data',
          '_service',
          '_timeout',
          '_eventTypeListeners'
        ]);
        session.data.should.be.an('object');
        session.data.should.have.keys(['ttl', 'account']);
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
        session.should.have.keys([
          'data',
          '_service',
          '_timeout',
          '_eventTypeListeners'
        ]);
        session.data.should.be.an('object');
        session.data.should.have.keys(['ttl', 'account']);
        await changeEvent;
        authSpy.withArgs({
          authentication: expectedAuth,
          oldData: match.object,
          newData: match.object
        }).calledOnce.should.equal(true);
      });
  }); // end authenticated request
});
