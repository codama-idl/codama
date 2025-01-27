#!/usr/bin/env bash
set -eux

function start_validator() {
    if ! lsof -t -i:8899; then
        echo "Starting solana-test-validator"
        solana-test-validator >/dev/null 2>&1 &
    fi
}

function test_project() {
    ./e2e/generate.cjs $1
    cd e2e/$1
    pnpm install && pnpm build && pnpm test
    cd ../..
}

start_validator
test_project anchor
test_project system
test_project memo
test_project token
test_project dummy
