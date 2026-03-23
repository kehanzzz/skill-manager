#!/usr/bin/env node
// src/index.ts
import { Command } from 'commander';
import { installCommand } from './commands/install.js';
import { updateCommand } from './commands/update.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

program
  .name('skill-manager')
  .description('Manage AI coding assistant skills')
  .version(version);

program
  .command('install <skill>')
  .description('Install a skill (use "all" to install all available skills)')
  .option('-p, --platform <platform>', 'Target platform (opencode, claudecode, generic)')
  .option('-a, --all', 'Install to all platforms')
  .option('-f, --force', 'Force reinstall')
  .action(async (skill, options) => {
    await installCommand(skill, options);
  });

program
  .command('update [skill]')
  .description('Update a skill (or all skills if no skill specified)')
  .action(async (skill) => {
    await updateCommand(skill);
  });

program
  .command('list')
  .description('List installed and available skills')
  .option('-j, --json', 'Output as JSON')
  .action((options) => {
    listCommand(options);
  });

program
  .command('remove <skill>')
  .description('Remove a skill')
  .option('--purge', 'Also remove the cloned repository')
  .action(async (skill, options) => {
    await removeCommand(skill, options);
  });

program.parse();