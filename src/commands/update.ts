// src/commands/update.ts
import chalk from 'chalk';
import { getInstaller } from '../installers/index.js';
import { listSkills } from '../core/registry.js';

export async function updateCommand(skillName?: string): Promise<void> {
  if (skillName) {
    // 更新指定 skill
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
      await installer.update();
    } catch (error) {
      console.error(chalk.red(`Update failed: ${(error as Error).message}`));
      process.exit(1);
    }
  } else {
    // 更新所有已安装的 skills
    const skills = listSkills();
    
    if (skills.length === 0) {
      console.log(chalk.yellow('No skills installed.'));
      return;
    }
    
    for (const skill of skills) {
      const installer = getInstaller(skill.name);
      if (installer) {
        console.log(chalk.cyan(`Updating ${skill.name}...`));
        try {
          await installer.update();
        } catch (error) {
          console.error(chalk.red(`Failed to update ${skill.name}: ${(error as Error).message}`));
        }
      }
    }
  }
}