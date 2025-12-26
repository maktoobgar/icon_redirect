import * as vscode from "vscode";
import * as path from "path";
import fs from "fs";

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
	const disposable = vscode.workspace.onDidOpenTextDocument(
		async (document) => {
			await checkAndRedirect(document.uri);
		}
	);

	context.subscriptions.push(disposable);
}

async function checkAndRedirect(uri: vscode.Uri) {
	// Basic checks to ensure we only process relevant files
	if (uri.scheme !== "file" || !uri.path.endsWith(".svelte")) {
		return;
	}

	// 1. "Pin" the .svelte file first.
	// passing { preview: false } ensures it stays open and isn't replaced by the next command.
	await vscode.commands.executeCommand("vscode.open", uri, {
		preview: false,
		preserveFocus: true
	});

	let svelteContent = "";
	if (uri.path.endsWith(".svelte")) {
		svelteContent = transformSvgContent(fs.readFileSync(uri.path, "utf8"));
	}

	const fileName = path.basename(uri.fsPath, ".svelte");
	if (svelteContent && svelteContent.trim().length > 0) {
		const panel = vscode.window.createWebviewPanel(
			"svgPreview", // internal id
			`${fileName}.svg preview`, // tab title
			vscode.ViewColumn.Active, // open beside .svelte file
			{
				enableScripts: false,
				retainContextWhenHidden: true
			}
		);

		// Wrap the svelte content in HTML so VSCode can render it
		panel.webview.html = `
				<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<style>
						html, body {
							padding: 0;
							margin: 0;
							display: flex;
							align-items: center;
							justify-content: center;
							height: 100%;
						}
						svg {
							max-width: 100%;
							max-height: 100%;
						}
					</style>
				</head>
				<body>
					${svelteContent}
				</body>
				</html>`;
	}

	// Ensure the file is inside 'src/icons'
	// We normalize separators to handle Windows/Linux differences
	const pathParts = uri.fsPath.split(path.sep);
	const parentDir = pathParts[pathParts.length - 2];
	const grandParentDir = pathParts[pathParts.length - 3];

	// Adjust these checks if your folder structure differs (e.g. if 'icons' is not direct child of 'src')
	if (parentDir !== "icons" || grandParentDir !== "src") {
		return;
	}
}

function transformSvgContent(content: string): string {
	// 1️⃣ Extract only <svg>...</svg> part
	const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/i);
	if (!svgMatch) {
		console.warn("⚠️ No <svg> found in file.");
		return "";
	}
	let svgContent = svgMatch[0];

	// 2️⃣ Extract viewBox values (e.g., "0 0 24 24")
	const viewBoxMatch = svgContent.match(
		/viewBox\s*=\s*["']\s*0\s+0\s+(\d+)\s+(\d+)["']/
	);
	let width = "24";
	let height = "24";
	if (viewBoxMatch) {
		width = viewBoxMatch[1];
		height = viewBoxMatch[2];
	}

	// 3️⃣ Clean and modify SVG attributes
	svgContent = svgContent.replace(/<svg([^>]*)>/, (_match, attrs) => {
		let newAttrs = attrs;

		// 🔹 Remove all Svelte/JSX-style dynamic bindings (e.g., class={props.class}, fill={color}, stroke={x})
		newAttrs = newAttrs.replace(/\s+\w+\s*=\s*\{[^}]+\}/g, "");
		newAttrs = newAttrs.replace(/\s+width\s*=\s*["']\s*(\d+)\s*["']/g, "");
		newAttrs = newAttrs.replace(/\s+height\s*=\s*["']\s*(\d+)\s*["']/g, "");

		// Add or replace width and height
		newAttrs = ` width="512"` + newAttrs;
		newAttrs = ` height="512"` + newAttrs;

		return `<svg${newAttrs}>`;
	});

	// 4️⃣ Modify fills and strokes
	svgContent = svgContent.replace(
		/fill="none"/g,
		'stroke="currentColor" fill="none"'
	);
	svgContent = svgContent.replace(
		/stroke="none"/g,
		'fill="currentColor" stroke="none"'
	);

	return svgContent.trim();
}

export function deactivate() {}
