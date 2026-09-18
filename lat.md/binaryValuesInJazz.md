# Binary values in Jazz

Jazz stores small binary values as `Bytea` and larger files as chunked records. Inspektor presents bytes without treating them as editable text.

## Table of contents

This page covers Jazz storage choices and Inspektor's binary-value policy.

- [Overview](#overview)
- [References](#references)
- [How Jazz handles binary values](#how-jazz-handles-binary-values)
  - [Small binary values](#small-binary-values)
  - [Files and larger blobs](#files-and-larger-blobs)
- [How Inspektor handles binary values](#how-inspektor-handles-binary-values)

## Overview

Choose direct `Bytea` storage for small values that load with a row. Use Jazz's chunked file records for larger blobs.

## References

Jazz documents the chunked file APIs and their storage model.

[Jazz Files & Blobs](https://jazz.tools/docs/writing/files-and-blobs)

## How Jazz handles binary values

Jazz supports direct byte columns and chunked file storage.

### Small binary values

Small binary values use one schema and runtime representation across the stack.

The schema uses:

- DSL: `s.bytes()`
- SQL storage: `BYTEA`
- Jazz descriptor: `Bytea`
- JavaScript value: `Uint8Array`

This representation is recommended when the binary value is small and should load with its containing row.

### Files and larger blobs

Jazz splits larger files into ordered chunks that its file APIs reconstruct.

Chunked file storage uses these records and methods:

- `file_parts.data` stores chunks using `s.bytes()`.
- `files.partIds` stores the ordered chunk IDs.
- `files.partSizes` stores their sizes.
- `db.createFileFromBlob()` and `db.createFileFromStream()` create those records.
- `db.loadFileAsBlob()` and `db.loadFileAsStream()` reconstruct the file.

## How Inspektor handles binary values

Inspektor verifies `Bytea` values, shows their byte count, and keeps mutation fields read-only.

[[apps/studio/src/features/tables/grid/valuePresentation.ts#classifySchemaValue]] verifies that a `Bytea` value is a `Uint8Array`. The table cell displays the byte count, such as `12 KB`, instead of arbitrary binary content.

The inspection panel supports these actions through [[apps/studio/src/features/tables/rowEditor/values/binary.ts#encodeBinaryValue]] and related helpers:

- Copy as hexadecimal.
- Copy as Base64.
- Download as raw bytes.

The mutation form treats binary fields as read-only. This policy prevents a generic text editor from confusing hexadecimal, Base64, UTF-8 text, and raw bytes.
