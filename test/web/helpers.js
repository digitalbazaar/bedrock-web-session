/*!
 * Copyright (c) 2018-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {AccountService} from '@bedrock/web-account';
import {authenticator} from 'otplib';
import {session} from '@bedrock/web-session';
import {TokenService} from '@bedrock/web-authn-token';

const tokenService = new TokenService();
const accountService = new AccountService();

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

export async function logout() {
  if(session) {
    try {
      await session.end();
    } finally {}
  }
}

export async function createAccount({
  email,
  password,
  serviceId = 'session-test'
}) {
  // check to make sure the account does not already exist.
  const exists = await accountService.exists({email});
  if(exists) {
    // if the account exists throw an error
    const duplicateError = new Error(
      `An account with the email ${email} was already created.`);
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
    serviceId
  });
  await tokenService.create({
    account: account.id,
    type: 'password',
    password,
    authenticationMethod: 'password-test',
    serviceId
  });
  return {account, totp};
}
