# Divvy Email Templates

Beautiful, branded email templates for Divvy authentication emails.

## Templates

1. **confirm-signup.html** - Email confirmation for new signups
2. (Add more templates as needed)

## How to Add to Supabase

### Step 1: Go to Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**

### Step 2: Update Confirm Signup Template

1. Click on **"Confirm signup"** template
2. **Copy the entire contents** of `confirm-signup.html`
3. **Paste it** into the template editor (replacing the default template)
4. Click **"Save"**

### Step 3: Test the Template

1. Create a new test account
2. Check your email inbox
3. Verify the branded Divvy email appears correctly
4. Click the confirmation button to ensure it works

## Template Features

✅ **Branded** - Orange gradient header with Divvy logo
✅ **Responsive** - Works on all devices and email clients
✅ **Clear CTA** - Big orange "Confirm Email Address" button
✅ **Informative** - Lists benefits of using Divvy
✅ **Professional** - Clean design matching your app aesthetic

## Email Template Variables

Supabase provides these variables you can use in templates:

- `{{ .ConfirmationURL }}` - Link to confirm email
- `{{ .Token }}` - Confirmation token
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email address

## Customization

To customize the template:

1. Edit the HTML file
2. Update colors, text, or styling as needed
3. Copy the updated HTML to Supabase
4. Test with a new signup

## Preview

The email includes:
- Orange gradient header with "Divvy" title
- Welcome message
- "Confirm Email Address" button (orange, rounded)
- List of features users get after confirming
- Footer with copyright

---

**Note**: Make sure "Confirm email" is **enabled** in Supabase Authentication settings!
