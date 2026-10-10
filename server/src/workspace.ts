import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DEFAULT_TEST_COMMAND } from "@kitchen/shared";
import { config } from "./config";
import { HttpError } from "./errors";

export const SANDBOX_LABEL = "/sandbox";

export function ensureSandbox(): string {
  fs.mkdirSync(config.sandboxPath, { recursive: true });
  return config.sandboxPath;
}

export function expandUserPath(input: string): string {
  const trimmed = input.trim();
  if (trimmed === "~") return os.homedir();
  if (trimmed.startsWith("~/")) return path.join(os.homedir(), trimmed.slice(2));
  return trimmed;
}

function gitText(args: string[]): string {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function gitFailure(error: unknown, fallback: string): HttpError {
  if (error && typeof error === "object" && "stderr" in error) {
    const stderr = (error as { stderr?: unknown }).stderr;
    if (typeof stderr === "string" && stderr.trim()) {
      return new HttpError(400, stderr.trim());
    }
  }
  return new HttpError(400, fallback);
}

export function inspectRepo(input: string): { repoPath: string } {
  const expanded = expandUserPath(input);
  if (!expanded) throw new HttpError(400, "Enter a repo path.");
  const resolved = path.resolve(expanded);
  let stat: fs.Stats;
  try {
    stat = fs.statSync(resolved);
  } catch {
    throw new HttpError(400, "That folder does not exist.");
  }
  if (!stat.isDirectory()) throw new HttpError(400, "That path is not a folder.");

  let toplevel = "";
  try {
    toplevel = gitText(["-C", resolved, "rev-parse", "--show-toplevel"]);
  } catch {
    throw new HttpError(400, "That folder is not a git repo.");
  }
  if (!toplevel) throw new HttpError(400, "That folder is not a git repo.");
  return { repoPath: toplevel };
}

export function branchNameFor(title: string, now = Date.now()): string {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return `kitchen-line/${slug || "order"}-${now}`;
}

export function createWorkBranch(repoPath: string, title: string, now = Date.now()): { branch: string; baseSha: string } {
  let baseSha = "";
  try {
    baseSha = gitText(["-C", repoPath, "rev-parse", "HEAD"]);
  } catch {
    throw new HttpError(400, "This repo needs at least one commit before Kitchen Line can open a branch.");
  }
  const branch = branchNameFor(title, now);
  try {
    gitText(["-C", repoPath, "checkout", "-b", branch]);
  } catch (error) {
    throw gitFailure(error, `Could not create branch ${branch}.`);
  }
  return { branch, baseSha };
}

export function resolveInside(root: string, requested: string): { absolute: string; relative: string } {
  if (!requested || requested.includes("\0")) {
    throw new HttpError(403, "Cooks cannot touch that path. It is outside the repo.");
  }
  const rootReal = fs.realpathSync(root);
  const candidate = path.resolve(rootReal, requested);
  const tail: string[] = [];
  let current = candidate;
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) break;
    tail.push(path.basename(current));
    current = parent;
  }
  const realBase = fs.realpathSync(current);
  const absolute = path.resolve(realBase, ...tail.reverse());
  const relative = path.relative(rootReal, absolute);
  const baseRelative = path.relative(rootReal, realBase);
  const escaped =
    relative === "" ||
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    baseRelative.startsWith("..") ||
    path.isAbsolute(baseRelative);
  if (escaped) {
    throw new HttpError(403, `Cooks cannot touch ${requested}. That path is outside the repo.`);
  }
  return { absolute, relative: relative.split(path.sep).join("/") };
}

export function readWorkFile(root: string, requested: string): string {
  const { absolute } = resolveInside(root, requested);
  return fs.readFileSync(absolute, "utf8");
}

export function writeWorkFile(root: string, requested: string, contents: string): string {
  const { absolute, relative } = resolveInside(root, requested);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, contents);
  return relative;
}

export function normalizeTestCommand(input: string | undefined): string {
  const command = (input ?? "").trim() || DEFAULT_TEST_COMMAND;
  if (command.length > 240) throw new HttpError(400, "Keep the test command under 240 characters.");
  if (/[\0\r\n]/.test(command)) throw new HttpError(400, "The test command must be one line.");
  if (splitCommand(command).length === 0) throw new HttpError(400, "Enter a test command.");
  return command;
}

export function splitCommand(command: string): string[] {
  const parts: string[] = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;
  for (const match of command.matchAll(pattern)) {
    parts.push(match[1] ?? match[2] ?? match[3] ?? "");
  }
  return parts.filter((part) => part.length > 0);
}

export function runTestCommand(cwd: string, command: string): { ok: boolean; output: string } {
  const parts = splitCommand(normalizeTestCommand(command));
  const [bin, ...args] = parts;
  if (!bin) throw new HttpError(400, "Enter a test command.");
  const result = spawnSync(bin, args, {
    cwd,
    encoding: "utf8",
    timeout: 120_000,
    env: process.env,
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  return { ok: result.status === 0, output: output.slice(-4000) };
}

export function listChangedFiles(repoPath: string, baseSha: string): string[] {
  const names = new Set<string>();
  const chunks = [
    gitText(["-C", repoPath, "diff", "--name-only", baseSha]),
    gitText(["-C", repoPath, "diff", "--name-only", "--cached", baseSha]),
    gitText(["-C", repoPath, "ls-files", "--others", "--exclude-standard"]),
  ];
  for (const chunk of chunks) {
    for (const line of chunk.split("\n")) {
      const name = line.trim();
      if (name) names.add(name);
    }
  }
  return [...names].sort();
}
