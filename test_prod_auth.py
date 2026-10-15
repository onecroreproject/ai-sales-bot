import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def test_login(email, password):
    url = 'https://aichat.dlksoftwaresolutions.co.in/api/v1/auth/login'
    data = json.dumps({'email': email, 'password': password}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
            print(f"[{email}] Status: {resp.status}")
            print(f"[{email}] Body: {resp.read().decode()}")
    except urllib.error.HTTPError as e:
        print(f"[{email}] HTTPError: {e.code}")
        print(f"[{email}] Body: {e.read().decode()}")
    except Exception as e:
        print(f"[{email}] Error: {e}")

def test_migrations():
    url = 'https://aichat.dlksoftwaresolutions.co.in/api/v1/run-migrations'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
            print(f"[run-migrations] Status: {resp.status}")
            print(f"[run-migrations] Body: {resp.read().decode()}")
    except Exception as e:
        print(f"[run-migrations] Error: {e}")

print("=== CHECKING MIGRATIONS ENDPOINT ===")
test_migrations()

print("\n=== TESTING LOGINS ===")
test_login('admin@test.com', 'password123')
test_login('superadmin@platform.com', 'adminpass123')
