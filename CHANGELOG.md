# bedrock-web-session ChangeLog

### 3.0.0 - 2022-01-xx

### Added
- **BREAKING**: `change` event listeners will now be called when an old
  session ends via a call to `end()` with `oldEnded` set to `true`. If a
  session expires on the server, this will not trigger `oldEnded` to be
  set to `true`; a `change` listener will need to use other information to
  determine how to detect session expiry.

### Changed
- **BREAKING**: Remove usage of `bedrock-web-store` to store session
  instances and adopt a singleton pattern for a `Session` instance exported
  via the `session` symbol instead.

  Usage patterns for this library revealed that only a single `Session`
  instance was used and was used in conjunction with an in-memory store
  engine. Some usage also often relies on the same in-memory instance of a
  `Session` (no copies), and other usage mistakenly expected that the creation
  of different `Session` instances would produce new "sessions" with the
  server -- whereas the session data associated with the server is unrelated to
  the instantiation of `Session` instances on the client. Rather, there is only
  one set of session data on the server that is associated with the client at a
  time and the way to sever this linkage is by calling `end()` on *any*
  `Session` instance.

  This approach also eliminates potential race conditions with multiple async
  calls setting up / storing `Session` instances in `bedrock-web-store`. There
  is now just a single `Session` instance which must be created once in the
  Web app via `createSession`. That instance controls the linkage and fetching
  of session data from the server. To sever the linkage and establish a new
  session with the server, call `end()` and to get the latest data from the
  server call `refresh()`. Note: calling `end()` will internally call
  `refresh()`, so `refresh()` need only be called after external calls have
  been made to change the session data on the server (e.g., separate
  authentication calls -- these are not provided by this library and will
  vary from server to server).
- **BREAKING**: Use `@digitalbazaar/http-client@2`.

### Removed
- **BREAKING**: Remove `getSession()`, instead import `session` and create
  it once using `createSession()` when a Web application initializes. This
  single `session` instance is shared throughout a Web application and
  represents the authentication linkage between the client and the server
  (i.e., how the server determines it is communicating with the same client
  between requests).
- **BREAKING**: Passing `authentication` custom data to `refresh()` has been
  removed. This feature was largely unused and could potentially confuse a
  `change` listener because the `authentication` data could be out of sync
  with the session data.

### 2.0.0 - 2021-06-10

### Changed
- **BREAKING**: Replaced `axios` with `@digitalbazaar/http-client`. Errors
  returned directly from `http-client` do not match the `axios` API.

### 1.6.0 - 2021-03-29

### Changed
- Use `axios@0.21.1`.
- Improve test coverage.

### 1.5.1 - 2020-07-23

### Fixed
- The `id` and `store` passed to `getSession` are passed to `createSession` too.

## 1.5.0 - 2020-07-01

### Changed
- Update deps.
- Update test deps.
- Update CI workflow.

## 1.4.0 - 2020-04-21

### Added
- Setup CI and coverage workflow.

### Changed
- Update deps.

## 1.3.0 - 2020-01-22

### Added
- The `on` API now returns a remover function that can be use to remove the
  handler.

## 1.2.0 - 2019-04-15

### Added
- Add `change` event and API to listen for it.
- Add `createSession` call to explicitly initialize session. This
  allows for listeners to be attached prior to a refresh of the
  session.

## 1.1.1 - 2019-04-04

### Fixed
- Export bug.

## 1.1.0 - 2018-06-14

### Added
- Add `getSession` API.

## 1.0.0 - 2018-05-24

## 0.1.0 - 2018-05-24

### Added
- Add core files.

- See git history for changes.
