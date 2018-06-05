/*!
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

export default class Session {
  constructor({service}) {
    this._service = service;
    this.data = {};
  }

  async refresh() {
    this.data = await this._service.get();
  }

  end() {
    return this._service.logout();
  }
}
