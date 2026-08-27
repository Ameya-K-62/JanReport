# Frontend-Backend Integration Guide

This document explains how the frontend is integrated with the backend API.

## Setup

1. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create .env file with MongoDB URI and JWT_SECRET
   npm run dev
   ```

2. **Frontend Setup:**
   ```bash
   cd "JanReport V2"
   npm install
   # Create .env file (optional, defaults to http://localhost:5000/api)
   npm run dev
   ```

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/janreport
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

## API Integration

### Authentication Flow

1. **Signup/Login:**
   - User submits credentials in `LoginDialog`
   - API call made via `authAPI.signup()` or `authAPI.login()`
   - JWT token stored in `localStorage` as `authorization`
   - User type stored in `localStorage` as `userType`

2. **Token Management:**
   - Token automatically included in API requests via `Authorization: Bearer <token>` header
   - Token checked on app load to restore user session
   - Token cleared on logout

### Report Submission Flow

1. **Submit Report:**
   - User fills form in `SubmitReportDialog`
   - Image converted to base64 (if provided)
   - API call via `reportsAPI.submitReport()`
   - Report created with status "pending"
   - Success toast shown, form reset

2. **View Reports:**
   - Reports fetched on app load via `reportsAPI.getReports()`
   - Only approved reports shown to regular users
   - Pagination supported (page, limit params)
   - Category filtering available

3. **Moderation Dashboard:**
   - Moderators can view pending reports via `reportsAPI.getPendingReports()`
   - Reports displayed with AI analysis data
   - Approve/Reject actions (to be implemented in backend)

## API Service Structure

Located in `src/services/api.ts`:

- **authAPI**: Authentication methods (signup, login, logout, getCurrentUser)
- **reportsAPI**: Report methods (submitReport, getReports, getPendingReports, getReportById)
- **formatTimestamp**: Utility to format dates as relative time

## Data Flow

```
User Action → Component → API Service → Backend API → Database
                ↓
         Update UI State
```

## Key Components Updated

1. **App.tsx**: 
   - Fetches reports on mount
   - Manages authentication state
   - Handles login/logout

2. **LoginDialog.tsx**: 
   - Integrated with authAPI
   - Handles signup and login
   - Stores tokens

3. **SubmitReportDialog.tsx**: 
   - Submits reports via API
   - Handles image upload (base64)

4. **ModerationDashboard.tsx**: 
   - Fetches pending reports
   - Displays moderation interface

5. **Header.tsx**: 
   - Shows login/logout based on auth state

## Error Handling

- API errors caught and displayed via toast notifications
- Loading states shown during API calls
- Retry buttons for failed requests

## Next Steps

1. Implement approve/reject endpoints in backend
2. Add real-time updates (WebSockets)
3. Implement image upload to cloud storage
4. Add pagination UI components
5. Implement report editing functionality
