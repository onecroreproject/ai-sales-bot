import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# 1. Login as admin@test.com
url_login = 'https://aichat.dlksoftwaresolutions.co.in/api/v1/auth/login'
data = json.dumps({'email': 'admin@test.com', 'password': 'password123'}).encode('utf-8')
req = urllib.request.Request(url_login, data=data, headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'})
resp = urllib.request.urlopen(req, context=ctx)
res_json = json.loads(resp.read().decode())
token = res_json['access_token']
print("Got Token successfully")

# 2. Call /api/v1/companies/me
url_me = 'https://aichat.dlksoftwaresolutions.co.in/api/v1/companies/me'
req_me = urllib.request.Request(url_me, headers={
    'Authorization': f'Bearer {token}',
    'User-Agent': 'Mozilla/5.0'
})

try:
    with urllib.request.urlopen(req_me, context=ctx) as r:
        print("companies/me Status:", r.status)
        print("companies/me Body:", r.read().decode())
except urllib.error.HTTPError as e:
    print("companies/me HTTPError:", e.code)
    print("companies/me Error Body:", e.read().decode())
except Exception as e:
    print("Error:", e)
