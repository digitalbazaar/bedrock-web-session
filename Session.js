/*!
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import SessionService from './SessionService';

export class Session {
  constructor() {
    this._service = new SessionService();
  }

  async refresh() {
    return true;
  }

  async get() {
    const data = await this._service.get();
    return data;
  }

  async end() {
    const success = await this._service.logout();
    return success;
  }
}
