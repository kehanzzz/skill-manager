# Skill Manager 实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个 CLI 工具，用于安装、更新和管理三个特定的 skill：superpowers、planning-with-files、ui-ux-pro-max

**Architecture:** TypeScript CLI 工具，使用安装器模式，每个 skill 有独立的安装器实现不同的安装策略（symlink/clone/cli）。注册表存储安装状态，支持跨平台安装。

**Tech Stack:** TypeScript, Commander.js, chalk, tsx/tsup

---

## File Structure

```
skill-manager/
├── src/
│   ├── index.ts                    # CLI 入口，命令注册
│   ├── commands/
│   │   ├── install.ts              # install <skill> 命令
│   │   ├── update.ts               # update <skill> 命令
│   │   ├── list.ts                 # list 命令
│   │   └── remove.ts               # remove <skill> 命令
│   ├── installers/
│   │   ├── base.ts                 # SkillInstaller 基类
│   │   ├── superpowers.ts          # superpowers 安装器
│   │   ├── planning-with-files.ts  # planning-with-files 安装器
│   │   └── ui-ux-pro-max.ts        # ui-ux-pro-max 安装器
│   │   └── index.ts                # 安装器注册表
│   ├── core/
│   │   ├── git.ts                  # Git 操作封装
│   │   ├── symlink.ts              # 符号链接操作
│   │   ├── registry.ts             # 安装注册表管理
│   │   └── platform.ts             # 平台检测和路径
│   └── types/
│       └── index.ts                # 类型定义
├── package.json
├── tsconfig.json
└── README.md
```

---

## Chunk 1: 项目初始化

### Task 1.1: 初始化项目

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`

- [ ] **Step 1: 创建 package.json**

```bash
cd /Users/didi/dev/ai/project/tools/skill-manager
npm init -y
```

- [ ] **Step 2: 安装依赖**

```bash
npm install commander chalk
npm install -D typescript tsx @types/node
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: 更新 package.json 添加 bin 和 scripts**

```json
{
  "name": "skill-manager",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "skill-manager": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts"
  }
}
```

- [ ] **Step 5: 创建目录结构**

```bash
mkdir -p src/{commands,installers,core,types}
```

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: initialize skill-manager project"
```

---

### Task 1.2: 类型定义

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 创建类型定义文件**

```typescript
// src/types/index.ts

export type Platform = 'opencode' | 'claudecode' | 'generic';

export type InstallMethod = 'symlink' | 'clone' | 'cli';

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
  isInstalled(): boolean;
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add type definitions"
```

---

### Task 1.3: 平台检测和路径

**Files:**
- Create: `src/core/platform.ts`

- [ ] **Step 1: 创建平台路径模块**

```typescript
// src/core/platform.ts
import os from 'os';
import path from 'path';
import { Platform } from '../types/index.js';

const home = os.homedir();

export const PATHS = {
  // 注册表和仓库存储
  registryDir: path.join(home, '.skill-manager'),
  reposDir: path.join(home, '.skill-manager', 'repos'),
  registryFile: path.join(home, '.skill-manager', 'registry.json'),
  
  // OpenCode 路径
  opencode: {
    root: path.join(home, '.config', 'opencode'),
    skills: path.join(home, '.config', 'opencode', 'skills'),
    plugins: path.join(home, '.config', 'opencode', 'plugins'),
  },
  
  // ClaudeCode 路径
  claudecode: {
    root: path.join(home, '.claude'),
    skills: path.join(home, '.claude', 'skills'),
  },
  
  // 通用路径
  generic: {
    root: path.join(home, '.agents'),
    skills: path.join(home, '.agents', 'skills'),
  },
} as const;

export function getSkillsPath(platform: Platform): string {
  return PATHS[platform].skills;
}

export function detectPlatform(): Platform {
  // 检测当前运行环境
  if (process.env.OPENCODE_SESSION) return 'opencode';
  if (process.env.CLAUDE_CODE_SESSION) return 'claudecode';
  return 'generic';
}

