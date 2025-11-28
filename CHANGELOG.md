# Changelog

All notable changes to the Prayerloop mobile app will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project uses a date-based versioning scheme: `[year].[month].[sequence]`
(e.g., 2025.11.3 is the third release in November 2025).

## [2025.11.5] - 2025-11-28

### Fixed

- Fixed token handling on app startup
- Fixed logout user on 401 response from backend
- Fixed OTA updates configuration

## [2025.11.4] - 2025-11-26

### Added

- Email login (instead of username)
- Join group deep link
- Fixed reminders
- Implemented redux-persist and fixed login screen flashing on each launch
- Comprehensive test coverage for Redux slices (90 tests)
- ESLint configuration with auto-fix capabilities
- GitHub Actions workflow for automated testing and linting on PRs

## [2025.11.3] - 2025-11-19

### Added

- **Delete Account Feature** - Users can now permanently delete their account
  - Two-step confirmation with password verification
  - Warning about data loss
  - Proper cleanup and logout after deletion
  - Resolves App Store rejection from 0.0.2
- **Prayer Reordering** - Drag-to-reorder functionality for prayers
  - Works for both personal prayers and group prayers
  - Uses `react-native-draggable-flatlist`
  - Optimistic updates with Redux integration
  - Persists order to backend via `PATCH /users/:id/prayers/reorder`
- **Group Reordering** - Drag-to-reorder functionality for groups
  - Persists order to backend via `PATCH /users/:id/groups/reorder`
- **Search & Filter** - Comprehensive search and filtering
  - Search bar on Cards and Groups tabs
  - Debounced search input (300ms)
  - Filter by date range (all, today, week, month, year)
  - Filter by answered status
  - Filter by creator (for group prayers)
  - Redux integration for filter state management

### Changed
- **Versioning Convention** - Switched from semantic versioning to date-based versioning
  - Format: `[year].[month].[sequence]`
  - Example: 2025.11.3 is the third release in November 2025

### Fixed
- Prayer card scrolling for long prayer text
- Duplicate prayer creation bug (improved loading states)

## [0.0.2] - 2025-10-25

### Fixed
- **Production API Configuration** - Corrected API endpoint for production builds
  - Fixed baseURL in axios configuration
  - Resolves App Store rejection from 0.0.1

### Known Issues
- App Store submission rejected: Missing account deletion feature (required by App Store guidelines)

## [0.0.1] - 2025-10-20

### Added
- **Initial MVP Release**
- User authentication (login/signup)
- Password reset flow with email verification
- Personal prayer management (create, read, update, delete)
- Group prayer functionality
  - Create groups
  - Invite users via email
  - Share prayers with groups
  - Group member management
- Prayer session tracking
- Push notifications (iOS via Firebase)
  - Token registration
  - Notification preferences
- User profile management
- Prayer reminders
- Email notifications
  - Welcome email on signup
  - Group invitations
  - Group management notifications (leave, delete, remove)

### Known Issues
- App Store submission rejected: Incorrect production API configuration

## Version History

- **2025.11.3** - Current release with delete account, reordering, and search/filter
- **0.0.2** - Fixed production API config (App Store rejected - missing delete account)
- **0.0.1** - Initial MVP (App Store rejected - wrong API config)

---

## Migration Notes

### Upgrading to 2025.11.3 from 0.0.2
- No breaking changes
- New features are additive
- Backend must be updated to support reordering endpoints
