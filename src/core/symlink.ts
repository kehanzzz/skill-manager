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