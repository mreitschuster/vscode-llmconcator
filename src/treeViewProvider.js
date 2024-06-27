const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

class FileTreeProvider {
  constructor(context) {
    this.context = context;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;

    this.selectedFiles = context.workspaceState.get('selectedFiles', []);
  }

  getTreeItem(element) {
    const treeItem = new vscode.TreeItem(element.label, element.collapsibleState);
    treeItem.contextValue = element.contextValue;
    treeItem.command = element.command;

    if (element.resourceUri && this.selectedFiles.includes(element.resourceUri.fsPath)) {
      treeItem.label = element.label;
      treeItem.tooltip = 'Selected';
      treeItem.iconPath = {
        light: path.join(__dirname, '..', 'resources', 'selectedIcon.svg'),
        dark: path.join(__dirname, '..', 'resources', 'selectedIcon.svg')
      };
    } else {
      treeItem.label = element.label;
    }

    return treeItem;
  }

  getChildren(element) {
    if (!element) {
      return this.getRootNodes();
    }
    if (element.contextValue === 'rootSelectedFiles') {
      return Promise.resolve(this.getSelectedFiles());
    }
    if (element.contextValue === 'rootAllFiles') {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (workspaceFolder) {
        return this.getFilesAndFolders(workspaceFolder.uri.fsPath);
      }
    }
    if (element.resourceUri) {
      const filePath = element.resourceUri.fsPath;
      if (fs.lstatSync(filePath).isDirectory()) {
        return this.getFilesAndFolders(filePath);
      }
    }
    return Promise.resolve([]);
  }

  getRootNodes() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      return Promise.resolve([
        { label: 'Selected Files', contextValue: 'rootSelectedFiles', collapsibleState: vscode.TreeItemCollapsibleState.Collapsed },
        { label: 'All Files', contextValue: 'rootAllFiles', collapsibleState: vscode.TreeItemCollapsibleState.Collapsed }
      ]);
    }
    return Promise.resolve([]);
  }

  getSelectedFiles() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return [];
    }

    const workspaceFolder = workspaceFolders[0].uri.fsPath;
    return this.selectedFiles
      .map(filePath => ({
        resourceUri: vscode.Uri.file(filePath),
        label: path.relative(workspaceFolder, filePath),
        contextValue: 'selectedFile',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        command: {
          command: 'extension.toggleFileSelection',
          title: 'Toggle File Selection',
          arguments: [filePath]
        }
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  getFilesAndFolders(dirPath) {
    return new Promise((resolve, reject) => {
      fs.readdir(dirPath, (err, files) => {
        if (err) {
          reject(err);
        } else {
          const result = files.map(file => {
            const filePath = path.join(dirPath, file);
            const fileUri = vscode.Uri.file(filePath);
            const isDirectory = fs.lstatSync(filePath).isDirectory();
            return {
              resourceUri: fileUri,
              collapsibleState: isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
              contextValue: 'file',
              label: file,
              command: isDirectory ? undefined : {
                command: 'extension.toggleFileSelection',
                title: 'Toggle File Selection',
                arguments: [filePath]
              }
            };
          }).sort((a, b) => a.label.localeCompare(b.label));
          resolve(result);
        }
      });
    });
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  toggleFileSelection(filePath) {
    const index = this.selectedFiles.indexOf(filePath);
    if (index === -1) {
      this.selectedFiles.push(filePath);
    } else {
      this.selectedFiles.splice(index, 1);
    }
    this.context.workspaceState.update('selectedFiles', this.selectedFiles);
    this.refresh();
  }
}

module.exports = FileTreeProvider;
