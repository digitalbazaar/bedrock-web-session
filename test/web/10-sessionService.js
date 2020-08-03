/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */

import {SessionService} from 'bedrock-web-session';

const sessionService = new SessionService();
// import mockData from './mock-data.js';

describe('sessionService API', () => {
  describe('get API', () => {
    describe('unauthenticated request', () => {
      let session;
      beforeEach(function() {
        session = null;
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
        keys.should.deep.equal([]);
      });
    }); // end unauthenticated request
  }); // end get
});
