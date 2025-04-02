/**
 * Kahoot Question Viewer Extension - Content Script
 * 
 * This script runs in the context of Kahoot pages and handles:
 * - Creating and managing the floating indicator
 * - Detecting Kahoot questions and answers
 * - Analyzing answers using Google's Gemini API
 * - Managing extension settings and states
 */

(function() {
    // State management variables
    let enabled = true;          // Extension enabled state
    let floatingWindow = null;   // Reference to the floating indicator
    let checkInterval = null;    // Interval for checking questions
    let lastQuestion = '';       // Cache to prevent duplicate processing
    let lastColor = 'white';     // Last used indicator color
    
    // Configuration variables (synced with storage)
    let autoHide = true;         // Auto-hide indicator setting
    let hideDelay = '3';         // Delay before hiding (seconds)
    let position = 'top-right';  // Indicator position
    let size = 'medium';         // Indicator size
    let apiKey = '';            // Gemini API key
    let opacity = '100';        // Indicator opacity

    // Logging utility
    const logger = {
        info: (msg, data) => {
            console.log(`[Kahoot Viewer] ${msg}`, data || '');
        },
        error: (msg, err) => {
            console.error(`[Kahoot Viewer] ${msg}`, err || '');
        },
        warn: (msg, data) => {
            console.warn(`[Kahoot Viewer] ${msg}`, data || '');
        }
    };

    // Helper function to simulate a keyboard event
    function simulateKey(key) {
        const keyCode = key === "Tab" ? 9 : key === "Enter" ? 13 : 0;
        const options = {
            key: key,
            code: key,
            keyCode: keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true,
            composed: true
        };
        const keyDown = new KeyboardEvent('keydown', options);
        const keyUp = new KeyboardEvent('keyup', options);
        document.dispatchEvent(keyDown);
        document.dispatchEvent(keyUp);
        logger.info(`Simulated key: ${key}`);
    }

    // Initialize extension state and settings
    chrome.storage.local.get(['enabled', 'autoHide', 'hideDelay', 'position', 'size', 'apiKey', 'opacity'], async function(result) {
        enabled = result.enabled !== undefined ? result.enabled : true;
        autoHide = result.autoHide !== undefined ? result.autoHide : true;
        hideDelay = result.hideDelay || '3';
        position = result.position || 'top-right';
        size = result.size || 'medium';
        apiKey = result.apiKey || '';
        opacity = result.opacity || '100';
        
        if (enabled) {
            logger.info('Extension enabled, creating floating window');
            createFloatingWindow();
        } else {
            logger.info('Extension is disabled');
        }
    });

    // Listen for extension toggle and settings updates
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === "toggle") {
            enabled = !enabled;
            logger.info(`Extension ${enabled ? 'enabled' : 'disabled'}`);
            
            chrome.storage.local.set({ enabled: enabled });
            
            if (enabled) {
                createFloatingWindow();
            } else {
                cleanup();
            }
        } else if (request.action === "settingsUpdated") {
            logger.info('Settings updated:', request.settings);
            autoHide = request.settings.autoHide;
            hideDelay = request.settings.hideDelay;
            apiKey = request.settings.apiKey;
            position = request.settings.position;
            size = request.settings.size;
            opacity = request.settings.opacity;
            
            // Update floating window if it exists
            if (floatingWindow) {
                updateFloatingWindowPosition();
            }
        }
    });

    function getSizeInPixels(sizeOption) {
        switch(sizeOption) {
            case 'small': return '10px';
            case 'medium': return '20px';
            case 'large': return '30px';
            default: return '20px';
        }
    }

    function updateFloatingWindowPosition() {
        if (!floatingWindow) return;

        const sizeInPx = getSizeInPixels(size);
        floatingWindow.style.width = sizeInPx;
        floatingWindow.style.height = sizeInPx;

        switch(position) {
            case 'top-right':
                floatingWindow.style.top = '10px';
                floatingWindow.style.right = '10px';
                floatingWindow.style.left = '';
                floatingWindow.style.bottom = '';
                break;
            case 'top-left':
                floatingWindow.style.top = '10px';
                floatingWindow.style.left = '10px';
                floatingWindow.style.right = '';
                floatingWindow.style.bottom = '';
                break;
            case 'top-center':
                floatingWindow.style.top = '10px';
                floatingWindow.style.left = '50%';
                floatingWindow.style.right = '';
                floatingWindow.style.transform = 'translateX(-50%)';
                floatingWindow.style.bottom = '';
                break;
            case 'bottom-right':
                floatingWindow.style.bottom = '10px';
                floatingWindow.style.right = '10px';
                floatingWindow.style.top = '';
                floatingWindow.style.left = '';
                break;
            case 'bottom-left':
                floatingWindow.style.bottom = '10px';
                floatingWindow.style.left = '10px';
                floatingWindow.style.top = '';
                floatingWindow.style.right = '';
                break;
            case 'bottom-center':
                floatingWindow.style.bottom = '10px';
                floatingWindow.style.left = '50%';
                floatingWindow.style.right = '';
                floatingWindow.style.transform = 'translateX(-50%)';
                floatingWindow.style.top = '';
                break;
        }
    }

    // Cleanup function to remove window and clear interval
    function cleanup() {
        logger.info('Cleaning up...');
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
        if (floatingWindow) {
            floatingWindow.remove();
            floatingWindow = null;
        }
    }

    function createFloatingWindow() {
        // Clean up any existing instances
        cleanup();

        logger.info('Creating floating window');
        
        // Create minimal floating indicator
        floatingWindow = document.createElement('div');
        floatingWindow.id = 'kahoot-viewer';
        Object.assign(floatingWindow.style, {
            position: 'fixed',
            width: getSizeInPixels(size),
            height: getSizeInPixels(size),
            backgroundColor: 'white',
            borderRadius: '50%',
            zIndex: '9999',
            opacity: (opacity / 100).toString(),
            transition: 'all 0.3s ease',
            transform: 'scale(1)',
            cursor: 'pointer'
        });

        // Add hover listeners
        floatingWindow.addEventListener('mouseenter', () => {
            if (floatingWindow) {
                floatingWindow.style.opacity = (opacity / 100).toString();
                floatingWindow.style.backgroundColor = lastColor;
            }
        });

        floatingWindow.addEventListener('mouseleave', () => {
            if (floatingWindow) {
                floatingWindow.style.opacity = '0';
            }
        });

        // Add content container
        const content = document.createElement('div');
        content.id = 'kahoot-content';
        content.style.width = '100%';
        content.style.height = '100%';
        content.style.display = 'flex';
        content.style.alignItems = 'center';
        content.style.justifyContent = 'center';
        content.style.fontSize = '16px';
        content.style.fontWeight = 'bold';
        content.style.color = '#fff';
        floatingWindow.appendChild(content);

        document.body.appendChild(floatingWindow);
        logger.info('Floating window created');

        // Start periodic checking
        startQuestionChecking();
    }

    async function analyzeWithAI(question, answers) {
        try {
            logger.info('Sending question for analysis:', { question, answers });
            
            const prompt = `Question: ${question}\n\nPossible answers:\n${answers.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nBased on the question and possible answers, which answer number (1-${answers.length}) is most likely correct? Reply with just the number. ONLY GIVE BACK THE NUMBER, NOTHING ELSE. DO NOT EXPLAIN YOUR ANSWER.
DO NOT ADD ANYTHING ELSE TO THE RESPONSE. DO NOT SAY "THE ANSWER IS" OR "THE NUMBER IS". JUST RETURN THE NUMBER.
DO NOT RETURN A JSON OBJECT. DO NOT RETURN ANY TEXT. DO NOT RETURN ANYTHING EXCEPT THE NUMBER.
DO NOT RETURN A NUMBER LESS THAN 1.`;
            
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });
            
            if (!response.ok) {
                throw new Error('Gemini API request failed');
            }
            
            const result = await response.json();
            
            // Extract the answer number from Gemini's response
            const answerText = result.candidates[0].content.parts[0].text.trim();
            const answerNumber = parseInt(answerText);
            
            if (isNaN(answerNumber) || answerNumber < 1 || answerNumber > answers.length) {
                throw new Error('Invalid answer from Gemini API');
            }
            
            logger.info('Received AI analysis:', { likely_answer: answerNumber });
            return { likely_answer: answerNumber };
            
        } catch (error) {
            logger.error('AI analysis error:', error);
            return null;
        }
    }

    async function updateContent(question, answers) {
        try {
            const content = document.getElementById('kahoot-content');
            if (!content) {
                logger.error('Content element not found');
                return;
            }

            // Sanitize content
            const sanitizeHtml = (str) => {
                const temp = document.createElement('div');
                temp.textContent = str;
                return temp.innerHTML;
            };

            const sanitizedQuestion = sanitizeHtml(question);
            const sanitizedAnswers = answers.map(answer => sanitizeHtml(answer));

            // Get AI analysis
            const aiResult = await analyzeWithAI(question, answers);
            const likelyAnswer = aiResult?.likely_answer;

            // Set color based on the likely answer and number of answers
            let color;
            lastColor = 'white'; // Reset lastColor
            if (answers.length === 4) {
                // For 4 options: red, blue, yellow, green
                const colors = ['#e33f3c', '#1368ce', '#d89f2c', '#4e8b12'];
                color = colors[likelyAnswer - 1] || 'white';
                lastColor = color;
            } else if (answers.length === 2) {
                // For 2 options: blue for first, red for second
                color = likelyAnswer === 1 ? '#1368ce' : '#e33f3c';
                lastColor = color;
            } else {
                color = 'white';
            }
            
            // Pulse animation when new answer is shown
            floatingWindow.style.backgroundColor = color;
            floatingWindow.style.transform = 'scale(1.2)';
            setTimeout(() => {
                floatingWindow.style.transform = 'scale(1)';
            }, 200);

            floatingWindow.style.opacity = (opacity / 100).toString();
            content.innerHTML = '';
            
            if (autoHide) {
                const delayMs = parseInt(hideDelay) * 1000;
                setTimeout(() => {
                    if (floatingWindow) {
                        floatingWindow.style.opacity = '0';
                    }
                }, delayMs);
            }
            logger.info('Content updated with new question and answers');
        } catch (error) {
            logger.error('Error updating content:', error);
        }
    }

    function startQuestionChecking() {
        logger.info('Starting question checking interval');
        
        // Check every 1 second
        checkInterval = setInterval(async () => {
            try {
                if (!enabled) return;

                // Try regular mode selectors first
                let questionElement = document.querySelector('[data-functional-selector="block-title"]');
                let answerElements = document.querySelectorAll('[data-functional-selector^="question-choice-text-"]');
                
                // If not found, try challenge mode selectors
                if (!questionElement) {
                    questionElement = document.querySelector('.challenge-question');
                    answerElements = document.querySelectorAll('.challenge-answer');
                }
                
                if (!questionElement) return;

                const currentQuestion = questionElement.textContent.trim();
                
                // Only update if question has changed
                if (currentQuestion === lastQuestion) return;
                
                logger.info('New question detected:', currentQuestion);
                lastQuestion = currentQuestion;

                if (!answerElements.length) return;

                // Extract answers
                const answers = Array.from(answerElements).map(el => {
                    // For challenge mode, we need to extract just the answer text
                    const answerText = el.querySelector('.answer-text');
                    return (answerText || el).textContent.trim();
                });
                logger.info('Answers found:', answers);

                // Update the floating window
                await updateContent(currentQuestion, answers);
            } catch (error) {
                logger.error('Error checking for questions:', error);
            }
        }, 1000);
    }

    // Clean up when the page unloads
    window.addEventListener('unload', () => {
        logger.info('Page unloading, cleaning up');
        cleanup();
    });

    logger.info('Extension initialized');
})();
