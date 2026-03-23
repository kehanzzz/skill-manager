// src/types/index.ts

export type Platform = 'opencode' | 'claudecode' | 'generic';

export type InstallMethod = 'symlink' | 'clone' | 'cli' | 'npm' | 'uv';

export interface SkillRecord {
  name: string;
  repoUrl: string;
  method: InstallMethod;
  clonePath?: string;
  targetPath: string;
  commit?: string;
  version?: string;
  installedAt: string;
  updatedAt: string;
  platforms: Platform[];
}

export interface Registry {
  version: string;
  skills: Record<string, SkillRecord>;
}

export interface SkillInstaller {
  name: string;
  repoUrl: string;
  description: string;

  install(platforms: Platform[], force?: boolean): Promise<void>;
  update(): Promise<void>;
  remove(purge?: boolean): Promise<void>;
  isInstalled(platforms?: Platform[]): boolean;
  getInfo(): SkillRecord | null;
}

export interface InstallOptions {
  platforms: Platform[];
  force?: boolean;
}

export interface UpdateOptions {
  checkOnly?: boolean;
}

export interface RemoveOptions {
  purge?: boolean;
}