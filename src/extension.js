const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const FileTreeProvider = require('./treeViewProvider');
const SettingsProvider = require('./settingsProvider');

async function activate(context) {
  const fileTreeDataProvider = new FileTreeProvider(context);
  const settingsProvider = new SettingsProvider(context);

  vscode.window.registerTreeDataProvider('fileView', fileTreeDataProvider);
  vscode.window.registerTreeDataProvider('settingsView', settingsProvider);

  context.subscriptions.push(vscode.commands.registerCommand('extension.concatenateFiles', async () => {
    try {
      const config = vscode.workspace.getConfiguration('llmconcator');
      const startingPrompt = config.get('startingPrompt');
      const separator = config.get('separator');
      const userPrompt = config.get('userPrompt');

      const selectedFiles = context.workspaceState.get('selectedFiles', []);

      if (selectedFiles.length === 0) {
        vscode.window.showErrorMessage('No files selected');
        return;
      }

      let concatenatedText = `${startingPrompt}\n${separator}\n`;

      for (const filePath of selectedFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        concatenatedText += `path/${path.basename(filePath)}:\n{\n${content}\n}\n${separator}\n`;
      }

      concatenatedText += `${userPrompt}\n${separator}`;

      const document = await vscode.workspace.openTextDocument({
        content: concatenatedText,
        language: 'text'
      });

      await vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(`An error occurred: ${error.message}`);
    }
  }));

  context.subscriptions.push(vscode.commands.registerCommand('extension.refreshTreeView', () => {
    fileTreeDataProvider.refresh();
  }));

  context.subscriptions.push(vscode.commands.registerCommand('extension.toggleFileSelection', (filePath) => {
    fileTreeDataProvider.toggleFileSelection(filePath);
  }));

  context.subscriptions.push(vscode.commands.registerCommand('extension.runConcatenateFiles', () => {
    vscode.commands.executeCommand('extension.concatenateFiles');
  }));

  context.subscriptions.push(vscode.commands.registerCommand('extension.promptInput', async () => {
    vscode.commands.executeCommand('workbench.action.openSettings', 'llmconcator');
  }));
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
