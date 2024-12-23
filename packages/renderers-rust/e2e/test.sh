#!/usr/bin/env bash
set -eux

function test_project() {
    ./e2e/generate.cjs $1 $2
    cd e2e/$1
    cargo check
    cd ../..
}

test_project dummy
test_project system
test_project memo
