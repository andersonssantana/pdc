# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pink Diamond Collective (PDC) - A CRM application built with Meteor.js and React 18 for managing customers and notes.

## Commands

```bash
npm start              # Run development server (meteor run) - http://localhost:3000
npm test               # Run tests once with Mocha
npm run test-app       # Run full-app tests with watch mode
npm run visualize      # Build with bundle visualizer
```

## Architecture

### Directory Structure
- `/client/` - Client entry point (React 18 root in main.jsx)
- `/server/` - Server entry point with publications, methods, and data seeding
- `/imports/api/` - MongoDB collections and business logic
- `/imports/ui/` - React components and styles
- `/tests/` - Mocha test suite

### Data Layer (Meteor Patterns)
- **Collections** (`/imports/api/`): `CustomersCollection`, `NotesCollection`
- **Publications** (`/server/main.js`): Must be registered at module load time (outside `Meteor.startup`)
- **Methods** (`/server/main.js`): RPC calls for mutations - always validate `this.userId` and permissions
- **Async operations**: Use `insertAsync`, `updateAsync`, `findOneAsync` etc. (sync versions deprecated)

### Client Data Access
```javascript
// Subscribe to data
const isLoading = useSubscribe("customers");
const customers = useFind(() => CustomersCollection.find());

// Call server methods
Meteor.call("customers.insert", data, (error, result) => {...});
```

### Authentication
- Built-in Meteor accounts-password system
- User roles stored in `profile.role`: `ROLES.ADMIN` or `ROLES.USER`
- Default admin account: `admin` / `admin123` (seeded on startup)
- Role helpers in `/imports/api/users.js`: `isAdmin(user)`

### UI Patterns
- View-based navigation via state in App.jsx (not React Router)
- Modal-based forms with overlay pattern
- `useTracker()` for reactive Meteor data subscriptions

## Key Entities
- **Customer**: name (required), phone, description, notes
- **Note**: content (required), customerId, createdByName
- **User**: username, profile.name, profile.role
