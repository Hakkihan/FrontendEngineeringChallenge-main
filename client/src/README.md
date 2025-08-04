# Frontend Architecture

This project follows a clean separation of concerns with the following structure:

## Directory Structure

```
src/
├── lib/                    # Pure API functions and types
│   ├── api.ts             # API functions (HTTP calls)
│   ├── types.ts           # TypeScript interfaces and types
│   └── index.ts           # Exports all lib functions and types
├── hooks/                  # React Query hooks
│   ├── usePatents.ts      # Patent-related hooks
│   ├── useDocuments.ts    # Document-related hooks
│   └── index.ts           # Exports all hooks
├── utils/                  # Utility helper functions
│   ├── helper.ts          # Helper utility functions
│   └── index.ts           # Exports all utility functions
├── components/             # UI components
├── internal/              # Internal components
└── App.tsx               # Main application component
```

## Architecture Principles

### 1. **Separation of Concerns**
- **`lib/api.ts`**: Pure API functions that make HTTP calls
- **`lib/types.ts`**: TypeScript interfaces and types
- **`hooks/useApi.ts`**: React Query hooks that use the API functions
- **`utils/helper.ts`**: Utility helper functions

### 2. **Clean Imports**
- Use `import { ... } from "./lib"` for API functions and types
- Use `import { ... } from "./hooks"` for React Query hooks

### 3. **Benefits**
- **Testability**: API functions can be tested independently
- **Reusability**: API functions can be used outside of React Query
- **Maintainability**: Clear separation makes code easier to understand
- **Type Safety**: Centralized types ensure consistency

## Usage Examples

```typescript
// Import API functions
import { fetchPatents, saveDocument } from "./lib";

// Import hooks
import { usePatents } from "./hooks";
import { useSaveDocument, useLatestDocumentByPatent } from "./hooks";

// Import utility functions
import { extractTitleAndBody, getChronologicalNumber } from "./utils";

// Import types
import type { PatentEntity, Document } from "./lib";
```

## File Responsibilities

### `lib/api.ts`
- Pure HTTP API functions
- No React dependencies
- Can be used in any JavaScript/TypeScript context

### `lib/types.ts`
- All TypeScript interfaces and types
- Shared across the application
- No business logic

### `hooks/usePatents.ts`
- Patent-related React Query hooks
- Uses API functions from `lib/api.ts`
- Handles caching, loading states for patent data

### `hooks/useDocuments.ts`
- Document-related React Query hooks
- Uses API functions from `lib/api.ts`
- Handles caching, loading states, and mutations for documents

### `utils/helper.ts`
- Utility helper functions
- Pure functions with no side effects
- Can be easily tested and reused 