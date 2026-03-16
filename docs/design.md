# Skill Manager - 设计文档

## 概述

一个针对性的 skill 安装/更新工具，支持三个特定 skill：
- obra/superpowers
- OthmanAdi/planning-with-files
- nextlevelbuilder/ui-ux-pro-max-skill

## 目录结构

```
skill-manager/
├── src/
│   ├── index.ts                    # CLI 入口
│   ├── commands/
│   │   ├── install.ts              # install 命令
│   │   ├── update.ts               # update 命令
│   │   ├── list.ts                 # list 命令
│   │   └── remove.ts               # remove 命令
│   ├── installers/
│   │   ├── base.ts                 # 安装器基类
│   │   ├── superpowers.ts          # superpowers 安装器
│   │   ├── planning-with-files.ts  # planning-with-files 安装器
│   │   └── ui-ux-pro-max.ts        # ui-ux-pro-max 安装器
│   ├── core/
│   │   ├── git.ts                  # Git 操作
│   │   ├── symlink.ts              # 符号链接管理
│   │   ├── registry.ts             # 安装注册表
│   │   └── platform.ts             # 平台检测
│   └── types/
│       └── index.ts                # 类型定义
├── package.json
├── tsconfig.json
└── README.md
```

## 存储结构

```
~/.skill-manager/
├── repos/                          # Git 仓库克隆目录
│   ├── superpowers/                # superpowers 克隆
│   └── planning-with-files/        # planning-with-files 克隆
└── registry.json                   # 安装注册表
```

## 类型定义

```typescript
// 平台类型
type Platform = 'opencode' | 'claudecode' | 'generic';

// 安装方法
type InstallMethod = 'symlink' | 'clone' | 'cli';

// 注册表结构
interface Registry {
  version: string;
  skills: Record<string, SkillRecord>;
}

interface SkillRecord {
  name: string;
  repoUrl: string;
  method: InstallMethod;
  clonePath?: string;           // 克隆路径 (symlink/clone)
  targetPath: string;           // 目标安装路径
  commit?: string;              // 当前 commit SHA
  version?: string;             // CLI 工具版本
  installedAt: string;
  updatedAt: string;
  platforms: Platform[];
}

// 安装器接口
interface SkillInstaller {
  name: string;
  repoUrl: string;
  
  install(platforms: Platform[], force?: boolean): Promise<void>;
  update(): Promise<void>;
  remove(): Promise<void>;
  isInstalled(): boolean;
  getInfo(): SkillRecord | null;
}
```

## 三个 Skill 的安装策略

### 1. superpowers

**安装方法:** `symlink`

**步骤:**
1. Clone 仓库到 `~/.config/opencode/superpowers/`
2. 创建 plugin symlink: `~/.config/opencode/plugins/superpowers.js`
3. 创建 skills symlink: `~/.config/opencode/skills/superpowers`

**更新:** `git pull` in clone directory

**移除:** 删除 symlinks

```bash
# Install
git clone https://github.com/obra/superpowers.git ~/.config/opencode/superpowers
ln -s ~/.config/opencode/superpowers/.opencode/plugins/superpowers.js ~/.config/opencode/plugins/
ln -s ~/.config/opencode/superpowers/skills ~/.config/opencode/skills/superpowers

# Update
git -C ~/.config/opencode/superpowers pull

# Remove
rm ~/.config/opencode/plugins/superpowers.js
rm ~/.config/opencode/skills/superpowers
# 可选: rm -rf ~/.config/opencode/superpowers
```

### 2. planning-with-files

**安装方法:** `clone`

**步骤:**
1. Clone 仓库到 `~/.skill-manager/repos/planning-with-files/`
2. 复制 `.opencode/skills/planning-with-files/` 到目标目录

**更新:** `git pull` + 重新复制

**移除:** 删除目标目录

```bash
# Install
git clone https://github.com/OthmanAdi/planning-with-files.git ~/.skill-manager/repos/planning-with-files
cp -r ~/.skill-manager/repos/planning-with-files/.opencode/skills/planning-with-files ~/.agents/skills/

# Update
git -C ~/.skill-manager/repos/planning-with-files pull
cp -r ~/.skill-manager/repos/planning-with-files/.opencode/skills/planning-with-files ~/.agents/skills/

# Remove
rm -rf ~/.agents/skills/planning-with-files
# 可选: rm -rf ~/.skill-manager/repos/planning-with-files
```

### 3. ui-ux-pro-max

**安装方法:** `cli`

**依赖:** npm (uipro-cli)

**步骤:**
1. 检查 uipro CLI 是否安装
2. 执行 `uipro init --ai <platform>`

**更新:** `uipro update --ai <platform>`

**移除:** 删除目录

```bash
# Install
uipro init --ai opencode

# Update
uipro update --ai opencode

# Remove
rm -rf ~/.config/opencode/skills/ui-ux-pro-max
```

## CLI 命令设计

```
skill-manager <command> [options]

Commands:
  install <skill>    安装 skill (superpowers|planning-with-files|ui-ux-pro-max)
  update <skill>     更新 skill
  list               列出已安装 skills
  remove <skill>     移除 skill

Options:
  --platform <name>  指定平台 (opencode|claudecode|generic)
  --all              安装到所有平台
  --force            强制重新安装
  --purge            移除时同时删除克隆仓库
```

## 平台路径映射

| 平台 | Skills 目录 | Plugins 目录 |
|------|-------------|--------------|
| opencode | `~/.config/opencode/skills/` | `~/.config/opencode/plugins/` |
| claudecode | `~/.claude/skills/` | - |
| generic | `~/.agents/skills/` | - |

## 错误处理

| 场景 | 处理 |
|------|------|
| Git 未安装 | 提示安装 Git，退出码 1 |
| npm/uipro 未安装 (ui-ux-pro-max) | 提示安装 uipro-cli，退出码 1 |
| Skill 已安装 | 提示使用 --force 重新安装 |
| 网络错误 | 显示错误信息，退出码 1 |
| 权限错误 | 显示错误信息，退出码 1 |

## 实现优先级

1. **Phase 1:** 核心框架
   - CLI 入口
   - 类型定义
   - 注册表管理
   - Git 操作

2. **Phase 2:** 安装器实现
   - superpowers 安装器
   - planning-with-files 安装器
   - ui-ux-pro-max 安装器

3. **Phase 3:** 命令实现
   - install 命令
   - update 命令
   - list 命令
   - remove 命令

4. **Phase 4:** 测试与文档
   - 测试各 skill 安装/更新/移除
   - README 文档