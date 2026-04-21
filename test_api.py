import urllib.request
import json

url = "https://api.groq.com/openai/v1/chat/completions"
data = {
    "model": "llama3-70b-8192",
    "messages": [{"role": "user", "content": "Hi"}]
}
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer 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"
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        print("SUCCESS:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code, e.read().decode('utf-8'))
except Exception as e:
    print("ERROR:", str(e))
