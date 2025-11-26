// Simple setup for testing Redux slices (pure functions)

// Mock expo-constants since it's imported by shared.types.ts
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        apiUrl: 'http://localhost:3000',
      },
    },
  },
}));
