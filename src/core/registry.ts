// src/core/registry.ts
import fs from 'fs';
import { Registry, SkillRecord, Platform } from '../types/index.js';
import { PATHS } from './platform.js';

const DEFAULT_REGISTRY: Registry = {
  version: '1.0',
  skills: {},
};

export function loadRegistry(): Registry {
  if (!fs.existsSync(PATHS.registryFile)) {
    return { ...DEFAULT_REGISTRY };
  }
  
  try {
    const content = fs.readFileSync(PATHS.registryFile, 'utf-8');
    return JSON.parse(content) as Registry;
  } catch {
    return { ...DEFAULT_REGISTRY };
  }
}

export function saveRegistry(registry: Registry): void {
  if (!fs.existsSync(PATHS.registryDir)) {
    fs.mkdirSync(PATHS.registryDir, { recursive: true });
  }
  fs.writeFileSync(PATHS.registryFile, JSON.stringify(registry, null, 2));
}

export function getSkillInfo(name: string): SkillRecord | null {
  const registry = loadRegistry();
  return registry.skills[name] || null;
}

export function registerSkill(record: SkillRecord): void {
  const registry = loadRegistry();
  registry.skills[record.name] = record;
  saveRegistry(registry);
}

export function unregisterSkill(name: string): void {
  const registry = loadRegistry();
  delete registry.skills[name];
  saveRegistry(registry);
}

export function listSkills(): SkillRecord[] {
  const registry = loadRegistry();
  return Object.values(registry.skills);
}

export function isSkillInstalled(name: string, platforms?: Platform[]): boolean {
  const info = getSkillInfo(name);
  if (!info) return false;
  if (!platforms || platforms.length === 0) return true;
  // 检查是否已安装到所有请求的platforms
  return platforms.every(p => info.platforms.includes(p));
}