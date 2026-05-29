# Requirements Document

## Introduction

Wire the existing React + TypeScript frontend pages to the live backend REST APIs for authentication (register, forgot-password, reset-password) and the customer home page (replace mock data with real menu items). All backend endpoints are already implemented; this feature closes the gap between the scaffolded UI and the real API layer.

## Glossary

- **Frontend**: The React + TypeScript + Vite application served to end users.
- **AuthService**: The frontend service module (`authService.ts`) that wraps all `/auth/*` API calls.
- **MenuService**: The frontend service module (`menuService.ts`) that wraps all `/menu/*` API calls.
- **AuthContext**: The React context that holds the authenticated user state and exposes `login`/`logout`.
- **Register_Page**: `frontend/src/pages/auth/Register.tsx`
- **ForgotPassword_Page**: `frontend/src/pages/auth/ForgotPassword.tsx`
- **ResetPassword_Page**: `frontend/src/pages/auth/ResetPassword.tsx`
- **Home_Page**: `frontend/src/pages/customer/Home.tsx`
- **Reset_Token**: The JWT/UUID token delivered to the user via email and appended as a URL query parameter (`?token=...`) on the reset-password page.

---

## Requirements

### Requirement 1: Register Page API Integration

**User Story:** As a new customer, I want to create an account using my name, email, phone, and password, so that I can place orders and track them.

#### Acceptance Criteria

1. WHEN the user submits the registration form with valid name, email, phone, and password, THE Register_Page SHALL call `AuthService.register` with those values.
2. WHEN the registration API call succeeds, THE Register_Page SHALL save the session via `AuthService.saveSession` and redirect the user to the home page (`/`).
3. IF the registration API call returns an error, THEN THE Register_Page SHALL display the error message returned by the API.
4. WHILE the registration API call is in-flight, THE Register_Page SHALL disable the submit button and show a loading indicator.
5. THE Register_Page SHALL include a phone number input field to satisfy the backend `{ name, email, phone, password }` payload requirement.

### Requirement 2: Forgot Password Page API Integration

**User Story:** As a registered customer who has forgotten their password, I want to request a password-reset email, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN the user submits the forgot-password form with a valid email, THE ForgotPassword_Page SHALL call `AuthService.forgotPassword` with that email.
2. WHEN the API call succeeds, THE ForgotPassword_Page SHALL display the existing success confirmation UI (email sent message).
3. IF the API call returns an error, THEN THE ForgotPassword_Page SHALL display the error message to the user.
4. WHILE the API call is in-flight, THE ForgotPassword_Page SHALL disable the submit button and show a loading indicator.

### Requirement 3: Reset Password Page API Integration

**User Story:** As a customer who received a password-reset email, I want to set a new password using the link in that email, so that I can log in again.

#### Acceptance Criteria

1. WHEN the ResetPassword_Page mounts, THE ResetPassword_Page SHALL read the `token` query parameter from the current URL.
2. IF no `token` query parameter is present, THEN THE ResetPassword_Page SHALL display an error message indicating the link is invalid or expired.
3. WHEN the user submits the form with matching new password and confirm password, THE ResetPassword_Page SHALL call `AuthService.resetPassword` with the token and new password.
4. WHEN the API call succeeds, THE ResetPassword_Page SHALL display the existing success confirmation UI.
5. IF the API call returns an error, THEN THE ResetPassword_Page SHALL display the error message to the user.
6. WHILE the API call is in-flight, THE ResetPassword_Page SHALL disable the submit button and show a loading indicator.

### Requirement 4: Home Page Real Menu Data

**User Story:** As a customer visiting the home page, I want to see real popular menu items fetched from the backend, so that the displayed items reflect the actual menu.

#### Acceptance Criteria

1. WHEN the Home_Page mounts, THE Home_Page SHALL call `MenuService.getItems` to fetch menu items from the backend.
2. THE Home_Page SHALL display the first 3 available items returned by the API in the "Popular Dishes" section.
3. WHILE the API call is in-flight, THE Home_Page SHALL display skeleton loading cards in place of the item cards.
4. IF the API call returns an error, THEN THE Home_Page SHALL display a user-friendly error message.
5. THE Home_Page SHALL display each item's real name, price, description, image (or a fallback emoji), and veg/non-veg badge from the API response.
