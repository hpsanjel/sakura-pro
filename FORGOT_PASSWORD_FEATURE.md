# Forgot Password Feature - Complete Implementation

## Overview

The forgot password feature allows users to securely reset their passwords through an email-based workflow with token validation and expiration.

## Architecture

### Database Schema

- **PasswordResetToken Model**: Stores password reset tokens with expiry information
  - `id`: Unique identifier (CUID)
  - `email`: User email address
  - `token`: Hashed reset token (for security)
  - `expires`: Expiration timestamp (1 hour)
  - `createdAt`: Token creation time

### Components

#### 1. API Endpoints

**POST /api/auth/forgot-password**

- Accepts user email
- Generates secure reset token
- Sends email with reset link
- Returns success message (doesn't reveal if email exists - security best practice)
- Rate limiting recommended in production

**POST /api/auth/reset-password**

- Validates reset token
- Validates token expiry
- Validates email match
- Validates password strength (min 8 chars)
- Hashes password with bcryptjs
- Updates user password
- Cleans up all reset tokens for the user

### Frontend Pages

**1. Forgot Password Page (/auth/forgot-password)**

- Email input form
- Loading state with spinner
- Success message after sending
- Option to try another email or go back to signin
- Security information box
- Responsive design with gradient background

**2. Reset Password Page (/auth/reset-password)**

- URL parameters: `token` and `email`
- New password input with show/hide toggle
- Confirm password input with show/hide toggle
- Real-time password strength validation
- Visual indicators for:
  - Minimum 8 characters
  - At least one lowercase letter
  - At least one uppercase letter
  - At least one number
  - At least one special character (!@#$%^&\*)
- Success redirect to signin after 2 seconds
- Error handling for invalid/expired tokens
- Responsive design

### Email Template

- Professional HTML email design
- Password reset link with 1-hour expiry message
- Security tips and best practices
- Instructions for resetting password
- "Didn't request this?" section
- Branded footer with StudyAbroad Pro branding

### Security Features

1. **Token Hashing**: Tokens are hashed before storage using SHA256
2. **Token Expiry**: Tokens expire after 1 hour
3. **Email Validation**: Token is tied to specific email address
4. **Password Requirements**: Strong password validation (8+ chars, uppercase, lowercase, numbers, special chars)
5. **Token Cleanup**: Used tokens are immediately deleted
6. **Email Privacy**: System doesn't reveal if email exists (prevents user enumeration)
7. **HTTPS Only**: Links and submission should use HTTPS in production
8. **Rate Limiting**: Recommended for forgot-password endpoint (not implemented in this basic version)

## File Structure

```
src/
├── app/
│   └── auth/
│       ├── signin/
│       │   └── page.tsx (updated with forgot password link)
│       ├── forgot-password/
│       │   └── page.tsx (new)
│       └── reset-password/
│           └── page.tsx (new)
└── app/api/auth/
    ├── forgot-password/
    │   └── route.ts (new)
    └── reset-password/
        └── route.ts (new)

src/lib/
├── email.ts (updated with sendPasswordResetEmail function)
└── ...

prisma/
└── schema.prisma (updated with PasswordResetToken model)
└── migrations/
    └── 20260418072107_add_password_reset_token/
        └── migration.sql (new)
```

## Flow Diagram

```
User → Click "Forgot Password" on signin page
       ↓
       User enters email on forgot-password page
       ↓
       Submit POST /api/auth/forgot-password
       ↓
       API validates email exists
       ↓
       API generates reset token + hash
       ↓
       API saves token to database (expires in 1 hour)
       ↓
       API sends email with reset link
       ↓
       User receives email with reset link
       ↓
       User clicks link or copies URL
       ↓
       Navigate to /auth/reset-password?token=...&email=...
       ↓
       User enters new password
       ↓
       Submit POST /api/auth/reset-password
       ↓
       API validates token (exists, not expired, email matches)
       ↓
       API hashes new password
       ↓
       API updates user.password
       ↓
       API deletes used token
       ↓
       Show success page → Redirect to signin
       ↓
       User logs in with new password
```

## Testing the Feature

### Manual Testing Steps

1. **Go to Sign In Page**
   - Visit `http://localhost:3000/auth/signin`

2. **Click Forgot Password**
   - Click "Forgot password?" link below password field
   - Should navigate to `/auth/forgot-password`

3. **Request Reset**
   - Enter a registered user's email
   - Click "Send Reset Link"
   - Should show success message

4. **Check Email**
   - Open email client
   - Look for email with subject: "🔐 Reset Your StudyAbroad Pro Password"
   - Copy the reset link or click it

5. **Reset Password**
   - The link should take you to `/auth/reset-password?token=...&email=...`
   - Enter new password (must meet all requirements)
   - Confirm password
   - Click "Reset Password"

6. **Verify Success**
   - Should show success message
   - Should redirect to signin after 2 seconds
   - Login with new password to verify it works

### Testing Invalid Scenarios

1. **Non-existent Email**
   - Enter email that doesn't exist
   - Should show success message (security best practice)

2. **Expired Token**
   - Wait more than 1 hour and try to use the link
   - Should show "Password reset link has expired"

3. **Invalid Token**
   - Manually edit the token in URL
   - Should show "Invalid or expired password reset link"

4. **Weak Password**
   - Try passwords that don't meet requirements
   - Validation should fail with specific errors

5. **Non-matching Passwords**
   - Enter different passwords in confirm field
   - Should show error: "Passwords do not match"

## Environment Variables Required

```
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

## Best Practices Implemented

1. ✅ **Security-first design**: Tokens are hashed, not stored in plain text
2. ✅ **Token expiration**: 1-hour expiry reduces attack surface
3. ✅ **Email verification**: Ensures legitimate user requests
4. ✅ **Password strength enforcement**: Prevents weak passwords
5. ✅ **User privacy**: Doesn't reveal if email exists
6. ✅ **Clean UX**: Clear feedback and error messages
7. ✅ **Responsive design**: Works on mobile and desktop
8. ✅ **Email security tips**: Educates users on password best practices
9. ✅ **Token cleanup**: Deletes used tokens immediately
10. ✅ **Real-time validation**: Shows password strength requirements

## Possible Enhancements

1. **Rate Limiting**: Limit forgot-password requests per email/IP
2. **Logging**: Log password reset attempts for security audit
3. **OTP Alternative**: Add time-based OTP as alternative
4. **SMS Option**: Send reset link via SMS
5. **Account Recovery**: Add security questions as backup
6. **Activity Alerts**: Notify user when password is changed
7. **Device Tracking**: Show which devices are connected to account
8. **Password History**: Prevent reuse of recent passwords
9. **Two-Factor Authentication**: Require additional verification
10. **Email Templates**: Make templates configurable in database

## Troubleshooting

### Email not sending

- Check `GMAIL_USER` and `GMAIL_APP_PASSWORD` env vars
- Verify Gmail app password is correctly set (not regular password)
- Check spam/junk folder
- Review server logs for email errors

### Token validation failing

- Ensure `NEXT_PUBLIC_APP_URL` is correctly set
- Verify token hasn't expired (1 hour limit)
- Check that email parameter matches token email

### Password update not working

- Verify password meets all requirements
- Check database connection
- Review API error response for specific issue
- Ensure bcryptjs dependency is installed

### Redirect loop

- Clear browser cache/cookies
- Verify auth session configuration
- Check NextAuth credentials provider setup

## Related Files

- [Schema Migration](prisma/migrations/20260418072107_add_password_reset_token/)
- [Email Service](src/lib/email.ts)
- [Auth Configuration](src/lib/auth.ts)
- [Sign In Page](src/app/auth/signin/page.tsx)

## Security Considerations

🔐 **In Production:**

1. Enable HTTPS only
2. Add rate limiting (prevent brute force)
3. Add logging and monitoring
4. Consider adding CAPTCHA to forgot-password form
5. Implement security headers (HSTS, CSP, etc.)
6. Use environment-specific configurations
7. Add email verification for new password notifications
8. Implement automatic cleanup of expired tokens via cron job
9. Consider adding IP-based restrictions
10. Add analytics for suspicious activities

## Support & Questions

For issues or questions about the forgot password feature, refer to:

- [NextAuth Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Email Implementation Guide](src/lib/email.ts)
