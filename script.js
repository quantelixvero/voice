// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const languageSelect = document.getElementById('language');
const startBtn = document.getElementById('start-btn');
const btnText = document.getElementById('btn-text');
const statusText = document.getElementById('status');
const resultTextarea = document.getElementById('result-text');
const copyBtn = document.getElementById('copy-btn');
const saveBtn = document.getElementById('save-btn');
const clearBtn = document.getElementById('clear-btn');
const translateBtn = document.getElementById('translate-btn');
const rewriteBtn = document.getElementById('rewrite-btn');
const answerBtn = document.getElementById('answer-btn');

// Theme Management
let isDarkMode = true;

// Check local storage for theme
if (localStorage.getItem('theme') === 'light') {
    isDarkMode = false;
    body.classList.remove('dark-mode');
    body.classList.add('light-mode');
    themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
}

themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        localStorage.setItem('theme', 'light');
    }
});

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition;
let isRecording = false;

if (!SpeechRecognition) {
    statusText.textContent = "Your browser does not support Speech Recognition. Please use Chrome.";
    startBtn.disabled = true;
} else {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Set initial language
    recognition.lang = languageSelect.value;

    languageSelect.addEventListener('change', (e) => {
        recognition.lang = e.target.value;
        if (isRecording) {
            recognition.stop();
            setTimeout(() => recognition.start(), 300);
        }
    });

    startBtn.addEventListener('click', () => {
        if (!isRecording) {
            recognition.start();
        } else {
            recognition.stop();
        }
    });

    recognition.onstart = () => {
        isRecording = true;
        startBtn.classList.add('recording');
        btnText.textContent = 'Stop Listening';
        statusText.textContent = 'Listening...';
        statusText.style.color = 'var(--danger-color)';
    };

    recognition.onend = () => {
        isRecording = false;
        startBtn.classList.remove('recording');
        btnText.textContent = 'Start Listening';
        statusText.textContent = 'Ready';
        statusText.style.color = 'var(--text-muted)';
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + ' ';
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        if (finalTranscript !== '') {
            const currentText = resultTextarea.value;
            if (currentText.length > 0 && !currentText.endsWith(' ') && !currentText.endsWith('\n')) {
                resultTextarea.value += ' ';
            }
            resultTextarea.value += finalTranscript;
            resultTextarea.scrollTop = resultTextarea.scrollHeight;
        }
        
        if (interimTranscript !== '') {
            statusText.textContent = `Hearing: ${interimTranscript}`;
        } else {
            statusText.textContent = 'Listening...';
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
            statusText.textContent = "Microphone access denied.";
        } else {
            statusText.textContent = `Error: ${event.error}`;
        }
    };
}

// Utility Buttons
copyBtn.addEventListener('click', () => {
    if (!resultTextarea.value.trim()) return;
    
    resultTextarea.select();
    document.execCommand('copy');
    
    // Auto-stop listening
    if (recognition && isRecording) {
        recognition.stop();
    }
    
    // Visual feedback
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
    setTimeout(() => {
        copyBtn.innerHTML = originalText;
    }, 2000);
});

clearBtn.addEventListener('click', () => {
    if (resultTextarea.value.trim()) {
        addToHistory(resultTextarea.value, "Cleared Text");
    }
    resultTextarea.value = '';
    document.getElementById('results-container').innerHTML = '';
});

saveBtn.addEventListener('click', () => {
    const text = resultTextarea.value;
    if (!text.trim()) return;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Voice_Typing_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// History Panel Logic
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

function addToHistory(text, type = "Log") {
    if (!text || !text.trim()) return;
    
    const item = document.createElement('div');
    item.className = 'history-item';
    
    const time = new Date().toLocaleTimeString();
    
    item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">${type} • ${time}</span>
        </div>
        <div class="history-text">${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
        <div class="history-actions">
            <button class="utility-btn history-copy-btn" title="Copy to Clipboard">
                <i class="fa-regular fa-copy"></i> Copy
            </button>
        </div>
    `;
    
    const copyBtn = item.querySelector('.history-copy-btn');
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(text).then(() => {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
            }, 2000);
        });
    });
    
    historyList.prepend(item);
    saveHistoryToLocal();
}

function saveHistoryToLocal() {
    const items = [];
    document.querySelectorAll('.history-item').forEach(item => {
        const typeTime = item.querySelector('span').textContent;
        const text = item.querySelector('.history-text').textContent;
        items.push({ typeTime, text });
    });
    localStorage.setItem('voice-typing-history', JSON.stringify(items));
}

function loadHistory() {
    const saved = localStorage.getItem('voice-typing-history');
    if (saved) {
        const items = JSON.parse(saved);
        items.reverse().forEach(data => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">${data.typeTime}</span>
                </div>
                <div class="history-text">${data.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                <div class="history-actions">
                    <button class="utility-btn history-copy-btn" title="Copy to Clipboard">
                        <i class="fa-regular fa-copy"></i> Copy
                    </button>
                </div>
            `;
            
            const copyBtn = item.querySelector('.history-copy-btn');
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(data.text).then(() => {
                    const originalHTML = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                    setTimeout(() => {
                        copyBtn.innerHTML = originalHTML;
                    }, 2000);
                });
            });
            historyList.prepend(item);
        });
    }
}

clearHistoryBtn.addEventListener('click', () => {
    if(confirm("Are you sure you want to clear all history?")) {
        historyList.innerHTML = '';
        localStorage.removeItem('voice-typing-history');
    }
});

loadHistory();

