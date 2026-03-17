import { SkillInstaller } from '../types/index.js';
import { SuperpowersInstaller } from './superpowers.js';
import { PlanningWithFilesInstaller } from './planning-with-files.js';
import { UiUxProMaxInstaller } from './ui-ux-pro-max.js';
import { OpenSpecInstaller } from './openspec.js';

const installers: SkillInstaller[] = [
  new SuperpowersInstaller(),
  new PlanningWithFilesInstaller(),
  new UiUxProMaxInstaller(),
  new OpenSpecInstaller(),
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

export { SuperpowersInstaller, PlanningWithFilesInstaller, UiUxProMaxInstaller, OpenSpecInstaller };