# Jungle Book Legion source backup

Snapshot of the live Sites source at commit c02aba7. GitHub Pages continues to use the existing main branch.

The site uses a Worker and D1 for the enquiry form. The SQL file contains the database schema. To rebuild for Sites, supply the project-specific hosting manifest and run `python3 worker/build.py dist/server/index.js`.
