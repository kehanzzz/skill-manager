# SOURCE CODE GUIDE

**Module:** src/
**Purpose:** CLI implementation for skill-manager

## OVERVIEW

TypeScript source for the skill-manager CLI. Commander.js-based with modular command/installer architecture.

## STRUCTURE

```
src/
├── index.ts          # CLI entry point, commander setup
├── commands/         # 4 CLI subcommand handlers
├── core/             # 4 utility modules (platform, git, registry, symlink)
├── installers/       # 7 installer classes + base + index
└── types/            # Type definitions (single file)
```

## WHERE TO LOOK

| Need | File | Key Function/Class |
|------|------|-------------------|
| CLI entry | `index.ts` | `program.parse()` |
| Install logic | `commands/install.ts` | `installCommand()` |
| Update logic | `commands/update.ts` | `updateCommand()` |
| List logic | `commands/list.ts` | `listCommand()` |
| Remove logic | `commands/remove.ts` | `removeCommand()` |
| Platform paths | `core/platform.ts` | `PATHS`, `detectPlatform()` |
| Skill registry | `core/registry.ts` | `registerSkill()`, `getSkillInfo()` |
| Git wrapper | `core/git.ts` | `clone()`, `pull()` |
| Symlink ops | `core/symlink.ts` | `createSymlink()` |
| Types | `types/index.ts` | `Platform`, `SkillRecord` |
| Installer base | `installers/base.ts` | `BaseInstaller` (abstract) |
| Installer registry | `installers/index.ts` | `INSTALLERS`, `getInstaller()` |

## CONVENTIONS

### Import Style
```typescript
// Always use .js extension (ESM requirement)
import { Platform } from './types/index.js';
import { getInstaller } from '../installers/index.js';
```

### Command Pattern
```typescript
// commands/*.ts
export interface XxxCommandOptions { ... }
export async function xxxCommand(args, options): Promise<void> { ... }
```

### Installer Pattern
```typescript
// installers/*.ts
export class MyInstaller extends BaseInstaller {
  name = 'my-skill';
  repoUrl = 'https://...';
  description = '...';
  
  async install(platforms, force?): Promise<void> { ... }
  async update(): Promise<void> { ... }
  async remove(purge?): Promise<void> { ... }
}
```

### Error Handling
```typescript
// Use chalk for output, process.exit(1) for errors
console.error(chalk.red(`Error: ${message}`));
process.exit(1);
```

## MODULE DEPENDENCIES

```
index.ts
  └── commands/* → installers/index.ts → installers/*
                              └── core/* → types/index.ts
```

## KEY INTERFACES

```typescript
// types/index.ts
type Platform = 'opencode' | 'claudecode' | 'generic';
type InstallMethod = 'symlink' | 'clone' | 'cli' | 'npm' | 'uv';

interface SkillRecord {
  name: string;
  repoUrl: string;
  method: InstallMethod;
  platforms: Platform[];
  installedAt: string;
  updatedAt: string;
}

interface SkillInstaller {
  name: string;
  install(platforms, force?): Promise<void>;
  update(): Promise<void>;
  remove(purge?): Promise<void>;
}
```