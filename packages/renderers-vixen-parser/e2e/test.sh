#!/usr/bin/env bash
set -eux

function test_project() {
    ./e2e/generate.cjs $1 $2 $3
    cd e2e/$1
    cargo check
    cd ../..
}

function test_anchor_project() {
    ./e2e/generate-anchor.cjs $1 $2 $3 
    cd e2e/$1/parser
    cargo check
    cd ../..
}
test_project ./dummy_parser codama-renderers-rust-e2e-dummy true
test_project ./system_parser codama-renderers-rust-e2e-system true
test_project ./memo_parser codama-renderers-rust-e2e-memo true
test_anchor_project ./anchor_parser codama-renderers-rust-e2e-anchor true

test_anchor_project meteora codama-renderers-rust-e2e-meteora true