// AI Models & APIs
const GROQ_API_KEY = "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";
const GEMINI_API_KEY = "AIzaSyAtlf_d92szRiQ1e5yb7Eyp63wW9UMDMTE";
const GEMINI_PRO_API_KEY = "AIzaSyA45ACiYF6aXnQm0bnbM3NRdoOrOcsCn10";
const GEMINI_PRO2_API_KEY = "AIzaSyCUx1fNBVBHoPA6WE_JZ8yzFL6GB-ShefI";

const modelSelect = document.getElementById('model');

async function callAI(systemPrompt, userText, buttonElement, originalHTML, taskName) {
    if (!userText.trim()) return;
    
    // UI Loading state
    buttonElement.disabled = true;
    buttonElement.innerHTML = '<i class="fa-solid fa-spinner"></i> Processing...';
    
    // Auto-stop listening if active
    if (recognition && isRecording) {
        recognition.stop();
    }
    
    const previousStatus = statusText.textContent;
    statusText.textContent = "AI is thinking...";
    statusText.style.color = 'var(--primary-color)';
    
    try {
        const selectedModel = modelSelect.value;
        let outputText = '';
        
        // Enforce strict prompt to prevent conversational answers during translate/rewrite
        let strictUserText = userText;
        if (taskName !== 'Answer') {
            strictUserText = `Text to process:\n${userText}\n\nRule: Output ONLY the result based on the system instruction. NO conversational filler.`;
        }

        if (selectedModel === 'plus' || selectedModel === 'pro1' || selectedModel === 'pro2') {
            // Gemini API Call
            let url;
            if (selectedModel === 'plus') {
                url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
            } else if (selectedModel === 'pro1') {
                url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_PRO_API_KEY}`;
            } else {
                url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_PRO2_API_KEY}`;
            }
            
            const prompt = `System Instruction: ${systemPrompt}\n\n${strictUserText}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error?.message || `Gemini API Error: ${response.status}`);
            }
            
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error("No response generated (possibly blocked by safety settings).");
            }

            outputText = data.candidates[0].content.parts[0].text.trim();
        } else {
            // Groq API Call
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: strictUserText }
                    ],
                    temperature: 0.3,
                    max_tokens: 1024
                })
            });

            if (!response.ok) {
                throw new Error(`Groq API Error: ${response.status}`);
            }

            const data = await response.json();
            outputText = data.choices[0].message.content.trim();
        }
        
        // Add Original to history before modification
        addToHistory(userText, "Original Text");

        let modelLabel = 'Base Model';
        if (selectedModel === 'plus') modelLabel = 'Plus Model';
        if (selectedModel === 'pro1') modelLabel = 'Pro Model 1.0';
        if (selectedModel === 'pro2') modelLabel = 'Pro Model 2.0';

        // Create a result card in the results-container
        const resultsContainer = document.getElementById('results-container');
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <div class="result-header">
                <span class="result-label"><i class="fa-solid fa-wand-magic-sparkles"></i> ${taskName} Result (${modelLabel})</span>
                <button class="utility-btn result-copy-btn" title="Copy Result">
                    <i class="fa-regular fa-copy"></i> Copy
                </button>
            </div>
            <div class="result-text">${outputText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
        `;
        
        const copyBtn = card.querySelector('.result-copy-btn');
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(outputText).then(() => {
                const prev = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                setTimeout(() => copyBtn.innerHTML = prev, 2000);
            });
        });
        
        resultsContainer.prepend(card);
        
        // Add Result to history panel
        addToHistory(outputText, `${taskName} Result (${modelLabel})`);

        statusText.textContent = "AI task complete.";
        statusText.style.color = 'var(--success-color)';
        setTimeout(() => {
            if (statusText.textContent === "AI task complete.") {
                statusText.textContent = "Ready";
                statusText.style.color = 'var(--text-muted)';
            }
        }, 3000);

    } catch (error) {
        console.error("AI API Error:", error);
        alert("Failed to process with AI. Please try again later.");
        statusText.textContent = "AI request failed.";
        statusText.style.color = 'var(--danger-color)';
    } finally {
        buttonElement.disabled = false;
        buttonElement.innerHTML = originalHTML;
    }
}

// AI Feature Event Listeners
translateBtn.addEventListener('click', () => {
    const text = resultTextarea.value;
    if (!text.trim()) {
        alert("Please enter some text or use voice typing first.");
        return;
    }
    const systemPrompt = "You are a highly skilled translator. Identify the language of the following text. If it is in Bengali, translate it perfectly to English. If it is in English, translate it perfectly to Bengali. Output ONLY the translated text without any quotes, explanations, or conversational filler. Keep the tone natural.";
    callAI(systemPrompt, text, translateBtn, '<i class="fa-solid fa-language"></i> Translate', 'Translation');
});

rewriteBtn.addEventListener('click', () => {
    const text = resultTextarea.value;
    if (!text.trim()) {
        alert("Please enter some text or use voice typing first.");
        return;
    }
    const systemPrompt = "You are an expert editor. Rewrite and refine the following text. Use very simple, natural, and everyday language. DO NOT use overly formal, grave, or complex words. Make it sound like a normal conversation while keeping it clear and grammatically correct. Output ONLY the refined text without any quotes or conversational filler. Keep the language the same as the input language.";
    callAI(systemPrompt, text, rewriteBtn, '<i class="fa-solid fa-pen-nib"></i> Rewrite', 'Rewrite');
});

answerBtn.addEventListener('click', () => {
    const text = resultTextarea.value;
    if (!text.trim()) {
        alert("Please enter some text or use voice typing first.");
        return;
    }
    const systemPrompt = "You are a helpful and intelligent AI assistant. Read the user's text and provide a clear, accurate, and friendly answer or response to it. Use natural and simple language. Output ONLY your answer without unnecessary conversational filler.";
    callAI(systemPrompt, text, answerBtn, '<i class="fa-solid fa-robot"></i> Answer', 'Answer');
});
