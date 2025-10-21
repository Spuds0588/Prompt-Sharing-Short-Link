// [Prompt.share] - app.js - v1.1
// Optimized data structure for shorter links.

(function() {
    'use strict';

    const CIPHER_KEY = 'prompt.share';
    // Using a Section Sign as a delimiter. It's uncommon in both URLs and prompts.
    const DELIMITER = '§'; 

    /**
     * Simple XOR cipher function.
     * @param {string} text The text to be ciphered/deciphered.
     * @returns {string} The result of the XOR operation.
     */
    function xorCipher(text, key) {
        // No change to this function, but keeping it for context.
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    }

    /**
     * Encodes the data object into a shareable string using an optimized structure.
     * @param {object} data The data to encode (e.g., { prompt: '...', destination: '...' }).
     * @returns {string} The encoded string.
     */
    function encodeData(data) {
        try {
            console.log('[Prompt.share v1.1] Starting encoding process...');
            
            // OPTIMIZATION: Use a delimiter instead of JSON
            let rawString = data.prompt;
            if (data.destination) {
                rawString += DELIMITER + data.destination;
            }
            console.log(`[Prompt.share v1.1] Original data length (raw string): ${rawString.length}`);

            const compressed = LZString.compressToUTF16(rawString);
            console.log(`[Prompt.share v1.1] Compressed data length: ${compressed.length}`);
            
            const ciphered = xorCipher(compressed, CIPHER_KEY);
            
            const encoded = LZString.compressToEncodedURIComponent(ciphered);
            console.log(`[Prompt.share v1.1] Final encoded length: ${encoded.length}`);

            return encoded;
        } catch (error) {
            console.error('[Prompt.share v1.1] Error during encoding:', error);
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
            console.log('[Prompt.share v1.1] Starting decoding process...');
            console.log(`[Prompt.share v1.1] Encoded string length: ${encodedString.length}`);

            const deciphered = LZString.decompressFromEncodedURIComponent(encodedString);
            if (deciphered === null) {
                console.error('[Prompt.share v1.1] Decompression (from URI component) failed.');
                return null;
            }
            
            const decompressed = xorCipher(deciphered, CIPHER_KEY);
            
            const rawString = LZString.decompressFromUTF16(decompressed);
            if (rawString === null) {
                console.error('[Prompt.share v1.1] Decompression (from UTF16) failed.');
                return null;
            }
            console.log(`[Prompt.share v1.1] Decompressed raw string length: ${rawString.length}`);

            // OPTIMIZATION: Parse the string using our delimiter
            const parts = rawString.split(DELIMITER);
            const data = {
                prompt: parts[0]
            };
            if (parts.length > 1) {
                data.destination = parts[1];
            }

            console.log('[Prompt.share v1.1] Decoding successful:', data);
            return data;
        } catch (error) {
            console.error('[Prompt.share v1.1] Error during decoding:', error);
            return null;
        }
    }

    // --- Page Handler Functions (No changes below this line) ---

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