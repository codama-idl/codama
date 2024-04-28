#!/usr/bin/env bash

function test_project() {
    ./e2e/generate.cjs $1
    cd e2e/$1
    cargo check
    cd ../..
}

test_project system
test_project memo
