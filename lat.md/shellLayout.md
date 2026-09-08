# Shell layout ownership

This document separates reusable shell geometry from Inspektor application behavior.

## Table of contents

This table of contents links to the document sections.

- [Design-system ownership](#design-system-ownership)
- [Application ownership](#application-ownership)

## Design-system ownership

`ShellLayout` should own:

- Full-height header/body/footer geometry
- Horizontal resizable panel group
- Optional resizable `LeftDock`
- Required flexible `View`
- Optional resizable `RightDock`
- Correct handle placement
- Collapse and resize mechanics
- Surface, overflow, gutter, and radius treatment
- Layout context needed by dock controls

It should support these body shapes:

- `View`
- `LeftDock` + `View`
- `View` + `RightDock`
- `LeftDock` + `View` + `RightDock`

Absent docks should produce neither a panel nor a resize handle.

## Application ownership

`apps/web` should own:

- The universal local-storage adapter
- Storage migration
- Dock feature selection
- Hotkeys
- Router navigation
- Product content
- Page landmarks and titles

The storage schema can adopt semantic identifiers:

- `leftDock`
- `view`
- `rightDock`
