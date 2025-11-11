# Security and Privacy Workflows

This document describes the security and privacy workflows implemented in the Portkey AI Gateway to protect against PHI/PII leakage and ensure compliance with HIPAA, GDPR, and other regulations.

## Overview

The gateway implements multiple layers of protection:

1. **Pre-commit Hooks**: Prevent accidental commits of sensitive data
2. **CI/CD Pipeline**: Continuous security and quality checks
3. **Runtime Protection**: PHI detection and de-identification (coming in PR 2)
4. **Audit Logging**: Complete audit trail (coming in PR 2)

## Pre-commit Protection

### PHI/PII Detection (`scripts/check-phi.js`)

Automatically scans staged files for sensitive data patterns before commits.

**Detected Patterns:**
- Social Security Numbers (SSN)
- Credit Card Numbers
- Medical Record Numbers (MRN)
- Phone Numbers
- Email Addresses
- API Keys and Tokens
- AWS Access Keys
- Private Keys
- Passwords

**Usage:**
```bash
# Runs automatically on git commit
git commit -m "Your message"

# Run manually
npm run check:phi

# Bypass (use with caution!)
git commit --no-verify
```

**Example Output:**
```
🔍 Scanning for PHI/PII patterns...

⚠️  Potential PHI/PII patterns detected:

📄 src/config.ts
   Line 42: API Key or Token (API_KEY)
   Match: "apiKey: sk-1234567890abcdef"
   Context: const config = { apiKey: sk-1234567890abcdef };

❌ COMMIT BLOCKED: Potential sensitive data detected
```

### How to Handle False Positives

If the detection flags legitimate code:

1. **Mark as Example/Test Data:**
   ```typescript
   // Example only - not real data
   const testSSN = '123-45-6789'; // Test SSN
   ```

2. **Use Placeholder Values:**
   ```typescript
   const placeholderSSN = 'xxx-xx-xxxx';
   const mockEmail = 'user@example.com';
   ```

3. **Add to Allowed Contexts:**
   Edit `scripts/check-phi.js` and add to `ALLOWED_CONTEXTS` array.

## CI/CD Pipeline

### Security and Quality Checks Workflow

Runs on every pull request and push to main.

**Jobs:**

1. **Lint and Format** 
   - Prettier formatting check
   - ESLint code quality
   - Status: ✅ Must pass

2. **Type Check**
   - TypeScript compilation
   - Ensures type safety
   - Status: ✅ Must pass

3. **Tests**
   - Gateway tests (`npm run test:gateway`)
   - Plugin tests (`npm run test:plugins`)
   - Status: ⚠️ Informational (some tests may be incomplete)

4. **Security Scan**
   - npm audit for vulnerabilities
   - Moderate+ severity threshold
   - Artifacts: `security-audit-results.json`
   - Status: ⚠️ Informational

5. **PHI Detection**
   - Scans all tracked files
   - Blocks on sensitive data detection
   - Status: ✅ Must pass

6. **Build Check**
   - Verifies project builds
   - Builds plugins
   - Status: ✅ Must pass

7. **Quality Gate Summary**
   - Aggregates all results
   - Provides pass/fail verdict
   - Status: ✅ Must pass

### Running Checks Locally

```bash
# All quality checks
npm run check:all

# Individual checks
npm run format:check   # Code formatting
npm run check:types    # TypeScript types
npm run check:phi      # PHI detection
npm run check:security # Security audit

# Tests
npm run test:all       # All tests
npm run test:gateway   # Gateway only
npm run test:plugins   # Plugins only
```

## Developer Workflow

### Daily Development

1. **Write Code:**
   - Follow patterns in `.github/copilot-instructions.md`
   - Never hardcode sensitive data
   - Use environment variables

2. **Before Commit:**
   ```bash
   npm run format      # Auto-fix formatting
   npm run check:all   # Run all checks
   ```

