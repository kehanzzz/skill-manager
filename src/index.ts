#!/usr/bin/env node
// src/index.ts
import { Command } from 'commander';
import { installCommand } from './commands/install.js';
import { updateCommand } from './commands/update.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';

const program = new Command();

program
  .name('skill-manager')
  .description('Manage AI coding assistant skills')
  .version('1.0.0');

program
  .command('install <skill>')
  .description('Install a skill')
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