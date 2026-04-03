/**
 * Smart Copy Extension
 *
 * Scans assistant messages for copyable blocks (code, prompts,
 * tables, blockquotes) and lets you copy the CLEAN version —
 * no markdown fences, no | characters, no > prefixes, no ** bold.
 *
 * Usage:
 *   /smart-copy     — open selector with all copyable blocks
 *   Ctrl+Shift+C    — shortcut
 *
 * The selector shows a preview of each block. Pick one and it's
 * copied to the system clipboard, cleaned of formatting artifacts.
 */

import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@mariozechner/pi-coding-agent";
import { DynamicBorder } from "@mariozechner/pi-coding-agent";
import {
  Container,
  Key,
  matchesKey,
  type SelectItem,
  SelectList,
  Text,
} from "@mariozechner/pi-tui";
import { spawn } from "node:child_process";

// ── Clipboard ───────────────────────────────────────────

function copyToClipboard(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    const cmd =
      process.platform === "darwin"
        ? "pbcopy"
        : process.platform === "linux"
          ? "xclip"
          : "clip.exe";
    const args =
      process.platform === "linux"
        ? ["-selection", "clipboard"]
        : [];
    try {
      const proc = spawn(cmd, args, {
        stdio: ["pipe", "ignore", "ignore"],
      });
      proc.stdin.write(text);
      proc.stdin.end();
      proc.on("close", (code) => resolve(code === 0));
      proc.on("error", () => resolve(false));
    } catch {
      resolve(false);
    }
  });
}

// ── Markdown cleaning ───────────────────────────────────

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1") // **bold**
    .replace(/\*([^*]+)\*/g, "$1") // *italic*
    .replace(/`([^`]+)`/g, "$1") // `inline code`
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url)
    .replace(/^#{1,6}\s+/gm, "") // # headings
    .replace(/\\\*/g, "*") // escaped asterisks
    .replace(/\\_/g, "_") // escaped underscores
    .trim();
}

function cleanTable(lines: string[]): string {
  return lines
    .filter((line) => !line.match(/^\|[\s\-:|]+\|$/)) // skip separator rows like |---|---|
    .map((line) => {
      return line
        .replace(/^\|/, "") // leading |
        .replace(/\|$/, "") // trailing |
        .split("|")
        .map((cell) => cleanMarkdown(cell.trim()))
        .join("\t");
    })
    .join("\n");
}

function cleanBlockquote(lines: string[]): string {
  const raw = lines
    .map((line) => line.replace(/^>\s?/, ""))
    .join("\n");
  return cleanMarkdown(raw);
}

// ── Block extraction ────────────────────────────────────

interface CopyableBlock {
  type: "code" | "blockquote" | "table";
  label: string;
  preview: string;
  clean: string;
  turnLabel: string;
}

/** Sanitize text for safe display in SelectList (no tabs, no control chars) */
function safePreview(text: string, maxLen: number = 70): string {
  return text
    .replace(/\t/g, "  ")
    .replace(/\n/g, " ")
    .replace(/[\x00-\x1f]/g, "")
    .slice(0, maxLen) + (text.length > maxLen ? "\u2026" : "");
}

function extractBlocks(
  text: string,
  turnLabel: string
): CopyableBlock[] {
  const blocks: CopyableBlock[] = [];
  const lines = text.split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // ── Fenced code block ──
    const fenceMatch = line.match(/^```(\w*)/);
    if (fenceMatch) {
      const lang = fenceMatch[1] || "code";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing fence
      const code = codeLines.join("\n").trim();
      if (code.length > 0) {
        blocks.push({
          type: "code",
          label: `Code (${lang})`,
          preview: safePreview(code),
          clean: code,
          turnLabel,
        });
      }
      continue;
    }

    // ── Blockquote / prompt ──
    if (line.startsWith("> ") || line === ">") {
      const quoteLines: string[] = [];
      while (
        i < lines.length &&
        (lines[i].startsWith("> ") || lines[i] === ">")
      ) {
        quoteLines.push(lines[i]);
        i++;
      }
      const clean = cleanBlockquote(quoteLines);
      if (clean.length > 10) {
        // skip trivial quotes
        blocks.push({
          type: "blockquote",
          label: "Prompt / Quote",
          preview: safePreview(clean),
          clean,
          turnLabel,
        });
      }
      continue;
    }

    // ── Table ──
    if (line.match(/^\|.+\|/)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].match(/^\|.+\|/)) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2) {
        const clean = cleanTable(tableLines);
        blocks.push({
          type: "table",
          label: `Table (${tableLines.length - 1} rows)`,
          preview: safePreview(clean.split("\n")[0] ?? ""),
          clean,
          turnLabel,
        });
      }
      continue;
    }

    i++;
  }

  return blocks;
}

// ── Collect from session ────────────────────────────────

