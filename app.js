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
        
        // New elements for v1.2
        const resultsExtra = document.getElementById('results-extra');
        const tinyUrlButton = document.getElementById('tinyurl-button');
        const bitlyButton = document.getElementById('bitly-button');
        const tinyUrlResultArea = document.getElementById('tinyurl-result-area');
        const tinyUrlLinkInput = document.getElementById('tinyurl-link');
        const shareTwitter = document.getElementById('share-twitter');
        const shareFacebook = document.getElementById('share-facebook');
        const shareReddit = document.getElementById('share-reddit');
        const shareEmail = document.getElementById('share-email');


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
                // Use the live domain if available, otherwise use the current location.
                const baseUrl = window.location.hostname.includes('mypromptl.ink') 
                    ? 'https://mypromptl.ink/' 
                    : window.location.origin + window.location.pathname.replace('creator.html', '');
                const shareUrl = `${baseUrl}?p=${encodedData}`;
                
                generatedLinkInput.value = shareUrl;
                resultArea.classList.remove('is-hidden');
                resultsExtra.classList.remove('is-hidden'); // Show the new section
                tinyUrlResultArea.classList.add('is-hidden'); // Hide old tinyurl results
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
        
        // --- New Logic for v1.2 ---
        
        tinyUrlButton.addEventListener('click', async () => {
            const longUrl = generatedLinkInput.value;
            console.log(`[Prompt.share] Shortening with TinyURL: ${longUrl}`);
            tinyUrlButton.classList.add('is-loading');

            try {
                const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
                if (response.ok) {
                    const shortUrl = await response.text();
                    console.log(`[Prompt.share] TinyURL success: ${shortUrl}`);
                    tinyUrlLinkInput.value = shortUrl;
                    tinyUrlResultArea.classList.remove('is-hidden');
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            } catch (error) {
                console.error('[Prompt.share] TinyURL request failed:', error);
                alert('Failed to shorten URL with TinyURL.');
            } finally {
                tinyUrlButton.classList.remove('is-loading');
            }
        });

        bitlyButton.addEventListener('click', () => {
            const longUrl = generatedLinkInput.value;
            console.log(`[Prompt.share] Handing off to Bitly: ${longUrl}`);
            const bitlyUrl = `https://bitly.com/s/?url=${encodeURIComponent(longUrl)}`;
            window.open(bitlyUrl, '_blank');
        });
        
        function getShareUrl() {
            // Prefer the tinyurl if it exists, otherwise use the main one.
            return tinyUrlResultArea.classList.contains('is-hidden')
                ? generatedLinkInput.value
                : tinyUrlLinkInput.value;
        }

        shareTwitter.addEventListener('click', () => {
            const url = getShareUrl();
            const text = "Check out this prompt I made:";
            const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
            window.open(twitterUrl, '_blank');
        });

        shareFacebook.addEventListener('click', () => {
            const url = getShareUrl();
            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            window.open(facebookUrl, '_blank');
        });
        
        shareReddit.addEventListener('click', () => {
            const url = getShareUrl();
            const title = "A new shareable prompt";
            const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
            window.open(redditUrl, '_blank');
        });
        
        shareEmail.addEventListener('click', () => {
            const url = getShareUrl();
            const subject = "A new shareable prompt";
            const body = `I created a prompt and wanted to share it with you:\n\n${url}`;
            const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoUrl;
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
            // No data in URL, show a message directing to the creator page
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