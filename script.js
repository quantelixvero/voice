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

if (!SpeechRecognition) {
    statusText.textContent = "Your browser does not support Speech Recognition. Please use Chrome.";
    startBtn.disabled = true;
} else {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    let isRecording = false;

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
    
    // Visual feedback
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
    setTimeout(() => {
        copyBtn.innerHTML = originalText;
    }, 2000);
});

clearBtn.addEventListener('click', () => {
    if(confirm("Are you sure you want to clear the text?")) {
        resultTextarea.value = '';
    }
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
