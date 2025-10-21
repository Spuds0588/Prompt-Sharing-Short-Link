# Prompt sharing short link system

**A serverless, client-side tool for creating short, shareable links for long prompts.**

Prompt share provides a simple way to share complex or lengthy text prompts without relying on a backend service. It uses compression and encoding techniques directly in the browser to transform a long prompt (and an optional destination URL) into a compact link, perfect for sharing in social media, emails, or messaging apps.

This project runs entirely on static files, making it ideal for hosting on services like GitHub Pages.

## How It Works

The core challenge is to shorten a long piece of text without a database to store it in. Prompt.share solves this by processing everything on the client-side:

1.  **Input:** A user enters a prompt and an optional destination URL on the `creator.html` page.
2.  **Package:** The prompt and URL are packaged into a JSON object.
3.  **Compress:** This JSON string is then compressed using the `lz-string` library to significantly reduce its size.
4.  **Obfuscate (Cipher):** A simple XOR cipher is applied. This is **not for security**, but to make the raw compressed string less recognizable.
5.  **Encode:** The final string is compressed again into a URL-safe format using `lz-string`'s `compressToEncodedURIComponent` function. This is the key to getting the shortest possible string that can be safely passed in a URL.
6.  **Generate Link:** The resulting string is appended to the URL as a query parameter (e.g., `?p=...`).
7.  **Decode:** When another user opens this link, the `index.html` page reads the parameter, runs the entire process in reverse (decodes, de-obfuscates, decompresses), and displays the original prompt and destination link.

Because everything happens in the user's browser, the data is never sent to or stored on a server, ensuring user privacy.

## Features

-   **100% Serverless:** No backend, no database, no hosting costs. Runs anywhere you can host static HTML, CSS, and JS files.
-   **Privacy Focused:** All data processing happens client-side. Your prompts are never logged or stored.
-   **Efficient Compression:** Creates surprisingly short links for even very long prompts.
-   **Optional Redirect:** Include a destination URL to guide the user after they've copied the prompt.
-   **Simple & Clean UI:** Built with Bulma.css for a responsive and modern user experience.
-   **Easy to Deploy:** Get your own instance running on GitHub Pages in minutes.

## Technology Stack

-   **HTML5**
-   **CSS3** with [Bulma.css](https://bulma.io/)
-   **Vanilla JavaScript (ES6)**
-   [**lz-string**](https://github.com/pieroxy/lz-string) for data compression

## How to Deploy Your Own Instance

You can easily host your own version of Prompt.share using GitHub Pages:

1.  **Fork this Repository:** Click the "Fork" button at the top-right of this page.
2.  **Enable GitHub Pages:**
    -   In your forked repository, go to `Settings` > `Pages`.
    -   Under "Build and deployment", select `Deploy from a branch` as the source.
    -   Choose the `main` (or `master`) branch and the `/ (root)` folder, then click `Save`.
3.  **Done!** Your instance will be live at `https://<your-username>.github.io/<repository-name>/` within a few minutes. You can create new links by visiting `.../creator.html`.

## A Note on Security

The "cipher" used in this tool is a simple XOR operation designed for **obfuscation only**. Its purpose is to prevent the compressed data in the URL from being trivially readable. It does **not** provide encryption or security. Since all encoding and decoding logic is present in the client-side JavaScript, anyone can reverse-engineer it.

**Do not use this tool to share sensitive or private information.**

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
