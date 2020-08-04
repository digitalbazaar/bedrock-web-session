import delay from 'delay';
import {createSession, getSession} from 'bedrock-web-session';
import {login, createAccount, store} from './helpers.js';
import mockData from './mock-data.js';

describe('session', () => {
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
    it('should get a session', async () => {
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
    it('should get a session', async () => {
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
      should.exist(session.data.account);
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      should.exist(session.end);
      await session.end();
      keys = Object.keys(session);
      keys.should.deep.equal(['data', '_service', '_eventTypeListeners']);
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
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      await delay(2000);
      await session.refresh();
      keys = Object.keys(session);
      // an unauthenticated session has no data
      keys.should.deep.equal(['data', '_service', '_eventTypeListeners']);
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
      session.data.account.should.be.an('object');
      session.data.account.should.have.property('id');
      session.data.account.id.should.equal(account.id);
      for(let i = 0; i < 4; i++) {
        await delay(250);
        await session.refresh();
        keys = Object.keys(session);
        // an authenticated session has data
        keys.should.deep.equal(['data', '_service', '_eventTypeListeners']);
        session.data.account.should.be.an('object');
        session.data.account.should.have.property('id');
        session.data.account.id.should.equal(account.id);
      }
    });
  }); // end authenticated request
});
