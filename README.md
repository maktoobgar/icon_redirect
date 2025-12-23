# Icon Redirect README

Basically when clicked on `src/icons/Icon.svelte`, it opens up the `src/icons/svg/icon.svg` file beside the `Icon.svelte` if found.
The `.svg` file that it tries to find, is going to be a snake case version of the `.svelte` name itself.

## How to build

Have `vsce` installed

```bash
npm install -g @vscode/vsce
```

Build command:

```bash
vsce package
```
