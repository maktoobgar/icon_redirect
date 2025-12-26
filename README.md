# Icon Redirect README

Basically when clicked on `src/icons/Icon.svelte` which inside it is a component which is actually just a simple `svg` icon, it opens up a new tab to preview the `svg` representor of how the `Icon.svelte` actually looks.
Just for more simplification, you click on `src/icons/Icon.svelte`, you will see a preview render of the svg right beside it.

## How to build

Have `vsce` installed

```bash
npm install -g @vscode/vsce
```

Build command:

```bash
vsce package
```
