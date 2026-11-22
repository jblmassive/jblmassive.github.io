# Jungle Book Legion website

GitHub Pages serves the frontend from the main branch. Jekyll builds the shared layout in `_layouts/jbl.html` and the navigation, footer and homepage content in `_includes/`. Edit `_includes/homepage.html` to update both `/` and `/home.html`.

The primary pages are `/`, `/events.html`, `/music.html` and `/production.html`. The legacy `/equipmenthire.html` URL points to the production catalogue. The old Artists and Contact pages remain available at their existing URLs.

The production basket and enquiry use `basket.js` and `quote.js`. The enquiries API runs separately on the ChatGPT Sites deployment. Use a mocked API response when testing the enquiry form so a test does not send a real enquiry. If the API domain changes, update the frontend endpoint and the API's allowed origins together.

## Enquiry references and email

The enquiry API uses the full UUID for deduplication. For the customer-facing reference, prefix the first 12 hexadecimal digits of the API-returned UUID (uppercased without hyphens) with `JBL-`. For example, `fb3c0703-4926-43c0-9763-83cab29e4853` displays as `JBL-FB3C07034926`. If the API returns a reference in a different format, display it as returned.

When connecting email delivery, include that same customer-facing reference in the subject and body of the JBL notification and in any customer acknowledgement. Derive it from the stored enquiry reference. Keep the full UUID for internal lookup and retries. Test that the page, email subject and email body show the same reference for one saved enquiry.
