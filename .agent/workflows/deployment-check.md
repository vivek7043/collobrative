---
description: Check if the application is ready for deployment
---

This workflow verifies that all environment variables and build steps are correctly configured for production.

1. Check for `VITE_API_URL` usage in [Room.jsx](file:///c:/Users/helLO/Desktop/2026/client/src/pages/Room.jsx)
// turbo
2. Build the client to ensure no build errors:
   - Cwd: `c:\Users\helLO\Desktop\2026\client`
   - Command: `npm run build`
// turbo
3. Check the server for CORS configuration in [index.js](file:///c:/Users/helLO/Desktop/2026/server/index.js)

If all steps pass, the application is ready to be pushed to GitHub and connected to a hosting provider.
