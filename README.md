# bedrock-web-session
Session management for Bedrock Web Apps

# About

This module exports a function to create a singleton `Session` instance that
is shared across an entire web application. The singleton instance is exposed
via the exported `session` symbol. This instance represents the current state
that binds asynchronous communications between the client and the server, i.e.,
the server uses a session to link requests together as coming from the same
client and may store data associated with that client as "session data".

The most commonly stored "session data" is an identifier, e.g., an account ID,
that can be used to link users across multiple sessions. This sort of
information will only be present in session data if the user authenticates
with the server (using some APIs / methods that are external to this library).

The current session may be ended (severing the above linkage and connection
to the current session's data) by calling `end()` on the `session` instance
or at any time by the server, e.g., if a session expires.

If the server ends the session or changes its data in any way, this can only be
detected by calling `refresh()` on the `session` instance. This call will
retrieve the latest session data from the server, which may have changed. If
the data has changed, then a `change` event will be emitted to any listeners
that have registered with the `session` instance via the `on()` method. This
event will include the old session data and the new session data. If a
call to `end()` is made, then a `change` event will also be emitted and it
will include an `oldEnded` boolean that indicates that the old session ended.

If the server has ended a session, then this property will not be set on a
`change` event, a listener will need to determine its behavior based on the
available session data as this library cannot automatically determine if a
session is new or not.

# Usage

```
npm install bedrock-web-session
```

```js
import {createSession, session} from 'bedrock-web-session';

async someInitializingFunction() {
  // the session instance is now ready
  await createSession();
}

async someOtherFunctionCalledLater() {
  console.log('session data from backend', session.data);
  console.log('session id from backend: ', session.data.id);

  // listen for changes to the session
  session.on('change', async function({oldEnded, oldData, newData}) {
    // either the old session ended (`oldEnded === true`) or `oldData` does
    // not deep equal `newData`, inspect and take action,
    // such as clearing data associated with a previously authenticated user
  });

  // ... some time later, refresh the session to get updated data from the
  // server that is linked to the client; this will cause all `change`
  // listeners to be called *if* the new session data does not match the
  // old session data
  await session.refresh();

  // ... some time later, sever the linkage between the client and server
  // by ending the session; cause the server to see the client as new and
  // trigger `change` listeners (which will receive `oldEnded === true`)
  await session.end();
}
```
