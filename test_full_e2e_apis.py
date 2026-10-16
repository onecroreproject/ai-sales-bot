import urllib.request
import json
import ssl
import time
import uuid

BASE_URL = "https://aichat.dlksoftwaresolutions.co.in"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def make_request(method, path, body=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"User-Agent": "Mozilla/5.0"}
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
            content = resp.read().decode("utf-8")
            try:
                parsed = json.loads(content)
            except Exception:
                parsed = content
            return resp.status, parsed
    except urllib.error.HTTPError as e:
        err_content = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_content)
        except Exception:
            err_json = err_content
        return e.code, err_json
    except Exception as e:
        return 0, str(e)

results = []

def run_test(category, name, method, path, body=None, token=None, expected_status=200):
    status, resp = make_request(method, path, body=body, token=token)
    passed = (status == expected_status)
    results.append({
        "category": category,
        "name": name,
        "method": method,
        "path": path,
        "status": status,
        "expected": expected_status,
        "passed": passed,
        "response": resp
    })
    print(f"[{'PASS' if passed else 'FAIL'}] {category} - {name} ({method} {path}) -> {status}")
    return status, resp

print("==================================================")
print("STARTING FULL END-TO-END PRODUCTION API TEST SUITE")
print("==================================================")

# 1. System / Public Health
run_test("System", "Root Health Check", "GET", "/")
run_test("System", "Database Health Check", "GET", "/health/database")
run_test("System", "Run Migrations Trigger", "GET", "/api/v1/run-migrations")
run_test("Widget", "Static Widget Script", "GET", "/static/widget.js")

# 2. Authentication - Login
status, login_res = run_test("Auth", "Admin Sign In", "POST", "/api/v1/auth/login", 
                             {"email": "admin@test.com", "password": "password123"}, expected_status=200)
token = login_res.get("access_token") if isinstance(login_res, dict) else None

status, super_login = run_test("Auth", "SuperAdmin Sign In", "POST", "/api/v1/auth/login", 
                               {"email": "superadmin@platform.com", "password": "adminpass123"}, expected_status=200)

run_test("Auth", "Invalid Password Check", "POST", "/api/v1/auth/login", 
         {"email": "admin@test.com", "password": "wrongpassword!"}, expected_status=401)

# 3. Registration Flow
unique_id = uuid.uuid4().hex[:6]
reg_email = f"lead_{unique_id}@testcompany.com"
comp_name = f"AutoTest Company {unique_id}"

# Register company
status, comp_res = run_test("Registration", "Create Workspace Company", "POST", "/api/v1/companies/", 
                            {"name": comp_name, "website": "https://autotest.com", "description": "Automated API Test Workspace"}, 
                            expected_status=200)
new_comp_id = comp_res.get("id") if isinstance(comp_res, dict) else 1

# Register User
status, reg_user_res = run_test("Registration", "Register Workspace User", "POST", "/api/v1/auth/register", 
                                {"company_id": new_comp_id, "email": reg_email, "password": "TestPassword123!"}, 
                                expected_status=200)

# 4. Email Verification & Password Recovery
run_test("Auth Email", "Forgot Password Flow", "POST", "/api/v1/auth/forgot-password", 
         {"email": reg_email}, expected_status=200)

run_test("Auth Email", "Resend Verification Email Flow", "POST", "/api/v1/auth/resend-verification", 
         {"email": reg_email}, expected_status=200)

run_test("Auth Email", "Verify Email with Invalid Token Check", "GET", "/api/v1/auth/verify-email?token=invalid_dummy_token", 
         expected_status=400)

run_test("Auth Email", "Reset Password with Invalid Token Check", "POST", "/api/v1/auth/reset-password", 
         {"token": "invalid_reset_token", "new_password": "NewStrongPass123!"}, expected_status=400)

# 5. Authenticated Endpoints (Using Admin Token)
if token:
    status, user_me = run_test("User Profile", "Get Current User Profile (/auth/me)", "GET", "/api/v1/auth/me", token=token)
    user_comp_id = user_me.get("company_id", 1) if isinstance(user_me, dict) else 1

    run_test("Company Profile", "Get My Company (/companies/me)", "GET", "/api/v1/companies/me", token=token)
    run_test("Dashboard", "Get Dashboard Summary Stats", "GET", "/api/v1/dashboard/stats", token=token)
    
    # Products (using exact non-trailing slash path /api/v1/products)
    prod_name = f"Test Bot {unique_id}"
    status, prod_res = run_test("Products", "List Products", "GET", "/api/v1/products", token=token)
    status, new_prod = run_test("Products", "Create New Product", "POST", "/api/v1/products", 
                                {"company_id": user_comp_id, "name": prod_name, "description": "AI conversational assistant", "price": 49.99, "features": "24/7 lead qualification", "target_customer": "B2B SaaS"}, 
                                token=token, expected_status=200)
    new_prod_id = new_prod.get("id") if isinstance(new_prod, dict) else None
    if new_prod_id:
        run_test("Products", "Update Product", "PUT", f"/api/v1/products/{new_prod_id}", 
                 {"name": f"{prod_name} Updated", "price": 59.99}, token=token)
        run_test("Products", "Delete Product", "DELETE", f"/api/v1/products/{new_prod_id}", token=token)

    # Knowledge Base
    status, kb_res = run_test("Knowledge Base", "List Knowledge Entries", "GET", "/api/v1/knowledge/", token=token)
    
    # Leads CRM (passing company_id query parameter)
    run_test("CRM Leads", "List Captured Leads", "GET", f"/api/v1/leads?company_id={user_comp_id}", token=token)

    # Widget Management
    status, w_res = run_test("Widget Config", "Get Widget Settings & Site Key", "GET", "/api/v1/widget/config", token=token)
    site_key = w_res.get("site_key") if isinstance(w_res, dict) else None

    # Public Widget Endpoints (exact paths /public/config/{site_key} and /public/chat)
    if site_key:
        run_test("Public Widget", "Get Public Config via Site Key", "GET", f"/api/v1/widget/public/config/{site_key}")
        run_test("Public Widget", "Send Chat Message from Widget", "POST", "/api/v1/widget/public/chat", 
                 {"site_key": site_key, "session_id": f"test_session_{unique_id}", "message": "Hi, what products do you offer?"}, 
                 expected_status=200)

    # Logout
    run_test("Auth", "Logout User", "POST", "/api/v1/auth/logout", token=token)

with open("e2e_api_report.json", "w") as f:
    json.dump(results, f, indent=2)

passed_count = sum(1 for r in results if r['passed'])
total_count = len(results)
print("\n==================================================")
print(f"FINAL RESULT: {passed_count}/{total_count} TESTS PASSED")
print("==================================================")
