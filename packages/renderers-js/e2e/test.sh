#!/usr/bin/env bash

function test_project() {
    ./e2e/generate.cjs $1
    cd e2e/$1
    pnpm --ignore-workspace install && pnpm build && pnpm test
    cd ../..
}

function start_validator() {
    echo "Starting solana-test-validator"
    solana-test-validator >/dev/null 2>&1 &
}

function stop_validator() {
    echo "Stopping solana-test-validator"
    pkill -f solana-test-validator
}

start_validator
test_project system
test_project memo
stop_validator
