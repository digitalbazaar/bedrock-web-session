/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */

import {SessionService, createSession} from 'bedrock-web-session';
import {MemoryEngine} from 'bedrock-web-store';

const sessionService = new SessionService();
// import mockData from './mock-data.js';

describe('session API', function() {
  describe('get API', function() {
    describe('unauthenticated request', function() {
      it('should have a session with out an account', async function() {
        let result, err = null;
        try {
          result = await sessionService.get();
        } catch(e) {
          err = e;
        }
        should.not.exist(err);
        should.exist(result);
      });
      it('should create a session', async function() {
        let session, err = null;
        try {
          session = await createSession(
            {id: 'unauthenticated-create-test', store: new MemoryEngine()});
        } catch(e) {
          err = e;
        }
        should.exist(session);
        should.not.exist(err);
      });
      it('should refresh a session', async function() {
        let session, err = null;
        try {
          session = await createSession(
            {id: 'unauthenticated-refresh-test', store: new MemoryEngine()});
          await session.refresh();
        } catch(e) {
          err = e;
        }
        should.exist(session);
        should.not.exist(err);
      });
    });
    describe.skip('authenticated request', function() {
      it('should have a session with an account', async function() {
        let result;
        let err;
        try {
          result = await sessionService.get();
        } catch(e) {
          err = e;
        }
        should.not.exist(result);
        should.exist(err);
      });
    }); // end authenticated request
  }); // end create
});
