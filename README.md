# pi-smart-copy

`pi-smart-copy` is a Pi extension for copying **clean, paste-ready content** from assistant messages.

It detects common markdown structures in a conversation—such as code blocks, quoted prompts, and tables—and copies a normalized version to your clipboard without the formatting noise that usually comes with terminal selection.

## Why it is useful

When you copy content directly from an agent conversation, you often get extra markdown syntax that you do not actually want to paste anywhere else:

- blockquote prefixes like `>`
- emphasis markers like `**bold**`
- inline code backticks
- fenced code block markers
- markdown table pipes and separator rows

That makes common workflows slower than they should be. `pi-smart-copy` removes that cleanup step so you can move content directly into:

- a new Pi session
- your editor or IDE
- documentation tools such as Notion or Confluence
- spreadsheets such as Google Sheets or Excel
- chat messages, tickets, or pull requests

## Features

- `/smart-copy` command
- `Ctrl+Shift+C` keyboard shortcut
- Interactive picker overlay
- Live filtering while you type
- Most-recent-first results
- Cross-platform clipboard support
- Clean handling for code blocks, prompts/quotes, and markdown tables

## Supported content

| Content type | Detected from | Copied output |
| --- | --- | --- |
| Code blocks | Triple-backtick fenced blocks | Raw code without fences or language labels |
| Prompts / quotes | Markdown blockquotes | Plain text without `>`, `**`, or inline backticks |
| Tables | Markdown table rows | Tab-separated cells without pipes or separator rows |

## Install

### Quick install

```bash
pi install git:github.com/MahmoudElsayad/pi-smart-copy
```

### Via `settings.json`

```json
{
  "packages": ["git:github.com/MahmoudElsayad/pi-smart-copy"]
}
```

After installation, run:

```bash
/reload
```

## Usage

### Command

```text
/smart-copy
```

### Shortcut

```text
Ctrl+Shift+C
```

### Workflow

1. Open the Smart Copy picker.
2. Type to filter by content.
3. Use `↑` and `↓` to move through matches.
4. Press `Enter` to copy the selected block.
5. Press `Esc` to close the picker.

## Common use cases

### Reuse prompts across sessions
Copy a prompt suggested by the assistant and paste it directly into a new Pi session without blockquote markers or inline markdown.

### Paste generated code into a file
Copy only the code from a fenced block and paste it straight into your editor.

### Move tables into docs or spreadsheets
Copy a markdown table as tab-separated text that pastes cleanly into Google Sheets, Excel, Notion, or internal docs.

### Share a specific result with teammates
Extract a concise analysis block, recommendation, or example from a longer conversation without dragging along surrounding chat history.

### Build a prompt library
Collect useful prompts from sessions and store them in your own prompt library in a clean format.

## Example

### Assistant output

```md
> **Read the file `src/load.tsx` and identify all try/catch blocks.**
> **Create a markdown summary and run the linter.**
```

### Copied result

```text
Read the file src/load.tsx and identify all try/catch blocks.
Create a markdown summary and run the linter.
```

## Platform support

Clipboard integration uses the following tools:

- **macOS:** `pbcopy`
- **Linux:** `xclip`
- **Windows:** `clip.exe`

> On Linux, make sure `xclip` is installed and available in `PATH`.

## Notes

- Smart Copy scans assistant messages in the current session.
- Filtering is content-oriented, so typing part of the text you want is the fastest way to find it.
- The extension is designed to keep copied output practical rather than perfectly markdown-faithful.

## License

MIT
