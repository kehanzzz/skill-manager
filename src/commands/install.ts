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

/**
 * 确定目标平台
 */
function resolvePlatforms(options: InstallCommandOptions): Platform[] {
  if (options.all) {
    return ['opencode', 'claudecode', 'generic'];
  } else if (options.platform) {
    const validPlatforms = ['opencode', 'claudecode', 'generic'];
    const requested = options.platform.split(',').map(p => p.trim()) as Platform[];
    const platforms = requested.filter(p => validPlatforms.includes(p));
    
    if (platforms.length === 0) {
      console.error(chalk.red(`Invalid platform: ${options.platform}`));
      console.log(chalk.gray('Valid platforms: opencode, claudecode, generic'));
      process.exit(1);
    }
    return platforms;
  } else {
    return [detectPlatform()];
  }
}

export async function installCommand(skillName: string, options: InstallCommandOptions): Promise<void> {
  const platforms = resolvePlatforms(options);
  
  if (skillName === 'all') {
    await installAllSkills(platforms, options.force);
    return;
  }
  
  const installer = getInstaller(skillName);
  if (!installer) {
    console.error(chalk.red(`Unknown skill: ${skillName}`));
    console.log(chalk.gray('Available skills:'));
    for (const i of listInstallers()) {
      console.log(chalk.gray(`  - ${i.name}: ${i.description}`));
    }
    process.exit(1);
  }
  
  console.log(chalk.cyan(`Installing ${skillName} to: ${platforms.join(', ')}`));
  
  try {
    await installer.install(platforms, options.force);
  } catch (error) {
    console.error(chalk.red(`Installation failed: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * 安装所有可用的 skills
 * - 已安装的跳过
 * - 失败的继续安装其他，最后汇总报告
 */
async function installAllSkills(platforms: Platform[], force?: boolean): Promise<void> {
  const installers = listInstallers();
  const results: { name: string; status: 'success' | 'skipped' | 'failed'; message?: string }[] = [];
  
  console.log(chalk.cyan(`\nInstalling all skills to: ${platforms.join(', ')}\n`));
  
  for (const installer of installers) {
    if (!force && installer.isInstalled()) {
      console.log(chalk.yellow(`  ○ ${installer.name} - already installed, skip`));
      results.push({ name: installer.name, status: 'skipped' });
      continue;
    }
    
    console.log(chalk.cyan(`  Installing ${installer.name}...`));
    
    try {
      await installer.install(platforms, force);
      console.log(chalk.green(`  ✓ ${installer.name} - installed`));
      results.push({ name: installer.name, status: 'success' });
    } catch (error) {
      const message = (error as Error).message;
      console.error(chalk.red(`  ✗ ${installer.name} - failed: ${message}`));
      results.push({ name: installer.name, status: 'failed', message });
    }
}

  console.log(chalk.bold('\n--- Summary ---\n'));
  
  const success = results.filter(r => r.status === 'success');
  const skipped = results.filter(r => r.status === 'skipped');
  const failed = results.filter(r => r.status === 'failed');
  
  if (success.length > 0) {
    console.log(chalk.green(`✓ Installed: ${success.length}`));
    for (const r of success) {
      console.log(chalk.gray(`    - ${r.name}`));
    }
  }
  
  if (skipped.length > 0) {
    console.log(chalk.yellow(`○ Skipped: ${skipped.length}`));
    for (const r of skipped) {
      console.log(chalk.gray(`    - ${r.name}`));
    }
  }
  
  if (failed.length > 0) {
    console.log(chalk.red(`✗ Failed: ${failed.length}`));
    for (const r of failed) {
      console.log(chalk.gray(`    - ${r.name}: ${r.message}`));
    }
    console.log();
    process.exit(1);
  }
  
  console.log();
}