import * as vscode from 'vscode';
import { SavedCommand, CommandStorage } from './commandStorage';

export class CommandsProvider implements vscode.TreeDataProvider<SavedCommand> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private storage: CommandStorage) {}

  refresh() { this._onDidChangeTreeData.fire(); }

  getTreeItem(cmd: SavedCommand): vscode.TreeItem {
    const item = new vscode.TreeItem(cmd.label);
    item.description = cmd.command;
    item.tooltip = cmd.command;
    item.command = {
      command: 'savedCommands.run',
      title: 'Run',
      arguments: [cmd]
    };
    item.contextValue = 'savedCommand';
    return item;
  }

  getChildren(): SavedCommand[] {
    return this.storage.getAll();
  }
}