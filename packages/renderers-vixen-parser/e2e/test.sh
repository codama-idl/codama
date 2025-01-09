#!/usr/bin/env bash
set -eux

function test_project() {
    ./e2e/generate.cjs $1 $2
    cd e2e/$1
    cargo check
    cd ../..
}

function test_anchor_project() {
    ./e2e/generate-anchor.cjs $1 $2 
    cd e2e/$1
    cargo check
    cd ../..
}
test_project ./dummy_parser codama-renderers-rust-e2e-dummy
test_project ./system_parser codama-renderers-rust-e2e-system
test_project ./memo_parser codama-renderers-rust-e2e-memo
test_anchor_project ./anchor_parser codama-renderers-rust-e2e-anchor
