#!/usr/bin/env -S node

const run = require('../dist/cli.cjs').run;

void run(process.argv);
