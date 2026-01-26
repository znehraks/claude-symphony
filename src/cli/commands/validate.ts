/**
 * Validate CLI command
 * Configuration validation
 * Uses core/config/validator.ts
 */
import { existsSync } from 'fs';
import path from 'path';
import {
  ConfigValidator,
  printValidationSummary,
  printRecoveryGuide,
  type ValidatorOptions,
} from '../../core/config/validator.js';
import { logError } from '../../utils/logger.js';

/**
 * Validate options
 */
export interface ValidateOptions {
  fix?: boolean;
  verbose?: boolean;
  stage?: string;
  rule?: string;
  json?: boolean;
  recoveryGuide?: boolean;
}

/**
 * Run configuration validation
 */
export async function validateConfig(
  projectRoot: string,
  options: ValidateOptions = {}
): Promise<number> {
  // Show recovery guide
  if (options.recoveryGuide) {
    printRecoveryGuide();
    return 0;
  }

  // Check project structure
  const configDir = path.join(projectRoot, 'config');
  const stagesDir = path.join(projectRoot, 'stages');

  if (!existsSync(configDir)) {
    logError(`Config directory not found: ${configDir}`);
    return 1;
  }

  if (!existsSync(stagesDir)) {
    logError(`Stages directory not found: ${stagesDir}`);
    return 1;
  }

  // Validate stage filter
  if (options.stage && !existsSync(path.join(stagesDir, options.stage))) {
    logError(`Invalid stage: ${options.stage}`);
    return 1;
  }

  // Print header
  if (!options.json) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🔧 claude-symphony Configuration Validator v1.0.0');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  // Run validator
  const validatorOptions: ValidatorOptions = {
    fix: options.fix,
    verbose: options.verbose,
    stage: options.stage,
    rule: options.rule,
  };

  const validator = new ConfigValidator(projectRoot, validatorOptions);
  const summary = await validator.validate();

  // Output results
  if (options.json) {
    const exitCode = validator.getExitCode();
    console.log(JSON.stringify({
      summary: {
        critical: summary.critical,
        high: summary.high,
        medium: summary.medium,
        passed: summary.passed,
        fixed: summary.fixed,
      },
      exit_code: exitCode,
      filters: {
        stage: options.stage ?? null,
        rule: options.rule ?? null,
      },
    }, null, 2));
  } else {
    printValidationSummary(summary);
  }

  return validator.getExitCode();
}
