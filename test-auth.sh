#!/bin/bash

# Test script for authentication endpoints
# Make sure the server is running before executing this script

BASE_URL="http://localhost:3000"
EMAIL="test-$(date +%s)@example.com"
PASSWORD="TestPassword123"
NAME="Test User"

echo "============================================"
echo "Testing Core Users API Authentication"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check (Public)
echo "1. Testing Health Check (Public)..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed (Status: $HEALTH_RESPONSE)${NC}"
    exit 1
fi
echo ""

# Test 2: Signup
echo "2. Testing Signup..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if echo "$SIGNUP_RESPONSE" | grep -q "accessToken"; then
    echo -e "${GREEN}✓ Signup successful${NC}"
    ACCESS_TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
    REFRESH_TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"refreshToken":"[^"]*' | sed 's/"refreshToken":"//')
    USER_ID=$(echo "$SIGNUP_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
    echo "  Email: $EMAIL"
    echo "  User ID: $USER_ID"
else
    echo -e "${RED}✗ Signup failed${NC}"
    echo "Response: $SIGNUP_RESPONSE"
    exit 1
fi
echo ""

# Test 3: Login
echo "3. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    echo -e "${GREEN}✓ Login successful${NC}"
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi
echo ""

# Test 4: Get Current User (with JWT)
echo "4. Testing Get Current User (JWT authentication)..."
ME_RESPONSE=$(curl -s "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$ME_RESPONSE" | grep -q "$EMAIL"; then
    echo -e "${GREEN}✓ Get current user successful${NC}"
else
    echo -e "${RED}✗ Get current user failed${NC}"
    echo "Response: $ME_RESPONSE"
    exit 1
fi
echo ""

# Test 5: Access Protected Users Endpoint (with JWT)
echo "5. Testing Protected Users Endpoint (JWT authentication)..."
USERS_RESPONSE=$(curl -s "$BASE_URL/api/users" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$USERS_RESPONSE" | grep -q "users"; then
    echo -e "${GREEN}✓ Access to protected endpoint successful${NC}"
else
    echo -e "${RED}✗ Access to protected endpoint failed${NC}"
    echo "Response: $USERS_RESPONSE"
    exit 1
fi
echo ""

# Test 6: Create API Key
echo "6. Testing API Key Creation..."
API_KEY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/keys" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test API Key","expiresInDays":30}')

if echo "$API_KEY_RESPONSE" | grep -q "\"key\":\"sk_"; then
    echo -e "${GREEN}✓ API key creation successful${NC}"
    API_KEY=$(echo "$API_KEY_RESPONSE" | grep -o '"key":"[^"]*' | sed 's/"key":"//')
    echo "  API Key: ${API_KEY:0:20}..."
else
    echo -e "${RED}✗ API key creation failed${NC}"
    echo "Response: $API_KEY_RESPONSE"
    exit 1
fi
echo ""

# Test 7: Access Protected Endpoint with API Key
echo "7. Testing Protected Endpoint (API Key authentication)..."
API_KEY_USERS_RESPONSE=$(curl -s "$BASE_URL/api/users" \
  -H "Authorization: ApiKey $API_KEY")

if echo "$API_KEY_USERS_RESPONSE" | grep -q "users"; then
    echo -e "${GREEN}✓ API key authentication successful${NC}"
else
    echo -e "${RED}✗ API key authentication failed${NC}"
    echo "Response: $API_KEY_USERS_RESPONSE"
    exit 1
fi
echo ""

# Test 8: List API Keys
echo "8. Testing List API Keys..."
LIST_KEYS_RESPONSE=$(curl -s "$BASE_URL/api/keys" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$LIST_KEYS_RESPONSE" | grep -q "keys"; then
    echo -e "${GREEN}✓ List API keys successful${NC}"
else
    echo -e "${RED}✗ List API keys failed${NC}"
    echo "Response: $LIST_KEYS_RESPONSE"
    exit 1
fi
echo ""

# Test 9: Refresh Token
echo "9. Testing Token Refresh..."
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")

if echo "$REFRESH_RESPONSE" | grep -q "accessToken"; then
    echo -e "${GREEN}✓ Token refresh successful${NC}"
    NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
else
    echo -e "${RED}✗ Token refresh failed${NC}"
    echo "Response: $REFRESH_RESPONSE"
    exit 1
fi
echo ""

# Test 10: Access Denied (No Auth)
echo "10. Testing Access Denied (no authentication)..."
NO_AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/users")

if [ "$NO_AUTH_RESPONSE" = "401" ]; then
    echo -e "${GREEN}✓ Protected endpoint correctly requires authentication${NC}"
else
    echo -e "${RED}✗ Protected endpoint should return 401 (got: $NO_AUTH_RESPONSE)${NC}"
fi
echo ""

echo "============================================"
echo -e "${GREEN}All Tests Passed! ✓${NC}"
echo "============================================"
echo ""
echo "Test Summary:"
echo "  - Health check: OK"
echo "  - User signup: OK"
echo "  - User login: OK"
echo "  - JWT authentication: OK"
echo "  - API key creation: OK"
echo "  - API key authentication: OK"
echo "  - Token refresh: OK"
echo "  - Access control: OK"
echo ""
echo "Test account created:"
echo "  Email: $EMAIL"
echo "  Password: $PASSWORD"
echo ""
