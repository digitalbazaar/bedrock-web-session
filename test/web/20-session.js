import delay from 'delay';
import {spy, match} from 'sinon';
import {createSession, getSession} from 'bedrock-web-session';
import {login, createAccount, store} from './helpers.js';
import mockData from './mock-data.js';

describe('session API', () => {
  describe('unauthenticated request', () => {
    let session;
    beforeEach(function() {
      session = null;
    });
    afterEach(async function() {
      if(session && session.end) {
        await session.end();
      }
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
      // an unauthenticated session has no data
      keys.should.deep.equal(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      Object.keys(session.data).should.deep.equal([]);
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
      // an unauthenticated session has no data
      keys.should.deep.equal(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      Object.keys(session.data).should.deep.equal([]);
    });
  }); // end unauthenticated request
  describe('authenticated request', () => {
    let session, account, totp, email, password = null;
    before(async function() {
      ({account, totp, email, password} = await createAccount(
        mockData.accounts.session));
    });
    beforeEach(async function() {
      session = null;
      await login({email, password, totp});
    });
    afterEach(async function() {
      if(session && session.end) {
        await session.end();
      }
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
      // an authenticated session has data
      keys.should.deep.equal(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      Object.keys(session.data).should.deep.equal(['account']);
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
      keys.should.deep.equal(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      Object.keys(session.data).should.deep.equal(['account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      should.exist(session.end);
      await session.end();
      keys = Object.keys(session);
      keys.should.deep.equal(['data', '_service', '_eventTypeListeners']);
      Object.keys(session.data).should.deep.equal([]);
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
      // an authenticated session has data
      keys.should.deep.equal(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      Object.keys(session.data).should.deep.equal(['account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      await delay(2000);
      await session.refresh();
      keys = Object.keys(session);
      // an unauthenticated session has no data
      keys.should.deep.equal(['data', '_service', '_eventTypeListeners']);
      Object.keys(session.data).should.deep.equal([]);
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
      // an authenticated session has data
      keys.should.deep.equal(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      Object.keys(session.data).should.deep.equal(['account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      for(let i = 0; i < 4; i++) {
        await delay(250);
        await session.refresh();
        keys = Object.keys(session);
        // an authenticated session has data
        keys.should.deep.equal(['data', '_service', '_eventTypeListeners']);
        Object.keys(session.data).should.deep.equal(['account']);
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
        // an authenticated session has data
        keys.should.deep.equal(['data', '_service', '_eventTypeListeners']);
        session.data.should.be.an('object');
        Object.keys(session.data).should.deep.equal(['account']);
        session.data.account.should.be.an('object');
        session.data.account.should.have.property('id');
        session.data.account.id.should.equal(account.id);
        const changeEvent = new Promise(resolve => {
          session.on('change', ({authentication, oldData, newData}) => {
            should.not.exist(authentication);
            should.exist(oldData);
            should.exist(newData);
            oldData.should.not.deep.equal(newData);
            resolve();
          });
        });
        await delay(2000);
        await session.refresh();
        keys = Object.keys(session);
        // an unauthenticated session has no data
        keys.should.deep.equal(['data', '_service', '_eventTypeListeners']);
        Object.keys(session.data).should.deep.equal([]);
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
      // an authenticated session has data
      keys.should.deep.equal(['data', '_service', '_eventTypeListeners']);
      session.data.should.be.an('object');
      Object.keys(session.data).should.deep.equal(['account']);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      const changeEvent = new Promise(resolve => {
        session.on('change', ({authentication, oldData, newData}) => {
          should.not.exist(authentication);
          should.exist(oldData);
          should.exist(newData);
          oldData.should.not.deep.equal(newData);
          resolve();
        });
      });
      await session.end();
      keys = Object.keys(session);
      // an unauthenticated session has no data
      keys.should.deep.equal(['data', '_service', '_eventTypeListeners']);
      Object.keys(session.data).should.deep.equal([]);
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
        // an authenticated session has data
        keys.should.deep.equal(['data', '_service', '_eventTypeListeners']);
        session.data.should.be.an('object');
        Object.keys(session.data).should.deep.equal(['account']);
        session.data.account.should.be.an('object');
        session.data.account.should.have.property('id');
        session.data.account.id.should.equal(account.id);
        let authSpy = null;
        const changeEvent = new Promise(resolve => {
          authSpy = spy(() => resolve());
          session.on('change', authSpy);
        });
        await session.refresh({authentication: expectedAuth});
        keys = Object.keys(session);
        keys.should.deep.equal(['data', '_service', '_eventTypeListeners']);
        Object.keys(session.data).should.deep.equal(['account']);
        await changeEvent;
        authSpy.withArgs({
          authentication: expectedAuth,
          oldData: match.object,
          newData: match.object
        }).calledOnce.should.equal(true);
      });

  }); // end authenticated request
});
