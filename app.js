// [Prompt.share] - app.js - v1.2
// Added third-party shorteners and social sharing.

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
            // Only encode the prompt
            let rawString = data.prompt;
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
            // Only return the prompt
            const data = { prompt: rawString };
            console.log('[Prompt.share v1.1] Decoding successful:', data);
            return data;
        } catch (error) {
            console.error('[Prompt.share v1.1] Error during decoding:', error);
            return null;
        }
    }

    /**
     * Logic for the Creator page (creator.html)
     */
    function handleCreatorPage() {
        console.log('[Prompt.share] Initializing Creator Page...');
        const promptInput = document.getElementById('prompt-input');
        const generateButton = document.getElementById('generate-button');
        const resultArea = document.getElementById('result-area');
        const generatedLinkInput = document.getElementById('generated-link');
        const copyGeneratedLinkButton = document.getElementById('copy-generated-link-button');
        const promptField = document.getElementById('prompt-field');
        const resultsExtra = document.getElementById('results-extra');

        // Null checks for all required elements
        if (!promptInput || !generateButton || !resultArea || !generatedLinkInput || !copyGeneratedLinkButton || !promptField) {
            console.error('[Prompt.share] One or more required elements are missing in creator.html. Aborting handleCreatorPage.');
            return;
        }

        generateButton.addEventListener('click', () => {
            console.log('[Prompt.share] Generate button clicked.');
            const prompt = promptInput.value ? promptInput.value.trim() : '';
            if (!prompt) {
                alert('Prompt cannot be empty.');
                return;
            }
            const data = { prompt };
            const encodedData = encodeData(data);
            if (encodedData) {
                const baseUrl = window.location.hostname.includes('mypromptl.ink') 
                    ? 'https://mypromptl.ink/' 
                    : window.location.origin + window.location.pathname.replace('creator.html', '');
                const shareUrl = `${baseUrl}?p=${encodedData}`;
                generatedLinkInput.value = shareUrl;
                resultArea.classList.remove('is-hidden');
                if (resultsExtra) resultsExtra.classList.remove('is-hidden');
                promptField.classList.add('is-hidden');
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
        const params = new URLSearchParams(window.location.search);
        const encodedData = params.get('p');
        if (encodedData) {
            const decoded = decodeData(encodedData);
            if (decoded && decoded.prompt) {
                promptDisplay.textContent = decoded.prompt;
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
                loadingState.classList.add('is-hidden');
                errorState.classList.remove('is-hidden');
            }
        } else {
            loadingState.innerHTML = '<p class="has-text-centered">This is the landing page for shared prompts. <a href="/creator.html">Create your own link here.</a></p>';
        }
    }

    // Determine which page we are on and run the appropriate logic.
    if (document.getElementById('prompt-input')) {
        handleCreatorPage();
    } else if (document.getElementById('prompt-display')) {
        handleIndexPage();
    }

})();