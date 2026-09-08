# Jazz branch behavior

This document records how Inspektor selects Jazz branch contexts and which branch operations Jazz exposes.

## Table of contents

This table of contents links to the document sections.

- [Current decision](#current-decision)
- [What exists](#what-exists)
- [What's missing](#whats-missing)
- [Current flow](#current-flow)
- ["Creating a new branch" in Jazz means](#creating-a-new-branch-in-jazz-means)
- [Key insight](#key-insight)
- [What gets branched](#what-gets-branched)
- [What Jazz supports](#what-jazz-supports)

## Current decision

Inspektor uses remembered branch names and manual input without assuming a server branch-listing API.

- Branch source is **local remembered branches + manual input**
- We do **not** assume a server-backed branch listing API
- We should avoid UI copy that implies branch creation is a stronger primitive than opening a branch context

## What exists

The connection form accepts a branch name as plain text and saves it with the connection.

- Branch is just a text input field in the connection form (line 133-141 of `DbConfigForm.tsx`)
- You type the branch name when creating/editing a connection
- No dropdown, no picker, no "create branch" button

## What's missing

The current interface has no branch listing, creation workflow, rename, or deletion controls.

- List of existing branches for the app
- "Create new branch" workflow
- Branch management (rename, delete, etc.)

## Current flow

The current flow saves a typed branch name and asks Jazz to open that branch context.

1. User types "feature-x" in the branch field
2. Connection is saved with that branch name
3. When connecting, Jazz attempts to use that branch (creates it implicitly if it doesn't exist server-side)

So the branch navigation we discussed for the new UI would be a **new feature**, not something that exists today. The branch in the route structure implies we'd need to add:

- Fetching/listing available branches from the server
- Branch picker in the header
- Potentially a "create branch" workflow

Is this branch management something you want to add to the inspektor, or should branch remain a simple text field like today?

## "Creating a new branch" in Jazz means

A new Jazz branch name selects an empty isolated namespace rather than copying an existing branch.

- Creating a **new, empty namespace** - NOT copying data from another branch
- The composed branch name becomes: `{env}-{schema_hash}-{new_user_branch}`
- Example: `dev-a1b2c3d4-feature-x` starts completely empty

## Key insight

Jazz branches isolate data by namespace and do not behave like mergeable Git branches.

- Jazz branches are **hard-isolated namespaces**, not git-style branches
- Different user branches "are never merged" and "there is no way to combine data across environments or user branches"
- When you switch from `main` to `feature-x`, you see **no data** until you write new data

## What gets branched

A branch name selects an empty data container that uses the same schema.

- **Nothing** - it's just a new empty container
- Same schema (structure), but **zero rows** initially
- You're essentially partitioning your data by branch name

## What Jazz supports

Jazz supports `env` + `userBranch` in the client config, so you can connect to different branches. [[routing#Context ownership|Route context ownership]] keeps that branch choice in saved connection preferences.

### What is less clear in the public JS API

I do **not** see a documented/public JS admin API for:

- listing all user branches for an app
- explicitly creating a branch as a first-class operation

In practice, a branch is implicit: you use a new `userBranch` name and start writing to it.

So for your UI:

- **Switching to a known branch**: feasible
- **Typing a new branch name**: feasible
- **Server-backed “list all branches” picker**: not clearly available from the existing documented JS APIs
- **Explicit “create branch” action**: not really a Jazz primitive; more of a UI affordance around choosing a new branch name

So if you want a branch screen, the safe version is:

- show remembered branches per connection
- allow manual branch entry
- optionally infer branches from activity you’ve already seen
- avoid claiming “create branch” does something stronger than “open this branch context”
