#!/usr/bin/env node

/**
 * PHI and PII Detection Script
 *
 * Scans staged files for potential PHI/PII patterns to prevent accidental commits.
 * This is a pre-commit check to ensure sensitive data is not committed to the repository.
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

// PHI/PII patterns to detect
const PHI_PATTERNS = [
  // Social Security Numbers
  {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    name: 'SSN',
    description: 'Social Security Number',
  },
  {
    pattern: /\b\d{9}\b/g,
    name: 'SSN_NO_DASH',
    description: 'Social Security Number (no dashes)',
  },

  // Credit Card Numbers
  {
    pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    name: 'CREDIT_CARD',
    description: 'Credit Card Number',
  },

  // Phone Numbers
  {
    pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    name: 'PHONE',
    description: 'Phone Number',
  },

  // Email Addresses (in test data or comments)
  {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    name: 'EMAIL',
    description: 'Email Address',
  },

  // Medical Record Numbers (common patterns)
  {
    pattern: /\b(?:MRN|MR|MEDICAL[-_\s]?RECORD)[-_\s]?#?[-_\s]?\d{6,10}\b/gi,
    name: 'MRN',
    description: 'Medical Record Number',
  },

  // Date of Birth patterns
  {
    pattern:
      /\b(?:DOB|DATE[-_\s]?OF[-_\s]?BIRTH)[-_\s]?:?[-_\s]?\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/gi,
    name: 'DOB',
    description: 'Date of Birth',
  },

  // IP Addresses (can be PII in some contexts)
  {
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    name: 'IP_ADDRESS',
    description: 'IP Address',
  },

  // API Keys and Tokens (security sensitive)
  {
    pattern:
      /\b(?:api[-_]?key|apikey|api[-_]?secret|bearer|token)[-_\s]*[:=]\s*['"]?[A-Za-z0-9_\-]{20,}['"]?/gi,
    name: 'API_KEY',
    description: 'API Key or Token',
  },

  // AWS Keys
  {
    pattern: /AKIA[0-9A-Z]{16}/g,
    name: 'AWS_KEY',
    description: 'AWS Access Key',
  },

  // Private Keys
  {
    pattern: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g,
    name: 'PRIVATE_KEY',
    description: 'Private Key',
  },

  // Passwords in configuration
  {
    pattern: /\b(?:password|passwd|pwd)[-_\s]*[:=]\s*['"]?[^\s'"]{8,}['"]?/gi,
    name: 'PASSWORD',
    description: 'Password',
  },
];

// File extensions to scan
const SCANNABLE_EXTENSIONS = [
  '.ts',
  '.js',
  '.json',
  '.md',
  '.txt',
  '.env',
  '.yaml',
  '.yml',
];

// Paths to ignore
const IGNORE_PATHS = [
  'node_modules/',
  'dist/',
  'build/',
  'coverage/',
  '.git/',
  'package-lock.json',
  'scripts/check-phi.js', // Ignore this file itself
];

// Allowed contexts (won't flag as violations)
const ALLOWED_CONTEXTS = [
  'example',
  'sample',
  'test',
  'mock',
  'dummy',
  'placeholder',
  'xxx-xx-', // Placeholder SSN pattern
  '000-00-',
  '123-45-6789', // Common test SSN
  'author', // Package.json author field
  'portkey.ai', // Company domain
  'support@', // Support email addresses
  'not-real', // Explicitly marked as not real
];

/**
 * Check if a match is in an allowed context
 */
function isAllowedContext(line, match) {
  const lowerLine = line.toLowerCase();
  const lowerMatch = match.toLowerCase();

  // Check if line contains allowed context keywords
  for (const context of ALLOWED_CONTEXTS) {
    if (lowerLine.includes(context) || lowerMatch.includes(context)) {
      return true;
    }
  }

  return false;
}

/**
 * Scan a file for PHI/PII patterns
 */
function scanFile(filePath) {
  const issues = [];

  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];

      for (const { pattern, name, description } of PHI_PATTERNS) {
        const matches = [...line.matchAll(pattern)];

        for (const match of matches) {
          // Skip if in allowed context
          if (isAllowedContext(line, match[0])) {
            continue;
          }

          issues.push({
            file: filePath,
            line: lineNum + 1,
            pattern: name,
            description,
            match: match[0],
            context: line.trim(),
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message);
  }

  return issues;
}

/**
 * Get list of staged files
 */
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8',
    });
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error getting staged files:', error.message);
    return [];
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning for PHI/PII patterns...\n');

  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    console.log('No staged files to scan.');
    return 0;
  }

  const filesToScan = stagedFiles.filter((file) => {
    // Check if file should be ignored
    if (IGNORE_PATHS.some((path) => file.includes(path))) {
      return false;
    }

    // Check if file extension is scannable
    const hasScannable = SCANNABLE_EXTENSIONS.some((ext) => file.endsWith(ext));

    // Check if file exists (might be deleted)
    return hasScannable && existsSync(file);
  });

  console.log(`Scanning ${filesToScan.length} files...\n`);

  let allIssues = [];

  for (const file of filesToScan) {
    const issues = scanFile(file);
    allIssues = allIssues.concat(issues);
  }

  if (allIssues.length === 0) {
    console.log('✅ No PHI/PII patterns detected. Safe to commit.');
    return 0;
  }

  // Group issues by file
  const issuesByFile = {};
  for (const issue of allIssues) {
    if (!issuesByFile[issue.file]) {
      issuesByFile[issue.file] = [];
    }
    issuesByFile[issue.file].push(issue);
  }

  console.log('⚠️  Potential PHI/PII patterns detected:\n');

  for (const [file, issues] of Object.entries(issuesByFile)) {
    console.log(`\n📄 ${file}`);
    for (const issue of issues) {
      console.log(
        `   Line ${issue.line}: ${issue.description} (${issue.pattern})`
      );
      console.log(`   Match: "${issue.match}"`);
      console.log(
        `   Context: ${issue.context.substring(0, 80)}${issue.context.length > 80 ? '...' : ''}`
      );
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('❌ COMMIT BLOCKED: Potential sensitive data detected');
  console.log('='.repeat(80));
  console.log('\nIf these are false positives (test data, examples, etc.):');
  console.log('1. Ensure they are clearly marked as test/example data');
  console.log('2. Use obvious placeholder values (e.g., xxx-xx-xxxx for SSN)');
  console.log('3. Add comments explaining they are not real data');
  console.log(
    '\nIf you need to commit this anyway, use: git commit --no-verify'
  );
  console.log("(But please make sure it's safe to do so!)\n");

  return 1;
}

// Run the script
const exitCode = main();
process.exit(exitCode);
