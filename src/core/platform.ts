// src/core/platform.ts
import os from 'os';
import path from 'path';
import fs from 'fs';
import { Platform } from '../types/index.js';

const home = os.homedir();

export const PATHS = {
  registryDir: path.join(home, '.skill-manager'),
  reposDir: path.join(home, '.skill-manager', 'repos'),
  registryFile: path.join(home, '.skill-manager', 'registry.json'),
  
  opencode: {
    root: path.join(home, '.config', 'opencode'),
    skills: path.join(home, '.config', 'opencode', 'skills'),
    plugins: path.join(home, '.config', 'opencode', 'plugins'),
  },
  
  claudecode: {
    root: path.join(home, '.claude'),
    skills: path.join(home, '.claude', 'skills'),
  },
  
  generic: {
    root: path.join(home, '.agents'),
    skills: path.join(home, '.agents', 'skills'),
  },
} as const;

export function getSkillsPath(platform: Platform): string {
  return PATHS[platform].skills;
}

export function detectPlatform(): Platform {
  if (process.env.OPENCODE_SESSION) return 'opencode';
  if (process.env.CLAUDE_CODE_SESSION) return 'claudecode';
  return 'generic';
}

export function ensureDirectories(platforms: Platform[]): void {
  if (!fs.existsSync(PATHS.registryDir)) {
    fs.mkdirSync(PATHS.registryDir, { recursive: true });
  }
  if (!fs.existsSync(PATHS.reposDir)) {
    fs.mkdirSync(PATHS.reposDir, { recursive: true });
  }
  
  for (const platform of platforms) {
    const skillsPath = PATHS[platform].skills;
    if (!fs.existsSync(skillsPath)) {
      fs.mkdirSync(skillsPath, { recursive: true });
    }
    if (platform === 'opencode') {
      const pluginsPath = PATHS.opencode.plugins;
      if (!fs.existsSync(pluginsPath)) {
        fs.mkdirSync(pluginsPath, { recursive: true });
      }
    }
  }
}