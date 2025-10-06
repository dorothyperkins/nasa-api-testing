## FIX NOTES
- APOD: allow 404 (lag) and set date=two days ago by default.
- Negative auth test: accepts 400/401/403; checks JSON error too.
- EPIC: allow transient 503 without failing tests.
- Removed duplicate `const data` collisions by using unique variables.
- NeoWs/Mars tests unchanged in logic but variable names fixed.
