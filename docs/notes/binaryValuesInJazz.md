## Overview

## References

[Jazz Files & Blobs](https://jazz.tools/docs/writing/files-and-blobs)

## How Jazz handle binary values?

### Small binary values

The schema uses:

- DSL: `s.bytes()`
- SQL storage: `BYTEA`
- Jazz descriptor: `Bytea`
- JavaScript value: `Uint8Array`

Recommended when the binary valu is small and should load with its containing row.

### Files and larger blobs

Chunked file storage:

- `file_parts.data` stores chunks using s.bytes()
- `files.partIds` stores the ordered chunk IDs
- `files.partSizes` stores their sizes
- `db.createFileFromBlob()` and `db.createFileFromStream()` create those records
- `db.loadFileAsBlob()` and `db.loadFileAsStream()` reconstruct the file

## What our Inspector Does

Our value classification verifies that a Bytea value is a Uint8Array.
The table cell displays the byte count, such as 12KB, rather than attempting to display arbitrary binary content.
The inspection panel supports:

- Copy as hexadecimal
- Copy as Base64
- Download as raw bytes
  The mutation form treats binary fields as read-only. That is intentional: a generic text editor cannot safely preserve whether the user means hexadecimal, Base64, UTF-8 text, or raw bytes.
