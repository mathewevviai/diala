#!/bin/bash

# Test script for Jina commands
echo "Testing Jina2Docs and JinaRecursiveSearch commands"
echo "=================================================="

# Test 1: Basic Jina2Docs
echo -e "\n1. Testing basic Jina2Docs extraction:"
echo "Command: /Jina2Docs https://docs.jina.ai jina api"
echo "(This would extract content from Jina docs and filter for 'jina' and 'api' keywords)"

# Test 2: Jina2Docs with custom output
echo -e "\n2. Testing Jina2Docs with custom output:"
echo "Command: /Jina2Docs https://docs.jina.ai --output docs/jina-api api endpoint"
echo "(This would save results to a custom directory)"

# Test 3: JinaRecursiveSearch basic
echo -e "\n3. Testing JinaRecursiveSearch:"
echo "Command: /JinaRecursiveSearch \"machine learning optimization\" --depth 2"
echo "(This would perform a 2-level deep search on ML optimization)"

# Test 4: JinaRecursiveSearch with focus areas
echo -e "\n4. Testing JinaRecursiveSearch with focus:"
echo "Command: /JinaRecursiveSearch \"kubernetes\" --focus \"security,networking\" --depth 3"
echo "(This would search for Kubernetes with focus on security and networking)"

echo -e "\n=================================================="
echo "These commands leverage the Jina Search and Reader APIs"
echo "to build comprehensive knowledge bases on any topic."
echo ""
echo "The commands are now available in Claude Code via:"
echo "  /Jina2Docs - Extract content from URLs with filtering"
echo "  /JinaRecursiveSearch - Deep recursive topic research"