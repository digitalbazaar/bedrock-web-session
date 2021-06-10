# bedrock-web-session ChangeLog

### 2.0.0 - TBD

### Changed
- **BREAKING**: Replaced `axios` with `@digitalbazaar/http-client`.
- Changed `SessionService.js` to use http-client instead of `axios`.

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
