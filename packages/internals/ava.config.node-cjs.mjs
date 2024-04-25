export default {
    files: ['test/**/*.test.ts'],
    nodeArguments: ['--conditions', 'node'],
    typescript: {
        compile: false,
        rewritePaths: { 'test/': 'dist/tests-node-cjs/test/' },
    },
    watchMode: {
        ignoreChanges: ['src/**', 'test/**'],
    },
};
