#!/bin/bash
set -e

pnpm install --frozen-lockfile=false

pnpm exec drizzle-kit push --force
