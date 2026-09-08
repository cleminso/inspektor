# Design-system browser baseline

This document defines the shared browser normalization boundary for applications that consume `@inspektor/ds`.

## Table of contents

The sections cover the problem, the chosen baseline, its ownership boundary, and its result.

- [Problem](#problem)
- [Decision](#decision)
- [Boundary](#boundary)
- [Result](#result)

## Problem

Removing Tailwind Preflight exposed inconsistent browser defaults. StyleX generates authored component styles, while Base UI supplies behavior; neither normalizes the document.

## Decision

`@inspektor/ds/baseline.css` provides one optional baseline that each controlled application imports once instead of redefining it. This follows the loading model in [[lat.md/stylexBestPractices#Meta StyleX practices#Loading flow]].

## Boundary

The baseline only normalizes browser-owned presentation. Components still define every native element they own, and application CSS still owns theme activation and application mechanics.

## Result

Consumer applications share predictable native defaults without Tailwind, duplicated reset rules, or hidden component dependencies.