3. **Commit:**
   ```bash
   git add .
   git commit -m "Your message"
   # Pre-commit hooks run automatically
   ```

4. **Push:**
   ```bash
   git push
   # Pre-push hooks run build and tests
   # CI/CD pipeline runs on GitHub
   ```

### Working with PHI/PII

**❌ NEVER:**
- Commit real PHI/PII data
- Log sensitive information
- Store unencrypted sensitive data
- Include sensitive data in error messages

**✅ ALWAYS:**
- Use placeholder/mock data for tests
- Mark test data clearly
- De-identify before logging
- Use encryption for sensitive data
- Follow audit logging requirements

### Example: Adding a Feature with PHI

```typescript
import { deIdentify } from './services/deidentify'; // Coming in PR 2
import { auditLog } from './services/audit'; // Coming in PR 2

async function processUserData(data: UserData) {
  // 1. Detect PHI
  const detection = deIdentify.detect(data.text);
  
  if (detection.hasPHI) {
    // 2. Audit log the detection
    await auditLog.record('phi_detected', {
      types: detection.types,
      count: detection.matches.length
    });
    
    // 3. Redact before processing
    data.text = deIdentify.redact(data.text);
  }
  
  // 4. Process safely
  return await processData(data);
}

// 5. Log without PHI
logger.info('Processing complete', {
  userId: data.userId, // ID only, no PHI
  duration: performance.now() - start
});
```

## Security Checklist

Before merging any PR, verify:

- [ ] No hardcoded secrets or credentials
- [ ] All sensitive data is de-identified before logging
- [ ] Audit logs present for PHI access (when applicable)
- [ ] Input validation implemented
- [ ] Error messages don't leak sensitive information
- [ ] Tests cover security scenarios
- [ ] Documentation updated
- [ ] Pre-commit checks pass
- [ ] CI/CD pipeline passes

## Emergency Procedures

### Security Incident

1. **Immediate Actions:**
   - Stop all deployments
   - Isolate affected systems
   - Notify security team

2. **Documentation:**
   - Document timeline with timestamps
   - Preserve all evidence
   - Do not delete logs or data

3. **Follow-up:**
   - Incident response plan
   - Root cause analysis
   - Implement corrective measures

### PHI Breach

1. **Immediate Actions:**
   - Isolate affected systems immediately
   - Stop data flow
   - Notify compliance team

2. **Assessment:**
   - Identify affected individuals
   - Determine scope of exposure
   - Document all details

3. **Notification:**
   - Follow HIPAA breach notification rules
   - Notify affected parties within 60 days
   - File required reports

4. **Remediation:**
   - Implement fixes
   - Review and update policies
   - Additional training if needed

## Configuration Files

### `.husky/pre-commit`
```bash
npm run format:check || (npm run format && return 1)
node scripts/check-phi.js
```

### `package.json` Scripts
```json
{
  "check:phi": "node scripts/check-phi.js",
  "check:security": "npm audit --audit-level=moderate",
  "check:types": "tsc --noEmit",
  "check:all": "npm run format:check && npm run check:types && npm run check:phi && npm run check:security"
}
```

## References

- [ADR-001: PHI and Privacy Architecture](../docs/adr/001-phi-and-privacy-architecture.md)
- [GitHub Copilot Instructions](copilot-instructions.md)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## Future Enhancements

Coming in future PRs:

- **PR 2**: Runtime de-identification module with audit logging
- **PR 3**: Chunking and evaluation framework for large documents
- **PR 4**: RAG provider abstraction with local-first defaults
- **PR 5**: End-to-end integration and comprehensive documentation

## Support

For questions or issues:
1. Check [GitHub Discussions](https://github.com/Portkey-AI/gateway/discussions)
2. Review [Contributing Guidelines](../../CONTRIBUTING.md)
3. Contact security team for sensitive issues

---

**Remember**: Security and privacy are not optional features—they are fundamental requirements that must be built into every aspect of the codebase.
