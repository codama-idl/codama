#!/usr/bin/env bash
set -eux

function test_project() {
    node ./e2e/$1-parser/codama.cjs $1 $2
    cd e2e/$1-parser
    cargo check
    cd ../..
}

test_project system true
test_project orca-whirlpool true
# test_project raydium-amm-v4 true