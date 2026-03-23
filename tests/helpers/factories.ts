/**
 * Factory for creating test user data
 */
export function createTestUserData(overrides?: {
  name?: string;
  email?: string;
  password?: string;
  status?: string;
}) {
  return {
    name: overrides?.name || "John Doe",
    email: overrides?.email || `test${Date.now()}@example.com`,
    password: overrides?.password || "Password123",
    status: overrides?.status || "active",
  };
}

/**
 * Factory for creating multiple test users with unique emails
 */
export function createTestUsers(
  count: number,
  baseOverrides?: {
    status?: string;
  },
): Array<{
  name: string;
  email: string;
  password: string;
  status: string;
}> {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      name: `Test User ${i + 1}`,
      email: `testuser${Date.now()}_${i}@example.com`,
      password: "Password123",
      status: baseOverrides?.status || "active",
    });
  }
  return users;
}

/**
 * Factory for creating test API key data
 */
export function createTestApiKeyData(overrides?: {
  name?: string;
  expiresInDays?: number;
}) {
  return {
    name: overrides?.name || "Test API Key",
    expiresInDays: overrides?.expiresInDays,
  };
}

/**
 * Factory for invalid signup data (for validation tests)
 */
export const invalidSignupData = {
  shortName: {
    name: "J",
    email: "valid@example.com",
    password: "Password123",
  },
  longName: {
    name: "A".repeat(101),
    email: "valid@example.com",
    password: "Password123",
  },
  invalidEmail: {
    name: "John Doe",
    email: "not-an-email",
    password: "Password123",
  },
  weakPassword: {
    name: "John Doe",
    email: "valid@example.com",
    password: "short",
  },
  passwordNoLetter: {
    name: "John Doe",
    email: "valid@example.com",
    password: "12345678",
  },
  passwordNoNumber: {
    name: "John Doe",
    email: "valid@example.com",
    password: "PasswordOnly",
  },
  missingName: {
    email: "valid@example.com",
    password: "Password123",
  },
  missingEmail: {
    name: "John Doe",
    password: "Password123",
  },
  missingPassword: {
    name: "John Doe",
    email: "valid@example.com",
  },
};

/**
 * Factory for invalid login data (for validation tests)
 */
export const invalidLoginData = {
  invalidEmail: {
    email: "not-an-email",
    password: "Password123",
  },
  missingEmail: {
    password: "Password123",
  },
  missingPassword: {
    email: "valid@example.com",
  },
};

/**
 * Factory for invalid API key data (for validation tests)
 */
export const invalidApiKeyData = {
  shortName: {
    name: "AB",
  },
  longName: {
    name: "A".repeat(101),
  },
  invalidExpiry: {
    name: "Test Key",
    expiresInDays: 5000, // > 3650 max
  },
  negativeExpiry: {
    name: "Test Key",
    expiresInDays: -1,
  },
  missingName: {},
};
