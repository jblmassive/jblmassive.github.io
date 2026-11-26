# Jungle Book Legion website

GitHub Pages serves the frontend from the main branch. Jekyll builds the shared layout in `_layouts/jbl.html` and the navigation, footer and homepage content in `_includes/`. Edit `_includes/homepage.html` to update both `/` and `/home.html`.

The primary pages are `/`, `/events.html`, `/music.html` and `/production.html`. The legacy `/equipmenthire.html` URL points to the production catalogue. The legacy `/artists.html` and `/aboutcontact.html` URLs redirect to Music and Contact. The general contact form at `/contact.html` uses the existing Formspree endpoint.

The production basket and enquiry use `basket.js` and `quote.js`. The enquiries API runs separately on the ChatGPT Sites deployment. Use a mocked API response when testing the enquiry form so a test does not send a real enquiry. If the API domain changes, update the frontend endpoint and the API's allowed origins together.

## Enquiry references and email

The enquiry API uses the full UUID for deduplication. New enquiries from the shorter form also receive a unique stored reference such as `JBL-7K4M2Q`. The confirmation screen and the Resend notification use that same saved code. Older enquiries keep their original references.

Production notifications go to `bookings@junglebooklegion.com`. The customer's email is the Reply-To address. Email has branded HTML and a plain-text fallback.

## Website to-do

- Verify the redesigned production email in the bookings inbox, including Reply-To and the shared short reference.
- Add server-verified Turnstile and rate limits for production enquiries.
- Check navigation, equipment basket and Stage Command screenshots on a narrow phone.
- Add footer-linked privacy information for contact and enquiry submissions and third-party embeds.
- Capture a Stage Command Multicam screenshot with synced footage loaded.
