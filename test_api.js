const GROQ_API_KEY = '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';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

fetch(API_URL, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [{ role: 'user', content: 'Hi' }]
    })
})
.then(res => res.json())
.then(data => console.log("SUCCESS:", data))
.catch(err => console.error("ERROR:", err));
