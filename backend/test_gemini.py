import google.generativeai as genai

API_KEY = "AIzaSyCm1oG5WShzax9GB37ox9QCTlXUqcv4-TE"

genai.configure(api_key=API_KEY)

model = genai.GenerativeModel("gemini-2.0-flash")

response = model.generate_content("Hello")

print(response.text)