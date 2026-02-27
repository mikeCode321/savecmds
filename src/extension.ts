import * as vscode from 'vscode';

interface SavedCommand {
  type: 'command';
  id: string;
  label: string;
  command: string;
  folderId?: string;
  order: number;
}

interface Folder {
  type: 'folder';
  id: string;
  label: string;
  order: number;
}

type TreeNode = Folder | SavedCommand;

// Finds all <placeholder> tokens in a command string
function extractPlaceholders(command: string): string[] {
  const matches = command.match(/<([^>]+)>/g);
  if (!matches) { return []; }
  // Deduplicate (same placeholder used twice)
  return [...new Set(matches)];
}

// Prompts the user to fill in each placeholder and returns the resolved command,
// or undefined if the user cancelled.
async function resolvePlaceholders(command: string): Promise<string | undefined> {
  const placeholders = extractPlaceholders(command);
  let resolved = command;

  for (const placeholder of placeholders) {
    const name = placeholder.slice(1, -1); // strip < >
    const value = await vscode.window.showInputBox({
      prompt: `Enter value for ${placeholder}`,
      placeHolder: name,
    });
    if (value === undefined) { return undefined; } // user pressed Escape
    resolved = resolved.replaceAll(placeholder, value);
  }

  return resolved;
}

class CommandsProvider implements vscode.TreeDataProvider<TreeNode>, vscode.TreeDragAndDropController<TreeNode> {
  dropMimeTypes = ['application/vnd.code.tree.savedCommandsView'];
  dragMimeTypes = ['application/vnd.code.tree.savedCommandsView'];

  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private context: vscode.ExtensionContext) {}

  refresh() { this._onDidChangeTreeData.fire(); }

  getFolders(): Folder[] {
    const folders = this.context.globalState.get<Folder[]>('savedFolders', []);
    return folders.map((f, i) => ({ ...f, order: f.order ?? i })).sort((a, b) => a.order - b.order);
  }

  getCommands(): SavedCommand[] {
    const commands = this.context.globalState.get<SavedCommand[]>('savedCommands', []);
    return commands.map((c, i) => ({ ...c, order: c.order ?? i })).sort((a, b) => a.order - b.order);
  }

  getTreeItem(item: TreeNode): vscode.TreeItem {
    if (item.type === 'folder') {
      const treeItem = new vscode.TreeItem(item.label, vscode.TreeItemCollapsibleState.Expanded);
      treeItem.contextValue = 'savedFolder';
      treeItem.iconPath = new vscode.ThemeIcon('folder');
      return treeItem;
    }

    const hasPlaceholders = extractPlaceholders(item.command).length > 0;
    const treeItem = new vscode.TreeItem(item.label);
    treeItem.description = item.command;
    treeItem.tooltip = hasPlaceholders
      ? `${item.command}\n\n⚡ Will prompt for: ${extractPlaceholders(item.command).join(', ')}`
      : item.command;
    treeItem.contextValue = 'savedCommand';
    // Commands with placeholders get a distinct icon so they're easy to spot
    treeItem.iconPath = new vscode.ThemeIcon(hasPlaceholders ? 'symbol-variable' : 'terminal');
    treeItem.command = {
      command: 'savedCommands.run',
      title: 'Run',
      arguments: [item]
    };
    return treeItem;
  }

  getChildren(item?: TreeNode): TreeNode[] {
    if (!item) {
      const folders = this.getFolders();
      const rootCommands = this.getCommands().filter(c => !c.folderId);
      return [...folders, ...rootCommands].sort((a, b) => a.order - b.order);
    }
    if (item.type === 'folder') {
      return this.getCommands().filter(c => c.folderId === item.id);
    }
    return [];
  }

  async handleDrag(items: readonly TreeNode[], dataTransfer: vscode.DataTransfer) {
    dataTransfer.set('application/vnd.code.tree.savedCommandsView', new vscode.DataTransferItem(items));
  }

  async handleDrop(target: TreeNode | undefined, dataTransfer: vscode.DataTransfer) {
    const data = dataTransfer.get('application/vnd.code.tree.savedCommandsView');
    if (!data) { return; }

    const dragged: TreeNode[] = data.value;
    let commands = this.getCommands();
    let folders = this.getFolders();

    for (const draggedItem of dragged) {
      if (draggedItem.type === 'command') {
        const cmd = commands.find(c => c.id === draggedItem.id);
        if (!cmd) { continue; }

        if (!target) {
          cmd.folderId = undefined;
          const rootCmds = commands.filter(c => !c.folderId && c.id !== cmd.id);
          const maxOrder = rootCmds.length > 0 ? Math.max(...rootCmds.map(c => c.order)) : -1;
          cmd.order = maxOrder + 1;
        } else if (target.type === 'folder') {
          cmd.folderId = target.id;
          const folderCmds = commands.filter(c => c.folderId === target.id && c.id !== cmd.id);
          const maxOrder = folderCmds.length > 0 ? Math.max(...folderCmds.map(c => c.order)) : -1;
          cmd.order = maxOrder + 1;
        } else if (target.type === 'command') {
          cmd.folderId = target.folderId;
          const targetOrder = target.order;
          const siblings = commands.filter(c =>
            c.folderId === target.folderId && c.id !== cmd.id && c.order >= targetOrder
          );
          for (const sibling of siblings) { sibling.order += 1; }
          cmd.order = targetOrder;
        }

      } else if (draggedItem.type === 'folder') {
        const folder = folders.find(f => f.id === draggedItem.id);
        if (!folder) { continue; }

        if (!target) {
          const others = folders.filter(f => f.id !== folder.id);
          const maxOrder = others.length > 0 ? Math.max(...others.map(f => f.order)) : -1;
          folder.order = maxOrder + 1;
        } else if (target.type === 'folder' && target.id !== folder.id) {
          const targetOrder = target.order;
          const othersAtOrAfter = folders.filter(f => f.id !== folder.id && f.order >= targetOrder);
          for (const f of othersAtOrAfter) { f.order += 1; }
          folder.order = targetOrder;
        } else if (target.type === 'command' && !target.folderId) {
          const targetOrder = target.order;
          const rootCmdsAtOrAfter = commands.filter(c => !c.folderId && c.order >= targetOrder);
          for (const c of rootCmdsAtOrAfter) { c.order += 1; }
          folder.order = targetOrder;
        }
      }
    }

    await this.context.globalState.update('savedCommands', commands);
    await this.context.globalState.update('savedFolders', folders);
    this.refresh();
  }
}

