/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */

import {SessionService} from 'bedrock-web-session';

const sessionService = new SessionService();
// import mockData from './mock-data.js';

describe('session API', function() {
  describe('get API', function() {
    describe('unauthenticated request', function() {
      it('should have a session with out an account', async function() {
        let result;
        let err;
        try {
          result = await sessionService.get();
        } catch(e) {
          err = e;
        }
        should.not.exist(err);
        should.exist(result);
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
