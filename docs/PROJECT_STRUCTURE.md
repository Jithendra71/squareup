# Project Structure

## Directory Layout

```
src/
├── components/          # Reusable components
│   ├── common/         # Generic UI components (Loading, etc.)
│   ├── expenses/       # Expense-related components
│   ├── groups/         # Group-related components
│   └── settlements/    # Settlement-related components
├── screens/            # Screen components
│   ├── auth/          # Authentication screens (Login, Signup, etc.)
│   ├── dashboard/     # Dashboard screen
│   ├── groups/        # Group management screens
│   ├── expenses/      # Expense management screens
│   ├── profile/       # User profile screens
│   └── settlements/   # Settlement screens
├── navigation/         # Navigation configuration
├── store/             # Zustand stores (state management)
├── services/          # External services
│   └── firebase/      # Firebase operations (auth, firestore, storage)
├── utils/             # Helper functions and utilities
├── constants/         # App constants (colors, categories, etc.)
├── types/             # TypeScript type definitions
├── hooks/             # Custom React hooks
└── config/            # App configuration (firebase, environment)
```

## File Organization Guidelines

### Components
- Place reusable UI components in `src/components/`
- Organize by feature in subdirectories (`common/`, `expenses/`, `groups/`, etc.)
- Each component should have its own file with PascalCase naming (e.g., `Loading.tsx`)

### Screens
- Full-page screen components go in `src/screens/`
- Organize by feature area
- Use descriptive names ending with "Screen" (e.g., `LoginScreen.tsx`)

### Services
- External API calls and Firebase operations go in `src/services/`
- Each service should export functions related to a specific domain
- Example: `src/services/firebase/auth.ts` handles all auth-related Firebase operations

### State Management
- Zustand stores go in `src/store/`
- Each store should manage a specific domain (e.g., `authStore.ts`, `groupsStore.ts`)
- Keep stores focused and single-purpose

### Types
- All TypeScript interfaces and types go in `src/types/`
- Centralize shared types in `index.ts`
- Use clear, descriptive names for interfaces

### Constants
- App-wide constants (colors, categories, etc.) in `src/constants/`
- Export as named exports for easy importing

### Utils
- Helper functions and utilities in `src/utils/`
- Keep functions pure and well-tested
- Examples: `errorHandler.ts`, `balanceCalculator.ts`

## Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
- **Components**: PascalCase (e.g., `Loading`, `BalanceCard`)
- **Functions**: camelCase (e.g., `calculateBalance`, `handleError`)
- **Constants**: UPPER_SNAKE_CASE for true constants (e.g., `COLORS`)
- **Interfaces**: PascalCase with descriptive names (e.g., `User`, `Expense`)

## Import Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
import { Loading } from '@components/common/Loading';
import { DashboardScreen } from '@screens/dashboard/DashboardScreen';
import { authService } from '@services/firebase/auth';
import { COLORS } from '@constants/index';
import { User } from '@types/index';
```

Available aliases:
- `@components/*` → `src/components/*`
- `@screens/*` → `src/screens/*`
- `@services/*` → `src/services/*`
- `@utils/*` → `src/utils/*`
- `@constants/*` → `src/constants/*`
- `@types/*` → `src/types/*`
- `@hooks/*` → `src/hooks/*`
- `@store/*` → `src/store/*`
- `@navigation/*` → `src/navigation/*`
- `@config/*` → `src/config/*`

## Best Practices

1. **Single Responsibility**: Each file should have one clear purpose
2. **DRY (Don't Repeat Yourself)**: Extract reusable logic into utilities or hooks
3. **Type Safety**: Use TypeScript interfaces for all data structures
4. **Consistent Styling**: Follow the Prettier configuration
5. **Clear Naming**: Use descriptive names that explain the purpose
6. **Component Composition**: Build complex UIs from smaller, reusable components
7. **Error Handling**: Always handle errors gracefully with user-friendly messages

## Future Additions

As the project grows, consider adding:
- `src/contexts/` for React Context providers
- `src/hoc/` for Higher-Order Components
- `src/api/` if adding additional API integrations
- `src/assets/` for images, fonts, and other static assets
