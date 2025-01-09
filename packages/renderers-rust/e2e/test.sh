#!/usr/bin/env bash
set -eux

function test_project() {
    ./e2e/generate.cjs $1 
    cd e2e/$1
    cargo check
    cd ../..
}

function test_anchor_project() {
    ./e2e/generate-anchor.cjs $1 
    cd e2e/$1
    cargo check
    cd ../..
}

test_project dummy
test_project system
test_project memo
test_anchor_project anchor