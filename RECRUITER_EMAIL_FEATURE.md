# Recruiter Inactivity Badge & Email Reminder Feature

## Overview
Added visual indicators and email functionality to help admins identify and contact inactive recruiters directly from the Recruiter Statistics dashboard.

## Features Implemented

### 1. Inactive Recruiter Badge (😔)
- **Visual Indicator**: Sad emoji badge appears on recruiter avatar
- **Trigger**: Shows for recruiters who haven't logged in for 3+ days
- **Position**: Top-right corner of the avatar circle
- **Styling**: Yellow background with white border
- **Tooltip**: "Inactive for 3+ days" on hover

### 2. Email Icon Button
- **Location**: Next to recruiter name in the table
- **Icon**: Mail icon from lucide-react
- **Behavior**: Opens email modal on click
- **Styling**: Subtle gray icon that turns blue on hover
- **Availability**: Visible for all recruiters (not just inactive ones)

### 3. Email Modal
- **Pre-filled Fields**:
  - **To**: Recruiter's email (read-only)
  - **From**: admin@recruiterv.com (read-only)
  - **Subject**: "No Activity Found - Let's Connect" (editable)
  - **Body**: Professional template message (editable)

- **Default Email Template**:
  ```
  Dear [Recruiter Name],

  We hope this message finds you well.

  We noticed that you haven't been active on the RecruiterV platform recently. 
  We wanted to reach out and see if there's anything we can help you with.

  Your contributions are valuable to us, and we'd love to see you back on the platform. 
  If you're facing any challenges or have any questions, please don't hesitate to reach out.

  We're here to support you in your recruitment journey.

  Best regards,
  RecruiterV Team
  admin@recruiterv.com
  ```

- **Features**:
  - Editable subject and body before sending
  - Loading state while sending
  - Success message with auto-close (2 seconds)
  - Error handling with detailed messages
  - Cancel button to close without sending
  - Send Now button (disabled when loading or fields empty)

## Technical Implementation

### Backend Changes

#### File: `Backend/router/rout.js`
- **New Endpoint**: `POST /send-recruiter-email`
- **Purpose**: Send emails to recruiters using Brevo API
- **Parameters**:
  - `to`: Recipient email address
  - `subject`: Email subject line
  - `body`: Email message content
- **Validation**:
  - Checks for required fields
  - Validates email format
  - Returns appropriate error messages
- **Email Service**: Uses existing Brevo configuration
- **Response**: Success/error status with message

### Frontend Changes

#### File: `Frontend/src/pages/RecruiterStats.jsx`

**New Imports**:
- `Mail`, `X`, `Send`, `AlertCircle` from lucide-react

**New State**:
```javascript
const [emailModal, setEmailModal] = useState({
  isOpen: false,
  recruiter: null,
  subject: '',
  body: '',
  loading: false,
  error: null,
  success: false
});
```

**New Functions**:
1. `isInactive(lastActive)` - Checks if recruiter is inactive for 3+ days
2. `openEmailModal(recruiter)` - Opens modal with pre-filled data
3. `closeEmailModal()` - Closes modal and resets state
4. `sendEmail()` - Sends email via API and handles response

**UI Updates**:
1. **Avatar Section**:
   - Wrapped avatar in relative container
   - Added conditional sad emoji badge for inactive recruiters
   - Badge positioned absolutely at top-right

2. **Recruiter Name Section**:
   - Changed to flex layout
   - Added email icon button next to name
   - Button prevents row expansion on click

3. **Email Modal Component**:
   - Full-screen overlay with centered modal
   - Responsive design (max-width: 2xl)
   - Scrollable content for long messages
   - Form fields with proper styling
   - Success/error message displays
   - Loading states and disabled states

## User Flow

### Identifying Inactive Recruiters
1. Admin opens Recruiter Statistics page
2. Recruiters inactive for 3+ days show sad emoji badge (😔)
3. Badge appears on avatar in the table
4. Tooltip shows "Inactive for 3+ days" on hover

### Sending Email
1. Admin clicks mail icon next to recruiter name
2. Email modal opens with pre-filled information
3. Admin can edit subject and body if needed
4. Admin clicks "Send Now" button
5. Loading state shows "Sending..."
6. On success: Green success message appears, modal auto-closes after 2 seconds
7. On error: Red error message shows with details, modal stays open for retry

## API Endpoint Details

### POST /send-recruiter-email

**Request Body**:
```json
{
  "to": "recruiter@example.com",
  "subject": "No Activity Found - Let's Connect",
  "body": "Email message content..."
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

**Error Responses**:
- **400 Bad Request**: Missing required fields or invalid email
  ```json
  {
    "success": false,
    "message": "Missing required fields: to, subject, body"
  }
  ```

- **500 Server Error**: Email sending failed
  ```json
  {
    "success": false,
    "message": "Failed to send email",
    "error": "Error details..."
  }
  ```

## Deployment

### Files Modified:
1. `Backend/router/rout.js` - Added email endpoint
2. `Frontend/src/pages/RecruiterStats.jsx` - Added UI components and logic

### Deployment Command:
```bash
cd Frontend && npm run build && cd .. && npx firebase-tools deploy
```

### Deployment Includes:
- ✅ Backend Cloud Functions (email endpoint)
- ✅ Frontend Hosting (updated UI)

## Testing Checklist

### Visual Testing:
- [ ] Sad emoji badge appears for recruiters inactive 3+ days
- [ ] Badge positioned correctly on avatar
- [ ] Email icon visible next to all recruiter names
- [ ] Email icon hover effect works

### Functional Testing:
- [ ] Click email icon opens modal
- [ ] Modal shows correct recruiter email
- [ ] Subject and body are pre-filled
- [ ] Subject and body are editable
- [ ] Cancel button closes modal
- [ ] Send button disabled when fields empty
- [ ] Email sends successfully
- [ ] Success message appears
- [ ] Modal auto-closes after success
- [ ] Error handling works correctly
- [ ] Loading state displays during send

### Email Testing:
- [ ] Email received by recruiter
- [ ] Email from address is admin@recruiterv.com
- [ ] Email subject matches input
- [ ] Email body matches input (with line breaks)
- [ ] Email formatting is correct

## Benefits

1. **Quick Identification**: Admins can instantly see which recruiters are inactive
2. **Direct Communication**: Send personalized emails without leaving the dashboard
3. **Engagement**: Proactively reach out to inactive recruiters
4. **Efficiency**: No need to copy emails or switch to email client
5. **Customization**: Edit message before sending for personalization
6. **Professional**: Uses company email address (admin@recruiterv.com)

## Future Enhancements (Optional)

1. **Bulk Email**: Select multiple inactive recruiters and send batch emails
2. **Email Templates**: Save and reuse common email templates
3. **Email History**: Track which recruiters were contacted and when
4. **Automated Reminders**: Schedule automatic emails after X days of inactivity
5. **Email Analytics**: Track open rates and responses
6. **Different Badge Levels**: Different emojis for 3, 7, 14+ days inactive

## Notes

- The feature uses the existing Brevo email service already configured in the application
- Emails are sent from admin@recruiterv.com
- The inactive threshold is set to 3 days (can be adjusted in `isInactive()` function)
- Modal prevents accidental sends with disabled state when fields are empty
- Success state auto-closes modal after 2 seconds for better UX
