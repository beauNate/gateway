# GitHub Copilot Instructions for Portkey AI Gateway

## Project Overview

The Portkey AI Gateway is a fast, reliable AI gateway that routes requests to 250+ LLMs with security, privacy, and PHI compliance at its core. This document provides guidelines for AI-assisted development to maintain code quality, security, and privacy standards.

## Core Principles

### 1. Privacy and PHI Protection (CRITICAL)

**ALWAYS prioritize PHI and privacy protection:**
- Never log, cache, or persist PHI/PII data without explicit de-identification
- Implement audit trails for all PHI data access
- Use encryption for all sensitive data at rest and in transit
- Follow HIPAA, GDPR, CCPA, and SOC2 compliance requirements
- Validate all input data for potential PHI leakage before processing

### 2. Security First

- All new features must pass security scanning (CodeQL, dependency checks)
- Never commit secrets, API keys, or credentials
- Use environment variables for all sensitive configuration
- Implement rate limiting and authentication for all endpoints
- Validate and sanitize all user inputs
- Follow OWASP Top 10 security guidelines

### 3. Code Quality

- Write TypeScript with strict typing enabled
- Follow existing code style (Prettier configuration)
- Maintain test coverage above 80% for new code
- Document all public APIs and complex logic
- Use meaningful variable and function names
- Keep functions small and focused (single responsibility)

## Development Workflow

### Before Writing Code

1. **Understand the Context**: Review related code, tests, and documentation
2. **Check Existing Patterns**: Follow established patterns in the codebase
3. **Security Review**: Consider security implications of your changes
4. **PHI Assessment**: Evaluate if your code handles PHI/PII data

### Writing Code

```typescript
// DO: Use TypeScript types and interfaces
interface SecureConfig {
  apiKey: string;
  encryptionEnabled: boolean;
  auditLogging: boolean;
}

// DO: Implement proper error handling
try {
  const result = await processRequest(data);
  await auditLog.record('request_processed', { requestId: result.id });
} catch (error) {
  logger.error('Request processing failed', { error: sanitizeError(error) });
  throw new SecureError('Processing failed', { code: 'PROCESSING_ERROR' });
}

// DON'T: Log sensitive data
// WRONG: logger.info('User data:', userData);
// RIGHT: logger.info('User data processed', { userId: userData.id });

// DO: Use de-identification before logging
logger.info('Processing data', { data: deIdentify(userData) });
```

### Testing Requirements

1. **Unit Tests**: Required for all new functions and modules
2. **Integration Tests**: Required for API endpoints and providers
3. **Security Tests**: Required for authentication and authorization code
4. **PHI Tests**: Required for any code handling sensitive data

```typescript
// Example test structure
describe('DeIdentificationService', () => {
  describe('detectPHI', () => {
    it('should detect SSN patterns', () => {
      const text = 'SSN: 123-45-6789';
      const result = deIdentify.detectPHI(text);
      expect(result.hasPHI).toBe(true);
      expect(result.types).toContain('SSN');
    });

    it('should handle empty input safely', () => {
      expect(() => deIdentify.detectPHI('')).not.toThrow();
    });
  });
});
```

## Architecture Guidelines

### Module Structure

```
src/
├── handlers/          # Request handlers (API endpoints)
├── middlewares/       # Middleware pipeline (validation, auth, logging)
├── providers/         # AI provider integrations
├── services/          # Business logic and shared services
│   ├── deidentify/   # PHI de-identification
│   ├── audit/        # Audit logging
│   └── security/     # Security utilities
├── shared/           # Shared utilities and types
├── types/            # TypeScript type definitions
└── utils/            # Helper functions
```

### Adding New Features

#### 1. New API Endpoint

```typescript
// src/handlers/myNewHandler.ts
import { Context } from 'hono';
import { auditLog } from '../services/audit';
import { deIdentify } from '../services/deidentify';

export async function handleNewEndpoint(c: Context) {
  // 1. Extract and validate input
  const input = await c.req.json();
  
  // 2. Check for PHI
  if (deIdentify.containsPHI(input)) {
    await auditLog.record('phi_detected', { endpoint: 'new_endpoint' });
    input = deIdentify.redact(input);
  }
  
  // 3. Process request
  const result = await processRequest(input);
  
  // 4. Return safe response
  return c.json(result);
}
```

#### 2. New Provider Integration

Follow the pattern in `src/providers/`:
- Create provider directory with `api.ts`, `chatComplete.ts`, etc.
- Implement provider config with transformations
- Add comprehensive tests
- Document rate limits and error handling

