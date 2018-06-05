/*!
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import SessionService from './SessionService.js';

export default class Session {
  constructor() {
    this._service = new SessionService();
    this.data = {};
  }

  async refresh() {
    this.data = await this._service.get();
  }

  end() {
    return this._service.logout();
  }
}