export function ensureDirectories(platforms: Platform[]): void {
  const fs = await import('fs');
  
  // 确保主目录存在
  if (!fs.existsSync(PATHS.registryDir)) {
    fs.mkdirSync(PATHS.registryDir, { recursive: true });
  }
  if (!fs.existsSync(PATHS.reposDir)) {
    fs.mkdirSync(PATHS.reposDir, { recursive: true });
  }
  
  // 确保各平台目录存在
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
```

等等，`ensureDirectories` 使用了 await 但函数不是 async。修复：

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/core/platform.ts
git commit -m "feat: add platform detection and path utilities"
```

---

### Task 1.4: 注册表管理

**Files:**
- Create: `src/core/registry.ts`

- [ ] **Step 1: 创建注册表模块**

```typescript
// src/core/registry.ts
import fs from 'fs';
import { Registry, SkillRecord } from '../types/index.js';
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

export function isSkillInstalled(name: string): boolean {
  const info = getSkillInfo(name);
  return info !== null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/core/registry.ts
git commit -m "feat: add registry management"
```

---

### Task 1.5: Git 操作封装

**Files:**
- Create: `src/core/git.ts`

- [ ] **Step 1: 创建 Git 模块**

```typescript
// src/core/git.ts
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export function isGitInstalled(): boolean {
  try {
    execSync('git --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function clone(url: string, targetPath: string): void {
  const parentDir = path.dirname(targetPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
  
  if (fs.existsSync(targetPath)) {
    throw new Error(`Target path already exists: ${targetPath}`);
  }
  
  execSync(`git clone --depth 1 ${url} ${targetPath}`, {
    stdio: 'inherit',
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
    },
  });
}

export function pull(repoPath: string): boolean {
  if (!fs.existsSync(path.join(repoPath, '.git'))) {
    throw new Error(`Not a git repository: ${repoPath}`);
  }
  
  try {
    execSync('git pull', { cwd: repoPath, stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

export function getCommitSha(repoPath: string): string {
  const sha = execSync('git rev-parse HEAD', {
    cwd: repoPath,
    encoding: 'utf-8',
  }).trim();
  return sha;
}

export function getRemoteUrl(repoPath: string): string | null {
  try {
    const url = execSync('git remote get-url origin', {
      cwd: repoPath,
      encoding: 'utf-8',
    }).trim();
    return url;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/core/git.ts
git commit -m "feat: add git operations"
```

---

### Task 1.6: 符号链接操作

**Files:**
- Create: `src/core/symlink.ts`

- [ ] **Step 1: 创建符号链接模块**

```typescript
// src/core/symlink.ts
import fs from 'fs';
import path from 'path';

export function createSymlink(target: string, linkPath: string): void {
  // 确保目标存在
  if (!fs.existsSync(target)) {
    throw new Error(`Target does not exist: ${target}`);
  }
  
  // 如果链接已存在，先删除
  if (fs.existsSync(linkPath) || fs.lstatSync(linkPath, { throwIfNoEntry: false })) {
    fs.rmSync(linkPath, { recursive: true, force: true });
  }
  
  // 确保父目录存在
  const parentDir = path.dirname(linkPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
  
  // 创建符号链接
  fs.symlinkSync(target, linkPath);
}

export function removeSymlink(linkPath: string): void {
  if (fs.existsSync(linkPath) || fs.lstatSync(linkPath, { throwIfNoEntry: false })) {
    fs.rmSync(linkPath, { recursive: true, force: true });
  }
}

export function isSymlink(path: string): boolean {
  try {
    const stats = fs.lstatSync(path);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

export function readSymlink(linkPath: string): string | null {
  try {
    return fs.readlinkSync(linkPath);
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/core/symlink.ts
git commit -m "feat: add symlink operations"
```

---

## Chunk 2: 安装器实现

### Task 2.1: 安装器基类

**Files:**
- Create: `src/installers/base.ts`

- [ ] **Step 1: 创建基类**

```typescript
// src/installers/base.ts
import { SkillInstaller, SkillRecord, Platform } from '../types/index.js';
import { PATHS, ensureDirectories } from '../core/platform.js';
import { registerSkill, unregisterSkill, getSkillInfo } from '../core/registry.js';

export abstract class BaseInstaller implements SkillInstaller {
  abstract name: string;
  abstract repoUrl: string;
  abstract description: string;
  
  abstract install(platforms: Platform[], force?: boolean): Promise<void>;
  abstract update(): Promise<void>;
  abstract remove(purge?: boolean): Promise<void>;
  
  isInstalled(): boolean {
    return getSkillInfo(this.name) !== null;
  }
  
  getInfo(): SkillRecord | null {
    return getSkillInfo(this.name);
  }
  
  protected recordInstall(record: Partial<SkillRecord>, platforms: Platform[]): void {
    const now = new Date().toISOString();
    const fullRecord: SkillRecord = {
      name: this.name,
      repoUrl: this.repoUrl,
      method: 'clone',
      targetPath: '',
      installedAt: now,
      updatedAt: now,
      platforms,
      ...record,
    };
    registerSkill(fullRecord);
  }
  
  protected recordRemove(): void {
    unregisterSkill(this.name);
  }
  
  protected ensurePlatformDirs(platforms: Platform[]): void {
    ensureDirectories(platforms);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/installers/base.ts
git commit -m "feat: add base installer class"
```

---

### Task 2.2: Superpowers 安装器

**Files:**
- Create: `src/installers/superpowers.ts`

- [ ] **Step 1: 创建 superpowers 安装器**

```typescript
// src/installers/superpowers.ts
import fs from 'fs';
import path from 'path';
import { Platform, SkillRecord } from '../types/index.js';
import { BaseInstaller } from './base.js';
import { PATHS } from '../core/platform.js';
import { clone, pull, getCommitSha, isGitInstalled } from '../core/git.js';
import { createSymlink, removeSymlink } from '../core/symlink.js';

export class SuperpowersInstaller extends BaseInstaller {
  name = 'superpowers';
  repoUrl = 'https://github.com/obra/superpowers.git';
  description = 'Superpowers skills for AI coding assistants (TDD, debugging, planning, etc.)';
  
  private getClonePath(): string {
    return path.join(PATHS.opencode.root, 'superpowers');
  }
  
  async install(platforms: Platform[], force = false): Promise<void> {
    if (!isGitInstalled()) {
      throw new Error('Git is required. Please install Git first.');
    }
    
    const clonePath = this.getClonePath();
    
    // 检查是否已安装
    if (this.isInstalled() && !force) {
      throw new Error(`${this.name} is already installed. Use --force to reinstall.`);
    }
    
    // 强制重装时先移除
    if (force && this.isInstalled()) {
      await this.remove(false);
    }
    
    this.ensurePlatformDirs(platforms);
    
    // Clone 仓库
    if (!fs.existsSync(clonePath)) {
      console.log(`Cloning ${this.repoUrl}...`);
      clone(this.repoUrl, clonePath);
    }
    
    // 创建 plugin 符号链接 (仅 opencode)
    if (platforms.includes('opencode')) {
      const pluginSource = path.join(clonePath, '.opencode', 'plugins', 'superpowers.js');
      const pluginTarget = path.join(PATHS.opencode.plugins, 'superpowers.js');
      
      console.log(`Creating plugin symlink...`);
      createSymlink(pluginSource, pluginTarget);
    }
    
    // 创建 skills 符号链接
    for (const platform of platforms) {
      const skillsSource = path.join(clonePath, 'skills');
      const skillsTarget = path.join(PATHS[platform].skills, 'superpowers');
      
      console.log(`Creating skills symlink for ${platform}...`);
      createSymlink(skillsSource, skillsTarget);
    }
    
    // 记录安装
    const commit = getCommitSha(clonePath);
    const primaryPath = path.join(PATHS[platforms[0]].skills, 'superpowers');
    
    this.recordInstall({
      method: 'symlink',
      clonePath,
      targetPath: primaryPath,
      commit,
    }, platforms);
    
    console.log(`✓ ${this.name} installed successfully!`);
  }
  
  async update(): Promise<void> {
    const info = this.getInfo();
    if (!info) {
      throw new Error(`${this.name} is not installed.`);
    }
    
    const clonePath = info.clonePath;
    if (!clonePath) {
      throw new Error('Clone path not found in registry.');
    }
    
    console.log(`Updating ${this.name}...`);
    pull(clonePath);
    
    const commit = getCommitSha(clonePath);
    const now = new Date().toISOString();
    
    this.recordInstall({
      commit,
      updatedAt: now,
    }, info.platforms);
    
    console.log(`✓ ${this.name} updated to commit ${commit.slice(0, 7)}`);
  }
  
  async remove(purge = false): Promise<void> {
    const info = this.getInfo();
    
    // 移除符号链接
    if (info?.platforms) {
      for (const platform of info.platforms) {
        const skillsLink = path.join(PATHS[platform].skills, 'superpowers');
        removeSymlink(skillsLink);
        
        if (platform === 'opencode') {
          const pluginLink = path.join(PATHS.opencode.plugins, 'superpowers.js');
          removeSymlink(pluginLink);
        }
      }
    }
    
    // 可选：删除克隆
    if (purge && info?.clonePath) {
      console.log(`Removing clone directory: ${info.clonePath}`);
      fs.rmSync(info.clonePath, { recursive: true, force: true });
    }
    
    this.recordRemove();
    console.log(`✓ ${this.name} removed.`);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/installers/superpowers.ts
git commit -m "feat: add superpowers installer"
```

---

### Task 2.3: Planning-with-files 安装器

**Files:**
- Create: `src/installers/planning-with-files.ts`

- [ ] **Step 1: 创建 planning-with-files 安装器**

```typescript
// src/installers/planning-with-files.ts
import fs from 'fs';
import path from 'path';
import { Platform } from '../types/index.js';
import { BaseInstaller } from './base.js';
import { PATHS } from '../core/platform.js';
import { clone, pull, getCommitSha, isGitInstalled } from '../core/git.js';

export class PlanningWithFilesInstaller extends BaseInstaller {
  name = 'planning-with-files';
  repoUrl = 'https://github.com/OthmanAdi/planning-with-files.git';
  description = 'Manus-style file-based planning for complex tasks';
  
  private getClonePath(): string {
    return path.join(PATHS.reposDir, 'planning-with-files');
  }
  
  async install(platforms: Platform[], force = false): Promise<void> {
    if (!isGitInstalled()) {
      throw new Error('Git is required. Please install Git first.');
    }
    
    const clonePath = this.getClonePath();
    
    if (this.isInstalled() && !force) {
      throw new Error(`${this.name} is already installed. Use --force to reinstall.`);
    }
    
    if (force && this.isInstalled()) {
      await this.remove(false);
    }
    
    this.ensurePlatformDirs(platforms);
    
    // Clone 仓库
    if (!fs.existsSync(clonePath)) {
      console.log(`Cloning ${this.repoUrl}...`);
      clone(this.repoUrl, clonePath);
    } else {
      console.log(`Repository already exists, pulling latest...`);
      pull(clonePath);
    }
    
    // 复制 skill 文件到各平台
    for (const platform of platforms) {
      const sourcePath = path.join(clonePath, '.opencode', 'skills', 'planning-with-files');
      const targetPath = path.join(PATHS[platform].skills, 'planning-with-files');
      
      console.log(`Copying skill files to ${platform}...`);
      
      // 删除已存在的目录
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      }
      
      // 复制目录
      fs.cpSync(sourcePath, targetPath, { recursive: true });
    }
    
    // 记录安装
    const commit = getCommitSha(clonePath);
    const primaryPath = path.join(PATHS[platforms[0]].skills, 'planning-with-files');
    
    this.recordInstall({
      method: 'clone',
      clonePath,
      targetPath: primaryPath,
      commit,
    }, platforms);
    
    console.log(`✓ ${this.name} installed successfully!`);
  }
  
  async update(): Promise<void> {
    const info = this.getInfo();
    if (!info) {
      throw new Error(`${this.name} is not installed.`);
    }
    
    const clonePath = info.clonePath;
    if (!clonePath) {
      throw new Error('Clone path not found in registry.');
    }
    
    console.log(`Updating ${this.name}...`);
    pull(clonePath);
    
    // 重新复制文件
    for (const platform of info.platforms) {
      const sourcePath = path.join(clonePath, '.opencode', 'skills', 'planning-with-files');
      const targetPath = path.join(PATHS[platform].skills, 'planning-with-files');
      
      console.log(`Updating skill files for ${platform}...`);
      
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      }
      
      fs.cpSync(sourcePath, targetPath, { recursive: true });
    }
    
    const commit = getCommitSha(clonePath);
    const now = new Date().toISOString();
    
    this.recordInstall({
      commit,
      updatedAt: now,
    }, info.platforms);
    
    console.log(`✓ ${this.name} updated to commit ${commit.slice(0, 7)}`);
  }
  
  async remove(purge = false): Promise<void> {
    const info = this.getInfo();
    
    if (info?.platforms) {
      for (const platform of info.platforms) {
        const targetPath = path.join(PATHS[platform].skills, 'planning-with-files');
        if (fs.existsSync(targetPath)) {
          fs.rmSync(targetPath, { recursive: true, force: true });
        }
      }
    }
    
    if (purge && info?.clonePath) {
      console.log(`Removing clone directory: ${info.clonePath}`);
      fs.rmSync(info.clonePath, { recursive: true, force: true });
    }
    
    this.recordRemove();
    console.log(`✓ ${this.name} removed.`);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/installers/planning-with-files.ts
git commit -m "feat: add planning-with-files installer"
```

---

### Task 2.4: UI-UX-Pro-Max 安装器

**Files:**
- Create: `src/installers/ui-ux-pro-max.ts`

- [ ] **Step 1: 创建 ui-ux-pro-max 安装器**

```typescript
// src/installers/ui-ux-pro-max.ts'
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Platform } from '../types/index.js';
import { BaseInstaller } from './base.js';
import { PATHS } from '../core/platform.js';

export class UiUxProMaxInstaller extends BaseInstaller {
  name = 'ui-ux-pro-max';
  repoUrl = 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill';
  description = 'UI/UX design intelligence with searchable database';
  
  private isUiproInstalled(): boolean {
    try {
      execSync('uipro --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
  
  private getPlatformArg(platform: Platform): string {
    const map: Record<Platform, string> = {
      opencode: 'opencode',
      claudecode: 'claude',
      generic: 'opencode', // uipro 不支持 generic，使用 opencode
    };
    return map[platform];
  }
  
  async install(platforms: Platform[], force = false): Promise<void> {
    if (!this.isUiproInstalled()) {
      throw new Error(
        'uipro CLI is required. Install it with: npm install -g uipro-cli'
      );
    }
    
    if (this.isInstalled() && !force) {
      throw new Error(`${this.name} is already installed. Use --force to reinstall.`);
    }
    
    if (force && this.isInstalled()) {
      await this.remove(false);
    }
    
    this.ensurePlatformDirs(platforms);
    
    // 使用 uipro CLI 安装
    for (const platform of platforms) {
      const aiArg = this.getPlatformArg(platform);
      const forceArg = force ? '--force' : '';
      
      console.log(`Installing ${this.name} for ${platform}...`);
      
      const cmd = force 
        ? `uipro init --ai ${aiArg} --force`
        : `uipro init --ai ${aiArg}`;
      
      execSync(cmd, { stdio: 'inherit' });
    }
    
    // 获取版本信息
    let version = 'unknown';
    try {
      const output = execSync('uipro --version', { encoding: 'utf-8' }).trim();
      version = output.replace(/^v?/, '');
    } catch {}
    
    const primaryPath = path.join(PATHS[platforms[0]].skills, 'ui-ux-pro-max');
    const now = new Date().toISOString();
    
    this.recordInstall({
      method: 'cli',
      targetPath: primaryPath,
      version,
    }, platforms);
    
    console.log(`✓ ${this.name} installed successfully!`);
  }
  
  async update(): Promise<void> {
    const info = this.getInfo();
    if (!info) {
      throw new Error(`${this.name} is not installed.`);
    }
    
    if (!this.isUiproInstalled()) {
      throw new Error(
        'uipro CLI is required. Install it with: npm install -g uipro-cli'
      );
    }
    
    console.log(`Updating ${this.name}...`);
    
    for (const platform of info.platforms) {
      const aiArg = this.getPlatformArg(platform);
      console.log(`Updating for ${platform}...`);
      execSync(`uipro update --ai ${aiArg}`, { stdio: 'inherit' });
    }
    
    let version = 'unknown';
    try {
      const output = execSync('uipro --version', { encoding: 'utf-8' }).trim();
      version = output.replace(/^v?/, '');
    } catch {}
    
    const now = new Date().toISOString();
    this.recordInstall({
      version,
      updatedAt: now,
    }, info.platforms);
    
    console.log(`✓ ${this.name} updated to version ${version}`);
  }
  
  async remove(purge = false): Promise<void> {
    const info = this.getInfo();
    
    if (info?.platforms) {
      for (const platform of info.platforms) {
        const targetPath = path.join(PATHS[platform].skills, 'ui-ux-pro-max');
        if (fs.existsSync(targetPath)) {
          fs.rmSync(targetPath, { recursive: true, force: true });
        }
      }
    }
    
    this.recordRemove();
    console.log(`✓ ${this.name} removed.`);
  }
}
```

- [ ] **Step 2: 修复语法错误（单引号问题）**

第一行应该是：
```typescript
// src/installers/ui-ux-pro-max.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/installers/ui-ux-pro-max.ts
git commit -m "feat: add ui-ux-pro-max installer"
```

---

### Task 2.5: 安装器注册表

**Files:**
- Create: `src/installers/index.ts`

- [ ] **Step 1: 创建安装器注册表**

```typescript
// src/installers/index.ts
import { SkillInstaller } from '../types/index.js';
import { SuperpowersInstaller } from './superpowers.js';
import { PlanningWithFilesInstaller } from './planning-with-files.js';
import { UiUxProMaxInstaller } from './ui-ux-pro-max.js';

const installers: SkillInstaller[] = [
  new SuperpowersInstaller(),
  new PlanningWithFilesInstaller(),
  new UiUxProMaxInstaller(),
];

export const INSTALLERS: Record<string, SkillInstaller> = Object.fromEntries(
  installers.map(installer => [installer.name, installer])
);

export function getInstaller(name: string): SkillInstaller | undefined {
  return INSTALLERS[name];
}

export function listInstallers(): SkillInstaller[] {
  return installers;
}

export { SuperpowersInstaller, PlanningWithFilesInstaller, UiUxProMaxInstaller };
```

- [ ] **Step 2: Commit**

```bash
git add src/installers/index.ts
git commit -m "feat: add installer registry"
```

---

## Chunk 3: CLI 命令实现

### Task 3.1: Install 命令

**Files:**
- Create: `src/commands/install.ts`

- [ ] **Step 1: 创建 install 命令**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/commands/install.ts
git commit -m "feat: add install command"
```

---

### Task 3.2: Update 命令

**Files:**
- Create: `src/commands/update.ts`

- [ ] **Step 1: 创建 update 命令**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/commands/update.ts
git commit -m "feat: add update command"
```

---

### Task 3.3: List 命令

**Files:**
- Create: `src/commands/list.ts`

- [ ] **Step 1: 创建 list 命令**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/commands/list.ts
git commit -m "feat: add list command"
```

---

### Task 3.4: Remove 命令

**Files:**
- Create: `src/commands/remove.ts`

- [ ] **Step 1: 创建 remove 命令**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/commands/remove.ts
git commit -m "feat: add remove command"
```

---

### Task 3.5: CLI 入口

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: 创建 CLI 入口**

```typescript
#!/usr/bin/env node
// src/index.ts
import { Command } from 'commander';
import chalk from 'chalk';
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
```

- [ ] **Step 2: Commit**

```bash
git add src/index.ts
git commit -m "feat: add CLI entry point"
```

---

## Chunk 4: 构建和测试

### Task 4.1: 构建配置

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 添加构建脚本**

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "start": "node dist/index.js"
  }
}
```

- [ ] **Step 2: 构建**

```bash
npm run build
```

Expected: 编译成功，生成 dist/ 目录

- [ ] **Step 3: 测试 CLI**

```bash
node dist/index.js --help
```

Expected: 显示帮助信息

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: add build scripts"
```

