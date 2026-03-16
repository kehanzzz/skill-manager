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