#!/usr/bin/env bash
set -eux

function test_project() {
    node ./e2e/$1-parser/codama.cjs $1
    cd e2e/$1-parser
    cargo check
    cd ../..
}

test_project system
test_project orca-whirlpool
test_project raydium-amm-v4