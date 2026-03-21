# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-21
**Commit:** 1ec624e
**Branch:** main

## OVERVIEW

CLI tool for installing and managing AI coding assistant skills. Supports multiple platforms (opencode, claudecode, generic) with git-based skill installation.

**Stack:** TypeScript + Node.js (ESM) + Commander.js

## STRUCTURE

```
skill-manager/
├── src/
│   ├── index.ts          # CLI entry (commander)
│   ├── commands/         # CLI handlers (install/update/list/remove)
│   ├── core/             # Platform, git, registry, symlink utilities
│   ├── installers/       # Skill-specific installer classes
│   └── types/            # Type definitions
├── .opencode/
│   └── skills/           # Installed skills (ui-ux-pro-max)
└── docs/
    └── design.md         # Architecture design
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new CLI command | `src/commands/` | Create file, register in `src/index.ts` |
| Add new skill installer | `src/installers/` | Extend `BaseInstaller`, register in `index.ts` |
| Modify platform paths | `src/core/platform.ts` | `PATHS` constant |
| Change registry logic | `src/core/registry.ts` | Load/save skill records |
| Git operations | `src/core/git.ts` | clone, pull, getCommitSha |
| Type definitions | `src/types/index.ts` | Platform, SkillRecord, SkillInstaller |

## CODE MAP

| Module | Exports | Role |
|--------|---------|------|
| `src/installers/index.ts` | `INSTALLERS`, `getInstaller()`, `listInstallers()` | Installer registry |
| `src/core/platform.ts` | `PATHS`, `detectPlatform()`, `ensureDirectories()` | Platform abstraction |
| `src/core/registry.ts` | `loadRegistry()`, `registerSkill()`, `getSkillInfo()` | Skill record management |
| `src/core/git.ts` | `clone()`, `pull()`, `getCommitSha()` | Git wrapper |
| `src/core/symlink.ts` | `createSymlink()`, `removeSymlink()` | Symlink utilities |
| `src/types/index.ts` | `Platform`, `SkillRecord`, `SkillInstaller`, etc. | Type definitions |

## CONVENTIONS

### Code Style
- **ESM modules** with `.js` extension in imports: `import { x } from './file.js'`
- **Named exports** preferred over default exports
- **Strict TypeScript** (`strict: true` in tsconfig)
- **Chinese comments** for inline explanations (e.g., `// 检查是否已安装`)

### File Organization
- Each module directory has `index.ts` as public export
- Command files export `xxxCommand` functions (e.g., `installCommand`)
- Installer classes extend `BaseInstaller` abstract class

### Naming
- Files: `kebab-case.ts`
- Types/Interfaces: `PascalCase`
- Functions: `camelCase`
- Command functions: `xxxCommand` suffix

## ANTI-PATTERNS

(None defined - early stage project)

## UNIQUE STYLES

### Installer Pattern
```typescript
// All installers follow this structure:
class MyInstaller extends BaseInstaller {
  name = 'my-skill';
  repoUrl = 'https://github.com/...';
  description = '...';
  
  async install(platforms: Platform[], force?: boolean): Promise<void> { ... }
  async update(): Promise<void> { ... }
  async remove(purge?: boolean): Promise<void> { ... }
}
```

### Platform Detection
- Checks `process.env.OPENCODE_SESSION` → 'opencode'
- Checks `process.env.CLAUDE_CODE_SESSION` → 'claudecode'
- Default → 'generic'

## COMMANDS

```bash
# Development
npm run dev          # Run with tsx (hot reload)
npm run build        # TypeScript compile → dist/
npm run start        # Run compiled CLI

# Global CLI (after npm link)
skill-manager install <skill> [-p platform | -a | -f]
skill-manager update [skill]
skill-manager list [-j]
skill-manager remove <skill> [--purge]
```

## NOTES

- **No tests** - Phase 4 (planned)
- **No CI/CD** - Manual build only
- **Data storage**: `~/.skill-manager/` (registry + cloned repos)
- **Platform skills**: `~/.config/opencode/skills/`, `~/.claude/skills/`, `~/.agents/skills/`