#!/usr/bin/env bash

function test_project() {
    ./test/e2e/generate.cjs $1
    cd test/e2e/$1
    cargo check
    cd ../../..
}

test_project dummy
test_project system
test_project memo
