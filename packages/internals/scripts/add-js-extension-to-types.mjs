#!/usr/bin/env zx
import { fs, path } from 'zx';

/**
 * Go through all `.d.ts` files in the given directory recursively and
 * call the `handleFile` function defined below on each of them.
 */
export async function handleDirectory(directory) {
    const files = await fs.promises.readdir(directory);
    return await Promise.all(
        files.map(async fileName => {
            const filePath = path.join(directory, fileName);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                return handleDirectory(filePath);
            }
            if (stats.isFile() && fileName.endsWith('.d.ts')) {
                return await handleFile(directory, filePath);
            }
        }),
    );
}

/**
 * Replace the content of all relative import and export statements inside the
 * given `.d.ts` file such that it adds the `.js` extension to all paths.
 * If the imported path is a directory, it adds `/index.js` instead.
 */
export async function handleFile(directory, filePath) {
    let content = await fs.promises.readFile(filePath, 'utf8');

    content = content.replace(
        /((?:import|export).+from[^']+')(\.+\/[^']+)(';)/g,
        (_match, prefix, importPath, suffix) => {
            // Get the import path relative to the main directory.
            const absoluteImportPath = path.join(directory, importPath);

            // Identify whether the import path is a directory or a file.
            const isDirectory = fs.existsSync(absoluteImportPath) && fs.statSync(absoluteImportPath).isDirectory();

            // Add the `.js` extension and `/index` if it's a directory.
            return `${prefix}${importPath}${isDirectory ? '/index.js' : '.js'}${suffix}`;
        },
    );

    return await fs.promises.writeFile(filePath, content, 'utf8');
}
