export default {
    files: ['test/**/*.test.ts'],
    nodeArguments: ['--conditions', 'browser'],
    typescript: {
        compile: false,
        rewritePaths: { 'test/': 'dist/tests-browser-cjs/test/' },
    },
    watchMode: {
        ignoreChanges: ['src/**', 'test/**'],
    },
};