export function activate(context: vscode.ExtensionContext) {
  const provider = new CommandsProvider(context);

  vscode.window.createTreeView('savedCommandsView', {
    treeDataProvider: provider,
    dragAndDropController: provider
  });

  context.subscriptions.push(
    vscode.commands.registerCommand('savedCommands.add', async () => {
      const label = await vscode.window.showInputBox({
        prompt: 'Command name e.g. Start Dev Server',
      });
      if (!label) { return; }
      const command = await vscode.window.showInputBox({
        prompt: 'Terminal command — use <placeholders> for dynamic values e.g. docker compose build <service>',
      });
      if (!command) { return; }

      const commands = provider.getCommands();
      const maxOrder = commands.filter(c => !c.folderId).length > 0
        ? Math.max(...commands.filter(c => !c.folderId).map(c => c.order))
        : -1;
      commands.push({ type: 'command', id: Date.now().toString(), label, command, order: maxOrder + 1 });
      await context.globalState.update('savedCommands', commands);

      provider.refresh();
      vscode.window.showInformationMessage(`Saved: ${label}`);
    }),

    vscode.commands.registerCommand('savedCommands.addToFolder', async (folder: Folder) => {
      const label = await vscode.window.showInputBox({ prompt: 'Command name' });
      if (!label) { return; }
      const command = await vscode.window.showInputBox({
        prompt: 'Terminal command — use <placeholders> for dynamic values e.g. docker compose build <service>',
      });
      if (!command) { return; }

      const commands = provider.getCommands();
      const folderCmds = commands.filter(c => c.folderId === folder.id);
      const maxOrder = folderCmds.length > 0 ? Math.max(...folderCmds.map(c => c.order)) : -1;
      commands.push({ type: 'command', id: Date.now().toString(), label, command, folderId: folder.id, order: maxOrder + 1 });
      await context.globalState.update('savedCommands', commands);

      provider.refresh();
      vscode.window.showInformationMessage(`Saved: ${label}`);
    }),

    vscode.commands.registerCommand('savedCommands.run', async (cmd: SavedCommand) => {
      const resolved = await resolvePlaceholders(cmd.command);
      if (resolved === undefined) { return; } // user cancelled

      const terminal = vscode.window.activeTerminal ?? vscode.window.createTerminal();
      terminal.show();
      terminal.sendText(resolved);
    }),

    vscode.commands.registerCommand('savedCommands.delete', async (cmd: SavedCommand) => {
      const confirm = await vscode.window.showWarningMessage(
        `Delete "${cmd.label}"?`, { modal: true }, 'Delete'
      );
      if (confirm !== 'Delete') { return; }

      const commands = provider.getCommands();
      await context.globalState.update('savedCommands', commands.filter(c => c.id !== cmd.id));
      provider.refresh();
    }),

    vscode.commands.registerCommand('savedCommands.edit', async (cmd: SavedCommand) => {
      const newLabel = await vscode.window.showInputBox({
        prompt: 'Edit command name',
        value: cmd.label
      });
      if (!newLabel) { return; }

      const newCommand = await vscode.window.showInputBox({
        prompt: 'Edit terminal command — use <placeholders> for dynamic values',
        value: cmd.command
      });
      if (!newCommand) { return; }

      const commands = provider.getCommands();
      const index = commands.findIndex(c => c.id === cmd.id);
      if (index === -1) { return; }

      commands[index].label = newLabel;
      commands[index].command = newCommand;
      await context.globalState.update('savedCommands', commands);

      provider.refresh();
      vscode.window.showInformationMessage(`Updated: ${newLabel}`);
    }),

    vscode.commands.registerCommand('savedCommands.addFolder', async () => {
      const label = await vscode.window.showInputBox({ prompt: 'Folder name e.g. Docker' });
      if (!label) { return; }

      const folders = provider.getFolders();
      const maxOrder = folders.length > 0 ? Math.max(...folders.map(f => f.order)) : -1;
      folders.push({ type: 'folder', id: Date.now().toString(), label, order: maxOrder + 1 });
      await context.globalState.update('savedFolders', folders);

      provider.refresh();
      vscode.window.showInformationMessage(`Folder created: ${label}`);
    }),

    vscode.commands.registerCommand('savedCommands.deleteFolder', async (folder: Folder) => {
      const confirm = await vscode.window.showWarningMessage(
        `Delete folder "${folder.label}" and all its commands?`, { modal: true }, 'Delete'
      );
      if (confirm !== 'Delete') { return; }

      const folders = provider.getFolders();
      const commands = provider.getCommands();

      await context.globalState.update('savedFolders', folders.filter(f => f.id !== folder.id));
      await context.globalState.update('savedCommands', commands.filter(c => c.folderId !== folder.id));

      provider.refresh();
    }),

    vscode.commands.registerCommand('savedCommands.editFolder', async (folder: Folder) => {
      const newLabel = await vscode.window.showInputBox({
        prompt: 'Edit folder name',
        value: folder.label
      });
      if (!newLabel) { return; }

      const folders = provider.getFolders();
      const index = folders.findIndex(f => f.id === folder.id);
      if (index === -1) { return; }

      folders[index].label = newLabel;
      await context.globalState.update('savedFolders', folders);

      provider.refresh();
      vscode.window.showInformationMessage(`Folder renamed to: ${newLabel}`);
    }),
  );
}

export function deactivate() {}