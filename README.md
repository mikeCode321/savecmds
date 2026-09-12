# Save Commands Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.85.0+-blue.svg)](https://code.visualstudio.com/)

Save, organize, and run terminal commands directly from the VS Code sidebar. Boost your productivity with reusable command snippets, folder organization, and dynamic placeholders.

## Features

- **Save Commands** — Store any terminal command with a custom name for quick access
- **Run Commands** — Click a saved command to instantly execute it in the active terminal
- **Folder Organization** — Group related commands into folders for better organization
- **Drag and Drop** — Easily move commands between folders and reorder them
- **Dynamic Placeholders** — Use `<placeholder>` syntax for commands that need input values
- **Edit Commands** — Right-click to rename or modify saved commands
- **Edit Folders** — Right-click to rename folders
- **Delete Commands** — Remove commands or entire folders with confirmation
- **Persistent Storage** — Commands are saved across VS Code sessions
- **Quick Access** — Access your command library from the Activity Bar

## Use Cases

- **Development Workflow**: Save common build, test, and deployment commands
- **Docker Management**: Store docker-compose commands with service placeholders
- **Git Operations**: Keep frequently used git commands at your fingertips
- **Server Management**: Organize SSH and server maintenance commands
- **Project Templates**: Maintain project-specific command sets
- **Learning & Documentation**: Build a personal library of useful commands

## How to Use

1. **Open the Extension**: Click the terminal icon in the Activity Bar on the left side of VS Code
2. **Add a Command**: Click the **+** button to save a new command
   - Enter a descriptive name (e.g., "Start Dev Server")
   - Enter the terminal command (e.g., `npm run dev`)
3. **Create Folders**: Click the **folder** button to create a folder for organizing commands
4. **Run Commands**: Click any saved command to instantly run it in the terminal
5. **Use Placeholders**: For dynamic commands, use `<placeholder>` syntax (e.g., `docker compose build <service>`)
   - When running, you'll be prompted to enter values for each placeholder
6. **Organize**: Drag and drop commands between folders to organize them
7. **Edit**: Right-click any command or folder to rename, edit, or delete it

## Keywords

terminal commands, command snippets, productivity, workflow automation, bash commands, shell commands, developer tools, command manager, saved commands, terminal productivity, VS Code extension, command-line interface, docker commands, git commands, build automation, deployment commands

## FAQ

**Q: Are my commands saved across VS Code sessions?**
A: Yes, commands are persisted using VS Code's global state and will be available even after closing and reopening VS Code.

**Q: Can I use dynamic values in my commands?**
A: Yes! Use `<placeholder>` syntax in your commands. When you run the command, you'll be prompted to enter values for each placeholder.

**Q: How do I organize my commands?**
A: You can create folders and drag commands into them. Commands can also be reordered by dragging them within folders.

**Q: Can I export or import my saved commands?**
A: Currently, commands are stored locally in VS Code's global state. Export/import functionality may be added in future versions.

**Q: Does this work with all terminal types?**
A: Yes, the extension works with any terminal integrated into VS Code, including PowerShell, bash, zsh, cmd, and others.

## Release Notes

### 0.0.2
- Improved SEO and discoverability
- Better categorization and keywords
- Enhanced documentation

### 0.0.1
Initial release.