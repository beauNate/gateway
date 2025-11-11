# ADR-001: PHI and Privacy Architecture

## Status

Accepted

## Date

2025-11-11

## Context

The Portkey AI Gateway processes requests to 250+ LLMs and may handle sensitive data including Protected Health Information (PHI) and Personally Identifiable Information (PII). We need a comprehensive approach to ensure:

1. **Compliance**: Meet HIPAA, GDPR, CCPA, and SOC2 requirements
2. **Security**: Protect sensitive data throughout its lifecycle
3. **Privacy**: Minimize data exposure and implement privacy by design
4. **Auditability**: Track all PHI/PII access and modifications
5. **Developer Safety**: Prevent accidental leakage in logs, errors, or commits

### Risks Without Proper PHI Handling

- **Legal**: HIPAA violations can result in fines up to $50,000 per violation
- **Regulatory**: GDPR fines can reach €20 million or 4% of annual revenue
- **Reputational**: Data breaches can damage trust and business relationships
- **Operational**: Incidents require costly remediation and disclosure

## Decision

We will implement a multi-layered PHI and privacy protection architecture:

### 1. Detection Layer

**Automated PHI Detection**
- Pre-commit hooks to scan staged files for PHI/PII patterns
- CI/CD pipeline checks for sensitive data in code
- Runtime detection in request/response pipelines
- Pattern matching for common PHI types:
  - Social Security Numbers (SSN)
  - Medical Record Numbers (MRN)
  - Credit Card Numbers
  - Email addresses and phone numbers
  - API keys and credentials
  - IP addresses (context-dependent)

**Implementation**: `scripts/check-phi.js` for pre-commit, CI workflow for continuous checks

### 2. De-identification Layer

**Core De-identification Module** (`src/services/deidentify/`)
- Detect PHI patterns in text
- Redact or mask sensitive data
- Preserve data utility where possible
- Support multiple de-identification strategies:
  - Redaction: Replace with `[REDACTED-TYPE]`
  - Masking: Partial replacement (e.g., `***-**-1234`)
  - Tokenization: Replace with reversible tokens (for authorized access)
  - Generalization: Replace with broader categories

**API Design**:
```typescript
interface DeIdentifyService {
  detect(text: string): PHIDetectionResult;
  redact(text: string, options?: RedactOptions): string;
  mask(text: string, options?: MaskOptions): string;
  tokenize(text: string, key: string): TokenizedData;
  detokenize(data: TokenizedData, key: string): string;
}
```

### 3. Audit Layer

**Comprehensive Audit Logging** (`src/services/audit/`)
- Log all PHI detection events
- Record access to sensitive data
- Track de-identification operations
- Immutable audit trail
- Structured logging for analysis

**Audit Log Format**:
```typescript
interface AuditLog {
  timestamp: string;
  eventType: 'phi_detected' | 'phi_accessed' | 'phi_redacted';
  userId?: string;
  requestId: string;
  dataType: string[];
  action: string;
  result: 'success' | 'failure';
  metadata: Record<string, any>;
}
```

### 4. Middleware Integration

**Request Pipeline Integration**
- Early detection in request validators
- Automatic redaction before logging
- PHI headers for marking sensitive requests
- Response scrubbing for error messages

**Guardrail Plugin**
- New plugin: `plugins/portkey/phi-guardian.ts`
- `beforeRequest` hook: Scan and optionally block PHI in prompts
- `afterRequest` hook: Scan and redact PHI in responses
- Configurable policies per workspace/user

### 5. Storage and Caching

**Data at Rest**
- Encrypt all cached data containing PHI
- Short TTLs for sensitive data
- Separate cache namespaces for PHI
- Automatic expiration and cleanup

**Logging and Monitoring**
- Never log raw PHI data
- De-identify before sending to logging systems
- Structured logs with PHI flags
- Redact stack traces and error details

### 6. Development Workflow

**Pre-commit Protection**
- Husky hook: `scripts/check-phi.js`
- Scans staged files for PHI patterns
- Blocks commits containing potential PHI
- Provides guidance on false positives

**CI/CD Pipeline**
- Security and quality checks workflow
- PHI detection job in CI
- Automated scanning of all code changes
- Failed builds on PHI detection

**Documentation**
- `.github/copilot-instructions.md` for AI assistance
- Clear guidelines on PHI handling
- Code examples and anti-patterns
- Emergency procedures

## Consequences

### Positive

1. **Compliance**: Automated compliance with privacy regulations
2. **Safety**: Multiple layers of protection against PHI leakage
3. **Auditability**: Complete audit trail for compliance audits
4. **Developer Experience**: Clear guidelines and automated checks
5. **Trust**: Demonstrates commitment to privacy and security

### Negative

1. **Performance**: Additional processing overhead for detection/redaction
2. **Complexity**: More code to maintain and test
3. **False Positives**: May flag legitimate data as PHI
4. **Developer Friction**: Additional pre-commit checks may slow workflow

### Mitigation Strategies

**Performance**:
- Use efficient regex patterns
- Cache detection results
- Async processing where possible
- Opt-in for intensive checks

**Complexity**:
- Modular design with clear interfaces
- Comprehensive documentation
- Extensive test coverage
- Regular security audits

**False Positives**:
- Context-aware detection
- Allowlist for test/example data
- Clear marking for mock data
- Developer override with justification

**Developer Friction**:
- Fast pre-commit checks (< 1 second)
- Clear error messages
- Easy override for false positives
- Automated formatting and fixes

## Implementation Plan

### Phase 1: Foundation (Current PR)
- ✅ Create copilot-instructions.md
- ✅ Implement pre-commit PHI checks
- ✅ Enhance CI/CD with security checks
- ✅ Write ADR-001

### Phase 2: De-identification Module (Next PR)
- Core de-identification service
- Unit tests (>90% coverage)
- Integration with audit logging
- API documentation

### Phase 3: Guardrails Integration
- PHI guardian plugin
- Request/response middleware
- Configuration system
- Performance benchmarks

### Phase 4: Storage and Caching
- Encrypted cache for PHI
- Logging redaction
- Cache TTL policies
- Storage encryption

### Phase 5: Documentation and Training
- Developer guides
- Security playbooks
- Compliance documentation
- Training materials

## References

- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [GDPR Article 32: Security of Processing](https://gdpr-info.eu/art-32-gdpr/)
- [NIST Privacy Framework](https://www.nist.gov/privacy-framework)
- [OWASP Sensitive Data Exposure](https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure)

## Related Decisions

- ADR-002: De-identification Strategy (upcoming)
- ADR-003: Chunking and Evaluation Approach (upcoming)
- ADR-004: RAG Provider Architecture (upcoming)
- ADR-005: Final Architecture and Security Model (upcoming)

## Review and Update

This ADR should be reviewed:
- Quarterly for relevance
- After security incidents
- When regulations change
- Before major feature releases
