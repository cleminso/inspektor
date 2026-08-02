# Design-system browser baseline

## Table of contents

- [Problem](#problem)
- [Decision](#decision)
- [Boundary](#boundary)
- [Result](#result)

## Problem

Removing Tailwind Preflight exposed inconsistent browser defaults. StyleX generates authored component styles, while Base UI supplies behavior; neither normalizes the document.

## Decision

`@inspector/ds/baseline.css` provides one optional baseline that each controlled application imports once instead of redefining it.

## Boundary

The baseline only normalizes browser-owned presentation. Components still define every native element they own, and application CSS still owns theme activation and application mechanics.

## Result

Consumer applications share predictable native defaults without Tailwind, duplicated reset rules, or hidden component dependencies.
