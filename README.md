# Jungle Book Legion website

GitHub Pages serves the frontend from the main branch. Jekyll builds the shared layout in `_layouts/jbl.html` and the navigation, footer and homepage content in `_includes/`. Edit `_includes/homepage.html` to update both `/` and `/home.html`.

The primary pages are `/`, `/events.html`, `/music.html` and `/production.html`. The legacy `/equipmenthire.html` URL points to the production catalogue. The old Artists and Contact pages remain available at their existing URLs.

The production basket and enquiry use `basket.js` and `quote.js`. The enquiries API runs separately on the ChatGPT Sites deployment. Use a mocked API response when testing the enquiry form so a test does not send a real enquiry. If the API domain changes, update the frontend endpoint and the API's allowed origins together.
