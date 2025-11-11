# Test Credentials

Integration tests require a `.creds.json` file in this directory.

## Setup

1. Copy `.creds.example.json` to `.creds.json`:
   ```bash
   cp .creds.example.json .creds.json
   ```

2. Fill in your API keys in `.creds.json` (this file is gitignored)

3. Run tests:
   ```bash
   npm run test:gateway
   ```

## Note

- `.creds.json` is ignored by git to prevent accidental commit of API keys
- Integration tests will be skipped if `.creds.json` is not present
