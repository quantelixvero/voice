import urllib.request
import json

url = 'https://api.groq.com/openai/v1/chat/completions'
data = {
    "model": "llama3-8b-8192",
    "messages": [{"role": "user", "content": "hi"}]
}
req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={
    'Authorization': 'Bearer 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',
    'Content-Type': 'application/json'
})

try:
    response = urllib.request.urlopen(req)
    print(response.read().decode('utf-8'))
except Exception as e:
    print(e)
