// src/commands/remove.ts
import chalk from 'chalk';
import { getInstaller } from '../installers/index.js';

export interface RemoveCommandOptions {
  purge?: boolean;
}

export async function removeCommand(skillName: string, options: RemoveCommandOptions): Promise<void> {
  const installer = getInstaller(skillName);
  
  if (!installer) {
    console.error(chalk.red(`Unknown skill: ${skillName}`));
    process.exit(1);
  }
  
  if (!installer.isInstalled()) {
    console.error(chalk.red(`${skillName} is not installed.`));
    process.exit(1);
  }
  
  try {
    await installer.remove(options.purge);
  } catch (error) {
    console.error(chalk.red(`Remove failed: ${(error as Error).message}`));
    process.exit(1);
  }
}