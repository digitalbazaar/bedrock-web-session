# bedrock-web-session
Session management for Bedrock Web Apps

# About

A `S

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
