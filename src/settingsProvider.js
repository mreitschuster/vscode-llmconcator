const vscode = require('vscode');

class SettingsProvider {
  constructor(context) {
    this.context = context;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  getTreeItem(element) {
    const treeItem = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
    treeItem.command = {
      command: 'extension.promptInput',
      title: 'Edit Settings',
    };
    return treeItem;
  }

  getChildren(element) {
    const config = vscode.workspace.getConfiguration('llmconcator');
    const startingPrompt = config.get('startingPrompt', 'Default starting prompt...');
    const separator = config.get('separator', 'Default separator...');
    const userPrompt = config.get('userPrompt', 'Default user prompt...');

    return Promise.resolve([
      {
        label: `Starting Prompt: ${startingPrompt}`,
        contextValue: 'setting',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
      },
      {
        label: `Separator: ${separator}`,
        contextValue: 'setting',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
      },
      {
        label: `User Prompt: ${userPrompt}`,
        contextValue: 'setting',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
      }
    ]);
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }
}

module.exports = SettingsProvider;
