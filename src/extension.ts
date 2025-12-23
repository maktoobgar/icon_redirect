import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	// 1. Check active documents immediately upon activation
	vscode.window.tabGroups.all
		.flatMap((group) => group.tabs)
		.forEach((tab) => {
			if (tab.input instanceof vscode.TabInputText) {
				checkAndRedirect(tab.input.uri);
			}
		});

	// 2. Listen for new documents being opened
	const disposable = vscode.workspace.onDidOpenTextDocument(async (document) => {
		await checkAndRedirect(document.uri);
	});

	context.subscriptions.push(disposable);
}

async function checkAndRedirect(uri: vscode.Uri) {
	// Basic checks to ensure we only process relevant files
	if (uri.scheme !== 'file' || !uri.path.endsWith('.svelte')) {
		return;
	}

	// Ensure the file is inside 'src/icons'
	// We normalize separators to handle Windows/Linux differences
	const pathParts = uri.fsPath.split(path.sep);
	const parentDir = pathParts[pathParts.length - 2];
	const grandParentDir = pathParts[pathParts.length - 3];

	// Adjust these checks if your folder structure differs (e.g. if 'icons' is not direct child of 'src')
	if (parentDir !== 'icons' || grandParentDir !== 'src') {
		return;
	}

	const fileName = path.basename(uri.fsPath, '.svelte');

	// Convert PascalCase to snake_case
	const snakeCaseName = snakeCase(fileName);

	const targetFileName = `${snakeCaseName}.svg`;

	// User logic: looks for svgs folder relative to the file.
	// If your file is in 'src/icons/Icon.svelte', this looks in 'src/icons/svgs/icon.svg'
	const targetUri = vscode.Uri.joinPath(uri, '../svgs', targetFileName);

	try {
		// Check if the target .svg exists
		await vscode.workspace.fs.stat(targetUri);

		// --- CHANGE START ---

		// 1. "Pin" the .svelte file first.
		// passing { preview: false } ensures it stays open and isn't replaced by the next command.
		await vscode.commands.executeCommand('vscode.open', uri, {
			preview: false,
			preserveFocus: true
		});

		// 2. Open the SVG file in a new tab (or side-by-side if you prefer)
		await vscode.commands.executeCommand('vscode.open', targetUri, {
			preview: false // Optional: open the svg as pinned too
		});

		// --- CHANGE END ---
	} catch (err) {
		// If file doesn't exist, do nothing (keep .svelte open and editable)
	}
}

export function deactivate() {}

const snakeCase = (v: string) => {
	return v
		.replace(/\W+/g, ' ')
		.split(/ |\B(?=[A-Z])/)
		.map((word) => word.toLowerCase())
		.join('_');
};
