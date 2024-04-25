export default {
    files: ['test/**/*.test.ts'],
    nodeArguments: ['--conditions', 'react-native'],
    typescript: {
        compile: false,
        rewritePaths: { 'test/': 'dist/tests-react-native-esm/test/' },
    },
    watchMode: {
        ignoreChanges: ['src/**', 'test/**'],
    },
};
