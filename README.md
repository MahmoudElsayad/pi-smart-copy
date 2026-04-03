# pi-smart-copy

A [Pi](https://github.com/badlogic/pi-mono) extension that lets you copy clean content from conversations — code blocks, prompts, and tables — without markdown formatting artifacts.

## Why?

When working with AI coding agents, you constantly need to **reuse output** — paste a generated prompt into a new session, copy a code snippet into a file, or grab a table for documentation. But selecting text from a terminal conversation gives you raw markdown:

- `>` blockquote prefixes you have to strip
- `**bold**` and `` `code` `` markers mixed into text
- `|` table delimiters and `|---|---|` separator rows
- ```` ``` ```` fence markers wrapping code

You end up manually cleaning every paste. **Smart Copy** eliminates this entirely.

## Use Cases

### Reuse prompts across sessions

Your agent suggests a follow-up prompt:

> **Read `src/auth.ts` and identify all the security vulnerabilities. Create a `SECURITY-AUDIT.md` with your findings.**

With Smart Copy, press `Ctrl+Shift+C`, select it, and paste it clean into a new session — no `>` or `**` in the way.

### Copy code into files

The agent generates a utility function inside a code block. Instead of selecting around the fences and hoping you got it right, Smart Copy extracts just the code — ready to paste into your editor.

### Grab tables for docs or spreadsheets

The agent produces a comparison table:

```
| Approach | Pros | Cons |
|----------|------|------|
| Option A | Fast | Fragile |
| Option B | Safe | Slow |
```

Smart Copy gives you tab-separated clean text — paste directly into Google Sheets, Notion, or a wiki without cleanup.

### Share agent output with teammates

When you need to share a specific finding, recommendation, or analysis from a long conversation, Smart Copy lets you pull just that block without the surrounding conversation noise.

### Build prompt libraries

If you develop reusable prompts for your workflow, Smart Copy makes it easy to collect prompts the agent suggests and save them — already cleaned and ready to store.

## What Gets Cleaned

| Block Type | Detected By | Cleaning |
|---|---|---|
| Code blocks | ` ``` ` fences | Fence markers and language tags removed |
| Prompts / Quotes | `> ` prefixed lines | `>` prefix, `**bold**`, `` `code` `` markers stripped |
| Tables | `\|` delimited rows | `\|` chars removed, separator rows dropped, cells tab-separated |

## Install

```bash
pi install git:github.com/MahmoudElsayad/pi-smart-copy
```

Or add to your `settings.json`:

```json
{
  "packages": ["git:github.com/MahmoudElsayad/pi-smart-copy"]
}
```

## Usage

| Trigger | Action |
|---------|--------|
| `/smart-copy` | Opens selector overlay with all copyable blocks |
| `Ctrl+Shift+C` | Shortcut |

The selector scans all assistant messages in the current session and shows copyable blocks, most recent first.

- **↑↓** to navigate
- **Type** to search content (live filter with search bar)
- **Enter** to copy the selected block to clipboard
- **Esc** to cancel

### Example

The assistant outputs:

```
> **Read the file `src/load.tsx` and identify all try/catch blocks.
> Create a markdown summary and run the linter.**
```

You run `/smart-copy`, select "Prompt / Quote", and your clipboard gets:

```
Read the file src/load.tsx and identify all try/catch blocks.
Create a markdown summary and run the linter.
```

No `>`, no `**`, no `` ` `` — just clean text ready to paste.

## Supported Platforms

Clipboard integration uses:
- **macOS**: `pbcopy`
- **Linux**: `xclip`
- **Windows**: `clip.exe`

## License

MIT
