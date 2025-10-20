// [Prompt.share] - app.js - v1.0

(function() {
    'use strict';

    // A simple key for our 'cipher'. This is for obfuscation, not security.
    const CIPHER_KEY = 'prompt.share';

    /**
     * Simple XOR cipher function.
     * @param {string} text The text to be ciphered/deciphered.
     * @returns {string} The result of the XOR operation.
     */
    function xorCipher(text, key) {
        console.log('[Prompt.share] Applying XOR cipher...');
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    }

    /**
     * Encodes the data object into a shareable string.
     * @param {object} data The data to encode (e.g., { prompt: '...', destination: '...' }).
     * @returns {string} The encoded string.
     */
    function encodeData(data) {
        try {
            console.log('[Prompt.share] Starting encoding process...');
            const jsonString = JSON.stringify(data);
            console.log(`[Prompt.share] Original data length: ${jsonString.length}`);

            const compressed = LZString.compressToUTF16(jsonString);
            console.log(`[Prompt.share] Compressed data length: ${compressed.length}`);
            
            const ciphered = xorCipher(compressed, CIPHER_KEY);
            
            // Using compressToEncodedURIComponent for shorter, URL-safe strings
            const encoded = LZString.compressToEncodedURIComponent(ciphered);
            console.log(`[Prompt.share] Final encoded length: ${encoded.length}`);

            return encoded;
        } catch (error) {
            console.error('[Prompt.share] Error during encoding:', error);
            return null;
        }
    }

    /**
     * Decodes the shareable string back into the data object.
     * @param {string} encodedString The string from the URL.
     * @returns {object|null} The decoded data object or null if an error occurs.
     */
    function decodeData(encodedString) {
        try {
            console.log('[Prompt.share] Starting decoding process...');
            console.log(`[Prompt.share] Encoded string length: ${encodedString.length}`);

            const deciphered = LZString.decompressFromEncodedURIComponent(encodedString);
            if (deciphered === null) {
                console.error('[Prompt.share] Decompression (from URI component) failed. The string might be invalid.');
                return null;
            }
            
            const decompressed = xorCipher(deciphered, CIPHER_KEY);
            
            const jsonString = LZString.decompressFromUTF16(decompressed);
            if (jsonString === null) {
                console.error('[Prompt.share] Decompression (from UTF16) failed.');
                return null;
            }
            console.log(`[Prompt.share] Decompressed JSON string length: ${jsonString.length}`);

            const data = JSON.parse(jsonString);
            console.log('[Prompt.share] Decoding successful:', data);
            return data;
        } catch (error) {
            console.error('[Prompt.share] Error during decoding:', error);
            return null;
        }
    }

    /**
     * Logic for the Creator page (creator.html)
     */
    function handleCreatorPage() {
        console.log('[Prompt.share] Initializing Creator Page...');
        const promptInput = document.getElementById('prompt-input');
        const destinationInput = document.getElementById('destination-input');
        const generateButton = document.getElementById('generate-button');
        const resultArea = document.getElementById('result-area');
        const generatedLinkInput = document.getElementById('generated-link');
        const copyGeneratedLinkButton = document.getElementById('copy-generated-link-button');

        generateButton.addEventListener('click', () => {
            console.log('[Prompt.share] Generate button clicked.');
            const prompt = promptInput.value.trim();
            const destination = destinationInput.value.trim();

            if (!prompt) {
                alert('Prompt cannot be empty.');
                return;
            }

            const data = { prompt };
            if (destination) {
                data.destination = destination;
            }

            const encodedData = encodeData(data);

            if (encodedData) {
                const baseUrl = window.location.origin + window.location.pathname.replace('creator.html', '');
                const shareUrl = `${baseUrl}?p=${encodedData}`;
                generatedLinkInput.value = shareUrl;
                resultArea.classList.remove('is-hidden');
            } else {
                alert('Failed to generate the link. Please check the console for errors.');
            }
        });

        copyGeneratedLinkButton.addEventListener('click', () => {
            generatedLinkInput.select();
            document.execCommand('copy');
            copyGeneratedLinkButton.textContent = 'Copied!';
            setTimeout(() => {
                copyGeneratedLinkButton.textContent = 'Copy Link';
            }, 2000);
        });
    }

    /**
     * Logic for the Index/Landing page (index.html)
     */
    function handleIndexPage() {
        console.log('[Prompt.share] Initializing Index Page...');
        const loadingState = document.getElementById('loading-state');
        const contentState = document.getElementById('content-state');
        const errorState = document.getElementById('error-state');
        const promptDisplay = document.getElementById('prompt-display');
        const copyButton = document.getElementById('copy-button');
        const redirectLink = document.getElementById('redirect-link');

        const params = new URLSearchParams(window.location.search);
        const encodedData = params.get('p');

        if (encodedData) {
            const decoded = decodeData(encodedData);

            if (decoded && decoded.prompt) {
                promptDisplay.textContent = decoded.prompt;
                if (decoded.destination) {
                    redirectLink.href = decoded.destination;
                    redirectLink.classList.remove('is-hidden');
                }
                loadingState.classList.add('is-hidden');
                contentState.classList.remove('is-hidden');

                copyButton.addEventListener('click', () => {
                    navigator.clipboard.writeText(decoded.prompt).then(() => {
                        copyButton.textContent = 'Copied!';
                        setTimeout(() => {
                            copyButton.textContent = 'Copy Prompt';
                        }, 2000);
                    }).catch(err => {
                        console.error('[Prompt.share] Failed to copy text: ', err);
                        alert('Failed to copy prompt.');
                    });
                });

            } else {
                // Decoding failed
                loadingState.classList.add('is-hidden');
                errorState.classList.remove('is-hidden');
            }
        } else {
            // No data in URL, maybe show a welcome message or redirect to creator
            loadingState.innerHTML = '<p class="has-text-centered">No prompt data found in the URL. <a href="/creator.html">Create a link?</a></p>';
        }
    }

    // Determine which page we are on and run the appropriate logic.
    if (document.getElementById('prompt-input')) {
        handleCreatorPage();
    } else if (document.getElementById('prompt-display')) {
        handleIndexPage();
    }

})();