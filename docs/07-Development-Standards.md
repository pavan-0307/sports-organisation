# SportNest - Development Standards & Engineering Guidelines

**Document Reference:** SN-DEV-V1.0  
**Version:** 1.0.0-Release  
**Author:** Lead Software Architect  
**Engineering Paradigm:** Monorepo Workspaces (TypeScript first)  

---

## 1. Monorepo Folder Structure

SportNest utilizes `pnpm` workspaces combined with `turbo` pipeline compilation.

```
sportnest/
├── .github/                  # GitHub actions workflows & deployment scripts
│   └── workflows/
├── apps/                     # Application interfaces (Deployable units)
│   ├── admin/                # Next.js Administrator Portal
│   ├── api/                  # Express/NodeJS Backend REST API Service
│   └── web/                  # Next.js Client Portal
├── packages/                 # Shared local modules (Shared libraries)
│   ├── config/               # Schema validation, shared environment keys
│   ├── types/                # Unified TypeScript contracts
│   ├── ui/                   # Shared UI component library
│   └── utils/                # General utility helper functions
├── docs/                     # Documentation specification sets (SRS, DB, API, etc.)
├── eslint.shared.mjs         # Centralized ESLint base configuration
├── package.json              # Monorepo dependencies & script pipelines
└── pnpm-workspace.yaml       # Workspace declarations
```

---

## 2. Naming Conventions

### 2.1 File & Directory Conventions
*   **Next.js Pages & Router Components:** Use lowercase kebab-case for folder routes (e.g., `src/app/equipment-rental/page.tsx`).
*   **React Components:** Use PascalCase for component files and directory definitions (e.g., `src/components/RentalCard.tsx`).
*   **General TypeScript Files:** Use camelCase or kebab-case (e.g., `src/utils/formatCurrency.ts`).

### 2.2 Coding Variables & Types
*   **Variables, Objects, & Functions:** camelCase (e.g., `const currentInventoryStatus = 'available';`).
*   **Constants:** UPPER_CASE (e.g., `const BASE_LATE_FEE_MULTIPLIER = 1.5;`).
*   **TypeScript Interfaces & Types:** PascalCase prefixed with `I` for interfaces if required, or direct nouns (e.g., `type InventoryStatus = 'available' | 'rented';`).

---

## 3. Git Branching & Workflow Strategy

SportNest utilizes a git-flow-like branching structure to coordinate code reviews.

```
  main      ───────────────────────────────────[ Release Tag ]
             ▲
             │ (Merge PR with Squash)
  develop   ─┼───────────────────[ Merge PR ]
             │                    ▲
             │                    │ (Code Review)
  feature/  ─┴──[ Create Branch ]─┴───────────────────────────
```

*   **Core Branches:**
    *   `main`: Holds production-ready code. Commits here trigger production deploys.
    *   `develop`: Integration branch. Commits here deploy to the staging environment.
*   **Feature Branches:** Created from `develop` and named according to type:
    *   `feature/sn-<ticket_id>-<feature_desc>`
    *   `bugfix/sn-<ticket_id>-<bug_desc>`
    *   `hotfix/sn-<ticket_id>-<hotfix_desc>` (branched from `main` to address production issues)

---

## 4. Commit Message Guidelines

All commit messages must follow the **Conventional Commits** specification:
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### 4.1 Allowed Types
*   `feat`: A new feature (e.g. `feat(rental): add date collision validation check`).
*   `fix`: A bug fix (e.g. `fix(api): resolve memory leak in token parser`).
*   `docs`: Documentation changes only (e.g. `docs(srs): update database design index rules`).
*   `style`: Code formatting changes (e.g. trailing whitespace, lint adjustments).
*   `refactor`: Code restructuring without changing functional behavior.
*   `test`: Adding or updating test cases.

---

## 5. Coding & Formatting Rules

### 5.1 Prettier & Lint Configuration
Formatting rules are enforced via Prettier and ESLint Flat Config.
*   **Tab Width:** 2 spaces. No tab characters.
*   **Quotes:** Single quotes in JS/TS files (`'string'`), double quotes in HTML/JSX attributes (`className="flex"`).
*   **Semi-colons:** Always required.

### 5.2 TypeScript Rules (Strict)
*   **No Implicit Any:** Always configure `"noImplicitAny": true` inside `tsconfig.json`. Casting variables to `any` is prohibited. Use `unknown` if the type is dynamic.
*   **Null Checks:** Use explicit optional chaining (`?.`) or type guards to prevent null reference errors.

### 5.3 React Coding Guidelines
*   **Function Components:** Use standard function declarations. Arrow functions are permitted for small helper components.
*   **Hooks Dependency Arrays:** React Hooks dependency arrays must contain all variables referenced within the hook. ESLint's `react-hooks/exhaustive-deps` rule is configured as an error.

### 5.4 REST API Coding Rules
*   **Consistent Response Formats:** Every route controller must wrap responses inside the standard data envelope defined in the API Specification.
*   **Input Sanitization:** Controllers must validate request payloads using schema validation (e.g. Zod) before database operations.
*   **Status Codes:** Use correct semantic HTTP status codes (`201 Created` for creations, `409 Conflict` for duplicate resource issues).

---

## 6. Database Migration Process

*   **Migration CLI:** Database changes must be handled through schema migration tools (like Prisma Migrations or Knex/Liquibase). Direct database schema mutations are prohibited in staging and production.
*   **Backward Compatibility:** Database migrations must be backward compatible. If a column is being renamed:
    1.  Add the new column.
    2.  Write code to support writing to both the old and new columns.
    3.  Migrate existing data.
    4.  Remove the old column in a subsequent release.
*   **Review Rule:** SQL migration scripts must be inspected during pull reviews to ensure they do not perform full-table locks on large production databases.

---

## 7. Pull Request Checklist

Developers must check the following items before submitting code for review:
*   [ ] ESLint runs locally without syntax warnings or errors.
*   [ ] Local compile completes successfully via `pnpm build`.
*   [ ] Unit tests run and pass successfully via `pnpm test`.
*   [ ] Branch contains no merge conflicts with the target integration branch.
*   [ ] No environment secrets or database passwords are hardcoded in the codebase.
*   [ ] New code includes adequate unit test coverage for core business rules.
*   [ ] PR template has been filled out completely with task reference IDs.
