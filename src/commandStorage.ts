import * as vscode from 'vscode';

export interface SavedCommand {
  id: string;
  label: string;
  command: string;
}

export class CommandStorage {
  private readonly KEY = 'savedCommands';

  constructor(private state: vscode.Memento) {}

  getAll(): SavedCommand[] {
    return this.state.get<SavedCommand[]>(this.KEY, []);
  }

  add(label: string, command: string): void {
    const commands = this.getAll();
    commands.push({ id: Date.now().toString(), label, command });
    this.state.update(this.KEY, commands);
  }

  delete(id: string): void {
    const commands = this.getAll().filter(c => c.id !== id);
    this.state.update(this.KEY, commands);
  }
}