# pi-smart-copy

A [Pi](https://github.com/badlogic/pi-mono) extension that lets you copy clean content from conversations — code blocks, prompts, and tables — without markdown formatting artifacts.

## The Problem

When you try to copy a prompt, code block, or table from a Pi conversation, you get all the markdown formatting:

- `>` prefixes on blockquotes
- `**bold**` markers
- `` ` `` inline code backticks
- `|` table delimiters and separator rows
- ```` ``` ```` fence markers

## The Solution

**Smart Copy** scans your conversation for copyable blocks and lets you pick one from a selector. The content is **cleaned** before copying to your clipboard:

| Block Type | What Gets Cleaned |
|---|---|
| Code blocks | Fence markers and language tags removed |
| Prompts / Quotes | `>` prefix, `**bold**`, `` `code` `` markers stripped |
| Tables | `\|` chars removed, separator rows removed, cells tab-separated |

## Install

```bash
pi install git:github.com/mahmoudelsayad/pi-smart-copy
```

Or add to your `settings.json`:

```json
{
  "packages": ["git:github.com/mahmoudelsayad/pi-smart-copy"]
}
```

## Usage

| Trigger | Action |
|---------|--------|
| `/smart-copy` | Opens selector overlay with all copyable blocks |
| `Ctrl+Shift+Y` | Shortcut |

The selector shows a preview of each block, most recent first. Type to filter. Press Enter to copy the selected block to your system clipboard.

### Example

The assistant outputs:

```
> **Read the file `src/load.tsx` and identify all try/catch blocks.
> Create a markdown summary and run the linter.**
```

You run `/smart-copy` (or press `Ctrl+Shift+Y`), select "Prompt / Quote", and your clipboard gets:

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
