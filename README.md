# bedrock-web-session
Session management for Bedrock Web Apps

# Usage

```
npm install bedrock-web-session
```

```js
import {getSession} from 'bedrock-web-session';

async someFunction() {
  const session = await getSession();
  console.log('session data from backend', session.data);
  console.log('session id from backend: ', session.data.id);

  // ... some time later, refresh the session

  await session.refresh();
}
```
