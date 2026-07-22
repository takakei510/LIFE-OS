# Adventure Logs v0.4.2

## Scope

Text-only Adventure Log creation using Memo and Location.

## Rules

- Achievement/Quest state changes remain separate from log creation.
- Empty logs are rejected.
- Lifecycle is always Active.
- Visibility is always Private.
- Favorite is always false.
- Log Type is derived on the server.
- requestId is required for duplicate-submit protection.
- Media upload is out of scope.

## Initial implementation

- Server-side validation
- Notion repository for page creation
- Application service
- Server Action
- `/adventure-logs/new` form
- Memo and Location only
- No XP reward