function collectCopyableBlocks(
  entries: any[]
): CopyableBlock[] {
  const allBlocks: CopyableBlock[] = [];
  let turnNum = 0;

  for (const entry of entries) {
    if (entry.type !== "message") continue;
    const msg = entry.message;
    if (!msg || msg.role !== "assistant") continue;
    turnNum++;

    const textParts: string[] = [];
    if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === "text" && block.text) {
          textParts.push(block.text);
        }
      }
    }

    const fullText = textParts.join("\n");
    if (!fullText.trim()) continue;

    const label = `Turn #${turnNum}`;
    const blocks = extractBlocks(fullText, label);
    allBlocks.push(...blocks);
  }

  return allBlocks;
}

// ── Extension entry ─────────────────────────────────────

export default function (pi: ExtensionAPI) {
  async function showCopySelector(ctx: ExtensionCommandContext) {
    const entries = ctx.sessionManager.getBranch();
    const blocks = collectCopyableBlocks(entries);

    if (blocks.length === 0) {
      ctx.ui.notify(
        "No copyable blocks found (code, prompts, tables)",
        "warning"
      );
      return;
    }

    // Most recent first
    const reversed = [...blocks].reverse();

    const items: SelectItem[] = reversed.map((b, i) => ({
      value: `${b.preview} ${b.label} ${b.turnLabel}::${i}`,
      label: `${b.label}  ${b.turnLabel}`,
      description: b.preview,
    }));

    const result = await ctx.ui.custom<string | null>(
      (tui, theme, _kb, done) => {
        const container = new Container();
        container.addChild(
          new DynamicBorder((s: string) =>
            theme.fg("accent", s)
          )
        );
        container.addChild(
          new Text(
            theme.fg(
              "accent",
              theme.bold(" 📋 Smart Copy")
            ) +
              theme.fg(
                "dim",
                `  ${reversed.length} block${reversed.length === 1 ? "" : "s"}`
              ),
            1,
            0
          )
        );

        const selectList = new SelectList(
          items,
          Math.min(items.length, 12),
          {
            selectedPrefix: (t) => theme.fg("accent", t),
            selectedText: (t) => theme.fg("accent", t),
            description: (t) => theme.fg("muted", t),
            scrollInfo: (t) => theme.fg("dim", t),
            noMatch: (t) => theme.fg("warning", t),
          }
        );
        selectList.onSelect = (item) => done(item.value);
        selectList.onCancel = () => done(null);
        container.addChild(selectList);

        let filterText = "";
        const searchLine = new Text("", 1, 0);
        const hintsLine = new Text(
          theme.fg("dim", " ↑↓ navigate • enter copy • esc cancel • type to search"),
          1, 0
        );
        container.addChild(searchLine);
        container.addChild(hintsLine);
        container.addChild(
          new DynamicBorder((s: string) =>
            theme.fg("accent", s)
          )
        );

        function updateSearchLine() {
          if (filterText.length > 0) {
            searchLine.setText(
              theme.fg("accent", " ⌕ ") +
              theme.fg("text", filterText) +
              theme.fg("dim", "▎")
            );
          } else {
            searchLine.setText("");
          }
        }

        return {
          render: (w: number) => container.render(w),
          invalidate: () => container.invalidate(),
          handleInput: (data: string) => {
            if (matchesKey(data, "backspace")) {
              filterText = filterText.slice(0, -1);
              selectList.setFilter(filterText);
              updateSearchLine();
              tui.requestRender();
              return;
            }
            // Printable character → add to filter
            if (data.length === 1 && data.charCodeAt(0) >= 32) {
              filterText += data;
              selectList.setFilter(filterText);
              updateSearchLine();
              tui.requestRender();
              return;
            }
            selectList.handleInput(data);
            tui.requestRender();
          },
        };
      },
      {
        overlay: true,
        overlayOptions: {
          anchor: "center" as const,
          width: "75%",
          minWidth: 50,
          maxHeight: "70%",
        },
      }
    );

    if (result === null) return;

    const idx = parseInt(result.split("::").pop() ?? "0", 10);
    const selected = reversed[idx];
    if (!selected) return;

    const ok = await copyToClipboard(selected.clean);
    if (ok) {
      const preview =
        selected.clean.length > 40
          ? selected.clean.slice(0, 37) + "..."
          : selected.clean;
      ctx.ui.notify(
        `Copied ${selected.label}: "${preview}"`,
        "info"
      );
    } else {
      ctx.ui.notify("Failed to copy to clipboard", "error");
    }
  }

  pi.registerCommand("smart-copy", {
    description:
      "Copy clean content from conversation (code, prompts, tables — without formatting)",
    handler: async (_args, ctx) => {
      await showCopySelector(ctx);
    },
  });

  pi.registerShortcut(Key.ctrlShift("c"), {
    description: "Smart copy — pick and copy clean content",
    handler: async (ctx) => {
      await showCopySelector(ctx as any);
    },
  });
}