#### 3. New Guardrail/Plugin

Follow the pattern in `plugins/`:
- Create plugin directory with `manifest.json`
- Implement handler function
- Add unit tests
- Update plugin build configuration

### PHI and Privacy Patterns

#### De-Identification

```typescript
import { deIdentifyService } from './services/deidentify';

// Detect PHI
const result = deIdentifyService.detect(text);
if (result.hasPHI) {
  // Redact PHI
  const redacted = deIdentifyService.redact(text, result.matches);
  
  // Audit the detection
  await auditLog.record('phi_detected', {
    types: result.types,
    count: result.matches.length
  });
}

// For logging - always de-identify
logger.info('Processing request', {
  data: deIdentifyService.maskForLogging(data)
});
```

#### Audit Logging

```typescript
import { auditLog } from './services/audit';

// Record all PHI access
await auditLog.record('phi_access', {
  userId: user.id,
  action: 'read',
  dataType: 'patient_record',
  timestamp: new Date().toISOString(),
  requestId: context.requestId
});
```

## Code Review Checklist

Before submitting code, verify:

- [ ] No hardcoded secrets or credentials
- [ ] All sensitive data is de-identified before logging
- [ ] Audit logs are present for PHI access
- [ ] Input validation is implemented
- [ ] Error messages don't leak sensitive information
- [ ] Tests cover happy path and edge cases
- [ ] Security considerations documented
- [ ] Type definitions are strict and accurate
- [ ] Code follows existing patterns
- [ ] Documentation is updated

## CI/CD Pipeline

All code must pass:

1. **Linting**: `npm run format:check`
2. **Type Checking**: TypeScript compilation
3. **Unit Tests**: `npm run test:gateway`
4. **Security Scan**: CodeQL analysis
5. **PHI Detection**: Automated PHI scanning
6. **Dependency Audit**: `npm audit`

## Common Patterns and Anti-Patterns

### ✅ DO

```typescript
// Use environment variables for configuration
const config = {
  apiKey: process.env.PROVIDER_API_KEY,
  endpoint: process.env.PROVIDER_ENDPOINT
};

// Implement proper error boundaries
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', { 
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
  throw new AppError('Operation failed', { cause: error });
}

// Use typed responses
interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}
```

### ❌ DON'T

```typescript
// Don't log raw user data
logger.info('User input:', userInput); // ❌

// Don't ignore errors
try {
  await operation();
} catch (e) {} // ❌

// Don't use 'any' without justification
function process(data: any) {} // ❌

// Don't hardcode sensitive values (example - not real)
const apiKey = 'sk-example-key-not-real'; // ❌ Example only
```

## Performance Considerations

- Use streaming for large responses
- Implement caching with TTL
- Avoid blocking operations in request handlers
- Use connection pooling for databases
- Monitor memory usage for large operations

## Documentation Standards

### Function Documentation

```typescript
/**
 * De-identifies text by detecting and redacting PHI/PII patterns.
 * 
 * @param text - The input text to de-identify
 * @param options - De-identification options
 * @param options.preserveFormat - Whether to preserve original format
 * @returns De-identified text with PHI redacted
 * 
 * @example
 * ```typescript
 * const safe = deIdentify('Patient SSN: 123-45-6789');
 * // Returns: 'Patient SSN: [REDACTED-SSN]'
 * ```
 * 
 * @throws {ValidationError} If input text is invalid
 */
export function deIdentify(
  text: string,
  options: DeIdentifyOptions = {}
): string {
  // Implementation
}
```

### API Documentation

Document all public APIs with:
- Purpose and use case
- Request/response formats
- Authentication requirements
- Rate limits
- Error codes
- Examples

## Additional Resources

- [CLAUDE.md](../CLAUDE.md) - Project-specific Claude instructions
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [SECURITY.md](SECURITY.md) - Security policy
- [Plugin Documentation](../plugins/README.md) - Plugin development guide

## Emergency Procedures

### Security Incident

1. Stop all deployments immediately
2. Notify the security team
3. Document the incident with timestamps
4. Do not delete evidence
5. Follow incident response plan

### PHI Breach

1. Immediately isolate affected systems
2. Notify compliance team
3. Document all PHI exposure details
4. Begin breach notification procedures
5. Implement corrective measures

## Questions?

- Check existing documentation first
- Review similar code in the repository
- Ask in GitHub Discussions or Discord
- Open an issue for clarification

---

**Remember**: Security and privacy are not features to be added later—they must be built into every line of code from the start.
