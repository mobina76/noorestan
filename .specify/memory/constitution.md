<!--
Sync Impact Report
- Version change: unratified scaffold -> 1.0.0
- Modified principles:
  - Placeholder Principle 1 -> I. Strict, Explicit TypeScript
  - Placeholder Principle 2 -> II. Modern Angular and Deliberate Reactivity
  - Placeholder Principle 3 -> III. Feature-Based Simplicity
  - Placeholder Principle 4 -> IV. RTL, Responsive, and Accessible by Default
  - Placeholder Principle 5 -> V. Secure and Testable Delivery
- Added sections:
  - Technology and Design Constraints
  - Development Workflow and Quality Gates
- Removed sections: none
- Follow-up TODOs: none
-->
# Noorestan Website Constitution

## Core Principles

### I. Strict, Explicit TypeScript
All application code MUST compile with Angular and TypeScript strict modes enabled. Public APIs,
component inputs and outputs, service boundaries, and domain models MUST use explicit, meaningful
types. The `any` type is prohibited; uncertain external data MUST enter as `unknown` and be narrowed
or validated before use. Type assertions and non-null assertions MUST be rare and justified in code.
These rules make invalid states visible during development instead of at runtime.

### II. Modern Angular and Deliberate Reactivity
The application MUST use Angular 22 and current standalone Angular patterns. Components MUST use
Signals for local, synchronous state and derived values. RxJS MUST be used for asynchronous streams,
event orchestration, cancellation, and multi-source workflows. Subscriptions MUST be composed with
operators and consumed through framework-supported lifecycle mechanisms; nested subscriptions are
prohibited. Deprecated APIs, NgModule-first design, manual DOM manipulation, and legacy structural
patterns MUST NOT be introduced when a supported modern Angular alternative exists. Each reactive
primitive MUST match the timing and lifecycle semantics of the work it represents.

### III. Feature-Based Simplicity
Code MUST be organized by user-facing feature, with shared code limited to genuinely reusable UI,
utilities, and infrastructure. Feature boundaries MUST be clear, dependencies MUST point toward
stable contracts, and cross-feature coupling MUST be avoided. New abstractions, state layers,
libraries, and dependencies MUST solve a demonstrated need and be simpler than an in-project
solution. Speculative generalization, premature design systems, and unnecessary architectural
layers are prohibited. The smallest design that remains readable, maintainable, and testable is the
default.

### IV. RTL, Responsive, and Accessible by Default
Persian is the primary interface language and every screen MUST work correctly with right-to-left
direction, Persian content, and locale-appropriate presentation. Tailwind CSS responsive utilities
and logical layout behavior MUST produce usable experiences from small mobile screens through large
desktops. Interfaces MUST use semantic HTML, keyboard-operable interactions, visible focus states,
sufficient color contrast, meaningful labels, and appropriate accessible names. Accessibility and
RTL behavior are acceptance criteria, not post-release enhancements.

### V. Secure and Testable Delivery
Untrusted input MUST be validated at trust boundaries, output MUST rely on Angular's safe binding
and sanitization model, and secrets MUST never be committed or exposed to client code. Security
controls MUST follow least privilege; bypassing sanitization requires documented justification and
targeted review. Business logic and state transitions MUST be independently testable. Changes MUST
include proportionate automated tests for critical behavior, regressions, reactive workflows, and
accessible user interactions. Tests MUST verify observable behavior rather than private
implementation details.

## Technology and Design Constraints

- Angular 22, strict TypeScript, and Tailwind CSS are the required application foundation.
- Standalone components, functional providers and guards, built-in control flow, Signals, and
  dependency injection with `inject` MUST be preferred for new code.
- Signals MUST own synchronous UI state; RxJS MUST own asynchronous or cancellable workflows.
  Interoperability between them MUST be explicit and lifecycle-safe.
- Components MUST remain focused on presentation and interaction orchestration. Domain rules and
  reusable data access MUST live behind typed feature-level services or functions.
- Tailwind utility composition MUST remain readable. Repeated visual patterns MAY become focused
  components or documented style abstractions only after actual reuse is established.
- Dependencies MUST be evaluated for necessity, maintenance, security, bundle impact, and overlap
  with Angular, browser, or existing project capabilities before adoption.

## Development Workflow and Quality Gates

- Every change MUST pass formatting, linting, strict compilation, and the relevant automated test
  suite before merge.
- Reviews MUST verify principle compliance, with explicit attention to type safety, reactive
  ownership, subscription lifecycle, feature boundaries, responsive RTL behavior, accessibility,
  security, and test coverage.
- User-visible work MUST be checked at representative mobile and desktop widths in RTL mode and MUST
  be operable with a keyboard.
- Async error, loading, empty, cancellation, and retry behavior MUST be designed where applicable
  and covered according to risk.
- Exceptions to this constitution MUST be documented in the change, include a concrete rationale
  and removal or review plan, and receive explicit reviewer approval.
- Refactoring MUST preserve observable behavior unless a specification explicitly changes it.

## Governance

This constitution is the highest-priority engineering policy for the project. Specifications,
plans, tasks, implementation, and reviews MUST comply with it. Amendments MUST be proposed as a
documented change that states the motivation, affected principles, compatibility impact, and any
required migration work; approval requires project maintainer review.

Constitution versions follow semantic versioning. A MAJOR version removes or incompatibly redefines
a governance commitment, a MINOR version adds a principle or materially expands mandatory guidance,
and a PATCH version clarifies wording without changing obligations. Each amendment MUST update the
Sync Impact Report, version, and last-amended date. Compliance MUST be reviewed during planning and
again before merge; unjustified complexity or violations block acceptance.

**Version**: 1.0.0 | **Ratified**: 2026-09-05 | **Last Amended**: 2026-09-05
