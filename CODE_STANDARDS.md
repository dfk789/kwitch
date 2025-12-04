# CODE_STANDARDS.md — Kwitch Extension

## TypeScript

- **Strict mode** enabled
- **Explicit types** for function parameters and return values
- **No `any`** unless absolutely necessary (with comment explaining why)
- Use **interfaces** for object shapes, **types** for unions/aliases

## Naming

- **Files**: `kebab-case.ts`
- **Classes**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

## Code Style

- 2 space indentation
- Single quotes for strings
- Semicolons required
- Max line length: 100 characters
- ESLint + Prettier enforced

## Extension-Specific

### Content Scripts

- Prefix all injected CSS classes with `kwitch-`
- Use Shadow DOM where possible to isolate styles
- Clean up on navigation/unload

### Background Service Worker

- Keep lightweight, no heavy processing
- Use alarms for periodic tasks (not setInterval)
- Handle offline/error states gracefully

### Storage

- Use `chrome.storage.local` for channel list
- Use `chrome.storage.sync` for preferences (syncs across devices)
- Always validate data from storage

## Error Handling

- Log errors with context: `console.error('[Kwitch]', error)`
- Never silently swallow errors
- Provide user feedback for failures (e.g., badge text, notifications)

## Testing

- Unit tests for utility functions
- Manual testing checklist for UI features
- Document test cases in PR descriptions
