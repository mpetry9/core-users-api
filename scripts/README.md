# Database Scripts

This directory contains utility scripts for managing the database.

## Seed Users Script

The `seed-users.ts` script allows you to easily populate your database with users.

### How to Use

1. **Edit the user data** in `scripts/seed-users.ts`:

```typescript
const users = [
  {
    name: "John Doe",
    email: "john@example.com",
    password: "Password123", // Will be hashed automatically
    status: "active",
  },
  // Add more users here...
];
```

2. **Run the seed script**:

```bash
npm run seed
```

### Features

✅ **Automatic Password Hashing** - Passwords are automatically hashed with bcrypt  
✅ **Duplicate Detection** - Won't create users that already exist  
✅ **Error Handling** - Shows clear success/error messages for each user  
✅ **Summary Report** - Displays total user count after seeding

### Example Output

```
🌱 Starting user seeding...

✅ Created user: John Doe (john@example.com) - ID: 1
✅ Created user: Jane Smith (jane@example.com) - ID: 2
⚠️  User already exists: bob@example.com (ID: 3)

✨ Seeding complete! Total users in database: 3
```

### Tips

- **Add multiple users at once** by adding more objects to the `users` array
- **Run multiple times** - It's safe! Existing users won't be duplicated
- **Test credentials** - Use the seeded users to test login functionality
- **Custom status** - Set status to 'active', 'inactive', or any custom value

### After Seeding

You can login with any seeded user:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```
