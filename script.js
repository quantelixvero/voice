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
    resultTextarea.value = '';
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

// Groq API Integration for AI Features
const GROQ_API_KEY = "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";

async function callGroqAPI(systemPrompt, userText, buttonElement, originalHTML) {
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
                    { role: 'user', content: userText }
                ],
                temperature: 0.3,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const outputText = data.choices[0].message.content.trim();
        
        // Update textarea
        resultTextarea.value = outputText;
        statusText.textContent = "AI task complete.";
        statusText.style.color = 'var(--success-color)';
        setTimeout(() => {
            if (statusText.textContent === "AI task complete.") {
                statusText.textContent = "Ready";
                statusText.style.color = 'var(--text-muted)';
            }
        }, 3000);

    } catch (error) {
        console.error("Groq API Error:", error);
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
    callGroqAPI(systemPrompt, text, translateBtn, '<i class="fa-solid fa-language"></i> Translate');
});

rewriteBtn.addEventListener('click', () => {
    const text = resultTextarea.value;
    if (!text.trim()) {
        alert("Please enter some text or use voice typing first.");
        return;
    }
    const systemPrompt = "You are an expert editor. Rewrite and refine the following text to make it clear, professional, well-structured, and grammatically correct. Do not change the original meaning, and do not remove any core information. Output ONLY the refined text without any quotes, explanations, or conversational filler. Keep the language the same as the input language.";
    callGroqAPI(systemPrompt, text, rewriteBtn, '<i class="fa-solid fa-pen-nib"></i> Rewrite');
});
