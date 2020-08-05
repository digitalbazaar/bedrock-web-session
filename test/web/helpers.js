/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */

import {TokenService} from 'bedrock-web-authn-token';
import {AccountService} from 'bedrock-web-account';
import {authenticator} from 'otplib';
import {MemoryEngine} from 'bedrock-web-store';

export const store = new MemoryEngine();
const tokenService = new TokenService();
const accountService = new AccountService();

// safely ends a session & removes from it from the store.
export async function logout({session, id} = {}) {
  if(session && session.end) {
    await session.end();
  }
  return store.delete({id});
}

export async function login({email, password, totp}) {
  const authResults = {};
  const challenge = authenticator.generate(totp.secret);
  authResults.totp = await tokenService.authenticate(
    {type: 'totp', email, challenge});
  authResults.password = await tokenService.authenticate(
    {email, type: 'password', challenge: password});
  authResults.login = await tokenService.login();
  return authResults;
}

export async function createAccount({
  email,
  password,
  short_name = 'session-test'
}) {
  // check to make sure the account does not already exist.
  const exists = await accountService.exists({email});
  if(exists) {
    // if the account exists throw an error
    const duplicateError = new Error(
      `An account with the email ${email} was already created}`);
    duplicateError.name = 'DuplicateError';
    throw duplicateError;
  }
  const account = await accountService.create({email});
  await tokenService.setAuthenticationRequirements({
    account: account.id,
    requiredAuthenticationMethods: [
      'totp-test-challenge',
      'password-test'
    ]
  });
  const {result: totp} = await tokenService.create({
    account: account.id,
    type: 'totp',
    authenticationMethod: 'totp-test-challenge',
    serviceId: short_name
  });
  await tokenService.create({
    account: account.id,
    type: 'password',
    password,
    authenticationMethod: 'password-test',
    serviceId: short_name
  });
  return {account, totp};
}
