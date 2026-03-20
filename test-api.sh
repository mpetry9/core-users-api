#!/bin/bash

echo "🧪 Testing core-users-api endpoints..."
echo ""

# Test health endpoint
echo "1. Testing health endpoint..."
echo "GET http://localhost:3000/health"
echo "Response:"
node -e "fetch('http://localhost:3000/health').then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)))"
echo ""

# Test users list endpoint
echo "2. Testing users list endpoint (default pagination)..."
echo "GET http://localhost:3000/api/users"
echo "Response:"
node -e "fetch('http://localhost:3000/api/users').then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)))"
echo ""

# Test users list endpoint with pagination
echo "3. Testing users list endpoint (page 2, limit 5)..."
echo "GET http://localhost:3000/api/users?page=2&limit=5"
echo "Response:"
node -e "fetch('http://localhost:3000/api/users?page=2&limit=5').then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)))"
echo ""

# Test single user endpoint
echo "4. Testing single user endpoint..."
echo "GET http://localhost:3000/api/users/1"
echo "Response:"
node -e "fetch('http://localhost:3000/api/users/1').then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)))"
echo ""

echo "✅ Tests completed!"
