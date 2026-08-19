#!/bin/bash
set -e

BUILD_DIR="../temp_sytech_build"
REMOTE_URL="https://gitlab.cytechnology.ir/any-purse/frontend/zarpal-web.git"

echo "🧱 Cleaning and preparing temp directory..."
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

echo "🏗️ Building Next.js project..."
yarn install --frozen-lockfile > /dev/null 2>&1
yarn build

echo "📦 Copying production files..."
cp -r .next $BUILD_DIR/
cp -r public $BUILD_DIR/
cp package.json $BUILD_DIR/
cp next.config.js $BUILD_DIR/ 2>/dev/null || true
cp yarn.lock $BUILD_DIR/ 2>/dev/null || true

cd $BUILD_DIR

echo "🚀 Initializing temporary git repo..."
git init
git branch -M main
git remote add origin $REMOTE_URL
git add .
git commit -m "Production build update"
git push -f origin main

cd -
rm -rf $BUILD_DIR

echo "✅ Build successfully pushed to secondary repo!"