---

### Task 4.2: 创建 README

**Files:**
- Create: `README.md`

- [ ] **Step 1: 创建 README**

```markdown
# Skill Manager

CLI tool for installing and managing AI coding assistant skills.

## Supported Skills

| Skill | Description | Install Method |
|-------|-------------|----------------|
| superpowers | TDD, debugging, planning workflows | git clone + symlink |
| planning-with-files | Manus-style file-based planning | git clone + copy |
| ui-ux-pro-max | UI/UX design intelligence | uipro CLI |

## Installation

```bash
cd skill-manager
npm install
npm run build
npm link
```

## Usage

```bash
# Install a skill
skill-manager install superpowers
skill-manager install planning-with-files --platform generic
skill-manager install ui-ux-pro-max --all

# Update skills
skill-manager update superpowers
skill-manager update  # update all

# List skills
skill-manager list

# Remove a skill
skill-manager remove planning-with-files
skill-manager remove superpowers --purge
```

## Requirements

- Git (for superpowers, planning-with-files)
- Node.js 18+
- npm (for ui-ux-pro-max)

## Platform Paths

| Platform | Skills Directory |
|----------|------------------|
| opencode | ~/.config/opencode/skills/ |
| claudecode | ~/.claude/skills/ |
| generic | ~/.agents/skills/ |
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```

