// src/commands/list.ts
import chalk from 'chalk';
import { listSkills } from '../core/registry.js';
import { listInstallers } from '../installers/index.js';

export interface ListCommandOptions {
  json?: boolean;
}

export function listCommand(options: ListCommandOptions): void {
  const installed = listSkills();
  const available = listInstallers();
  
  if (options.json) {
    console.log(JSON.stringify({
      installed,
      available: available.map(i => ({
        name: i.name,
        description: i.description,
        repoUrl: i.repoUrl,
      })),
    }, null, 2));
    return;
  }
  
  console.log(chalk.bold('\nInstalled Skills:\n'));
  
  if (installed.length === 0) {
    console.log(chalk.gray('  No skills installed.'));
  } else {
    for (const skill of installed) {
      console.log(chalk.green(`  ✓ ${skill.name}`));
      console.log(chalk.gray(`    Method: ${skill.method}`));
      console.log(chalk.gray(`    Platforms: ${skill.platforms.join(', ')}`));
      console.log(chalk.gray(`    Updated: ${new Date(skill.updatedAt).toLocaleDateString()}`));
      if (skill.commit) {
        console.log(chalk.gray(`    Commit: ${skill.commit.slice(0, 7)}`));
      }
      if (skill.version) {
        console.log(chalk.gray(`    Version: ${skill.version}`));
      }
      console.log();
    }
  }
  
  console.log(chalk.bold('\nAvailable Skills:\n'));
  
  for (const installer of available) {
    const isInstalled = installed.some(s => s.name === installer.name);
    const status = isInstalled ? chalk.green('✓') : chalk.gray('○');
    console.log(`  ${status} ${chalk.cyan(installer.name)} - ${installer.description}`);
  }
  
  console.log();
}