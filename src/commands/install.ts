// src/commands/install.ts
import chalk from 'chalk';
import { Platform } from '../types/index.js';
import { getInstaller, listInstallers } from '../installers/index.js';
import { detectPlatform } from '../core/platform.js';

export interface InstallCommandOptions {
  platform?: string;
  all?: boolean;
  force?: boolean;
}

export async function installCommand(skillName: string, options: InstallCommandOptions): Promise<void> {
  // 验证 skill 名称
  const installer = getInstaller(skillName);
  if (!installer) {
    console.error(chalk.red(`Unknown skill: ${skillName}`));
    console.log(chalk.gray('Available skills:'));
    for (const i of listInstallers()) {
      console.log(chalk.gray(`  - ${i.name}: ${i.description}`));
    }
    process.exit(1);
  }
  
  // 确定目标平台
  let platforms: Platform[];
  
  if (options.all) {
    platforms = ['opencode', 'claudecode', 'generic'];
  } else if (options.platform) {
    const validPlatforms = ['opencode', 'claudecode', 'generic'];
    const requested = options.platform.split(',').map(p => p.trim()) as Platform[];
    platforms = requested.filter(p => validPlatforms.includes(p));
    
    if (platforms.length === 0) {
      console.error(chalk.red(`Invalid platform: ${options.platform}`));
      console.log(chalk.gray('Valid platforms: opencode, claudecode, generic'));
      process.exit(1);
    }
  } else {
    platforms = [detectPlatform()];
  }
  
  console.log(chalk.cyan(`Installing ${skillName} to: ${platforms.join(', ')}`));
  
  try {
    await installer.install(platforms, options.force);
  } catch (error) {
    console.error(chalk.red(`Installation failed: ${(error as Error).message}`));
    process.exit(1);
  }
}