---

### Task 4.3: 功能测试

- [ ] **Step 1: 测试 list 命令**

```bash
npm run dev -- list
```

Expected: 显示可用 skills 列表

- [ ] **Step 2: 测试 planning-with-files 安装**

```bash
npm run dev -- install planning-with-files --platform generic
```

Expected: 安装成功，文件出现在 ~/.agents/skills/planning-with-files/

- [ ] **Step 3: 验证安装**

```bash
ls ~/.agents/skills/planning-with-files/
```

Expected: 显示 SKILL.md, templates/, scripts/ 等文件

- [ ] **Step 4: 测试 list 命令（已安装）**

```bash
npm run dev -- list
```

Expected: 显示 planning-with-files 为已安装

- [ ] **Step 5: 测试 update 命令**

```bash
npm run dev -- update planning-with-files
```

Expected: 更新成功

- [ ] **Step 6: 测试 remove 命令**

```bash
npm run dev -- remove planning-with-files
```

Expected: 移除成功

- [ ] **Step 7: 最终 commit**

```bash
git add .
git commit -m "feat: complete skill-manager implementation"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Chunk 1 | 1.1-1.6 | 项目初始化、类型定义、核心模块 |
| Chunk 2 | 2.1-2.5 | 安装器实现（基类 + 3个具体安装器） |
| Chunk 3 | 3.1-3.5 | CLI 命令实现 |
| Chunk 4 | 4.1-4.3 | 构建、文档、测试 |