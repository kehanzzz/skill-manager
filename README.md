# Skill Manager

CLI tool for installing and managing AI coding assistant skills.

## Supported Skills

| Skill | Description | Install Method |
|-------|-------------|----------------|
| superpowers | TDD, debugging, planning workflows | git clone + symlink |
| planning-with-files | Manus-style file-based planning | git clone + copy |
| ui-ux-pro-max | UI/UX design intelligence | uipro CLI |
| openspec | Spec-driven development (SDD) | npm |
| spec-kit | Spec-Driven Development toolkit | git clone |

## Installation

```bash
cd skill-manager
npm install
npm run build
npm link
```

## Usage

```bash
# List available and installed skills
skill-manager list

# Install a skill
skill-manager install superpowers
skill-manager install planning-with-files --platform generic
skill-manager install ui-ux-pro-max --all

# Install all available skills
skill-manager install all
skill-manager install all -p opencode
skill-manager install all -f

# Update skills
skill-manager update superpowers
skill-manager update  # update all

# Remove a skill
skill-manager remove planning-with-files
skill-manager remove superpowers --purge
```

## Commands

### `skill-manager install <skill>`

Install a skill to specified platform(s). Use `all` to install all available skills.

Options:
- `-p, --platform <platform>` - Target platform (opencode, claudecode, generic)
- `-a, --all` - Install to all platforms
- `-f, --force` - Force reinstall

Examples:
```bash
skill-manager install superpowers              # Install to current platform
skill-manager install all                      # Install all skills to current platform
skill-manager install all -p opencode          # Install all to opencode only
skill-manager install all -a                   # Install all to all platforms
skill-manager install all -f                   # Force reinstall all (skip already-installed check)
```

### `skill-manager update [skill]`

Update a skill or all skills if no skill specified.

### `skill-manager list`

List installed and available skills.

Options:
- `-j, --json` - Output as JSON

### `skill-manager remove <skill>`

Remove a skill.

Options:
- `--purge` - Also remove the cloned repository

## Requirements

- Git (for superpowers, planning-with-files)
- Node.js 18+
- npm (for ui-ux-pro-max: `npm install -g uipro-cli`)

## Platform Paths

| Platform | Skills Directory |
|----------|------------------|
| opencode | ~/.config/opencode/skills/ |
| claudecode | ~/.claude/skills/ |
| generic | ~/.agents/skills/ |

## Storage

All cloned repositories and registry are stored in `~/.skill-manager/`.

```
~/.skill-manager/
├── repos/           # Cloned git repositories
│   └── planning-with-files/
└── registry.json    # Installation records
```