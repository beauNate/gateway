# Architecture Decision Records (ADR)

This directory contains Architecture Decision Records (ADRs) for the Portkey AI Gateway project. ADRs document significant architectural decisions, their context, consequences, and rationale.

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences. ADRs help teams:

- Understand why decisions were made
- Onboard new team members
- Review and challenge decisions
- Track the evolution of the architecture

## ADR Format

Each ADR follows this structure:

1. **Title**: Short noun phrase (e.g., "ADR-001: PHI and Privacy Architecture")
2. **Status**: Proposed, Accepted, Deprecated, Superseded
3. **Date**: When the decision was made
4. **Context**: The issue motivating this decision
5. **Decision**: The decision that was made
6. **Consequences**: The results of the decision (positive and negative)

## Index of ADRs

| Number | Title | Status | Date |
|--------|-------|--------|------|
| [ADR-001](001-phi-and-privacy-architecture.md) | PHI and Privacy Architecture | Accepted | 2025-11-11 |
| ADR-002 | De-identification Strategy | Proposed | TBD |
| ADR-003 | Chunking and Evaluation Approach | Proposed | TBD |
| ADR-004 | RAG Provider Architecture | Proposed | TBD |
| ADR-005 | Final Architecture and Security Model | Proposed | TBD |

## Creating a New ADR

1. Copy the template below to a new file: `XXX-title-in-kebab-case.md`
2. Fill in the sections based on the decision
3. Submit for review via pull request
4. Update this index when the ADR is accepted

## ADR Template

```markdown
# ADR-XXX: [Title]

## Status

[Proposed | Accepted | Deprecated | Superseded by ADR-YYY]

## Date

YYYY-MM-DD

## Context

What is the issue that we're seeing that is motivating this decision or change?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?

### Positive
- Benefit 1
- Benefit 2

### Negative
- Cost 1
- Cost 2

### Mitigation
- How we'll address the negative consequences

## References

- Link 1
- Link 2

## Related Decisions

- ADR-XXX: Related decision
```

## Guidelines

- **Keep it concise**: Focus on the decision and its rationale
- **Be specific**: Provide concrete examples and code snippets where helpful
- **Consider alternatives**: Mention alternatives considered and why they were rejected
- **Update status**: Mark as deprecated or superseded when decisions change
- **Link related ADRs**: Create connections between related decisions
- **Use diagrams**: Include architecture diagrams when they add clarity

## Resources

- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) by Michael Nygard
- [ADR GitHub Organization](https://adr.github.io/)
- [Architecture Decision Records in Action](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records)
