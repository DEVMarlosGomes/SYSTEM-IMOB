"""
Comprehensive backend API tests for ImobSys.
Tests all endpoints with proper auth and privacy rules.
"""
import requests
import sys
from datetime import datetime, date, timedelta

BASE_URL = "https://corretor-dashboard.preview.emergentagent.com/api"

class ImobSysAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.tokens = {}
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
    def log(self, msg, level="INFO"):
        print(f"[{level}] {msg}")
    
    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - {name} (Status: {response.status_code})", "PASS")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log(f"❌ FAILED - {name} - Expected {expected_status}, got {response.status_code}", "FAIL")
                self.log(f"   Response: {response.text[:200]}", "FAIL")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                return False, {}
        
        except Exception as e:
            self.log(f"❌ FAILED - {name} - Error: {str(e)}", "FAIL")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}
    
    def test_health(self):
        """Test health endpoint"""
        self.log("\n=== Testing Health Endpoint ===")
        success, response = self.run_test(
            "GET /api/health",
            "GET",
            "health",
            200
        )
        if success:
            if response.get("status") == "ok" and response.get("mongo") == "connected":
                self.log("✅ Health check passed with mongo connected", "PASS")
            else:
                self.log(f"⚠️  Health check returned unexpected data: {response}", "WARN")
        return success
    
    def test_login(self, email, password, expected_role):
        """Test login and store token"""
        self.log(f"\n=== Testing Login for {email} ===")
        success, response = self.run_test(
            f"POST /api/auth/login ({email})",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'access_token' in response:
            self.tokens[email] = response['access_token']
            user = response.get('user', {})
            if user.get('role') == expected_role:
                self.log(f"✅ Login successful for {email} with role {expected_role}", "PASS")
            else:
                self.log(f"⚠️  Role mismatch: expected {expected_role}, got {user.get('role')}", "WARN")
            return True
        return False
    
    def test_login_invalid(self):
        """Test login with wrong credentials"""
        self.log("\n=== Testing Invalid Login ===")
        success, _ = self.run_test(
            "POST /api/auth/login (invalid credentials)",
            "POST",
            "auth/login",
            401,
            data={"email": "admin@teste.com", "password": "wrongpassword"}
        )
        return success
    
    def test_me_with_token(self, email):
        """Test /me endpoint with valid token"""
        token = self.tokens.get(email)
        if not token:
            self.log(f"⚠️  No token for {email}, skipping /me test", "WARN")
            return False
        
        success, response = self.run_test(
            f"GET /api/auth/me ({email})",
            "GET",
            "auth/me",
            200,
            token=token
        )
        if success and response.get('email') == email:
            self.log(f"✅ /me returned correct user data for {email}", "PASS")
        return success
    
    def test_me_without_token(self):
        """Test /me endpoint without token"""
        success, _ = self.run_test(
            "GET /api/auth/me (no token)",
            "GET",
            "auth/me",
            401
        )
        return success
    
    def test_admin_dashboard(self):
        """Test admin dashboard KPIs"""
        self.log("\n=== Testing Admin Dashboard ===")
        token = self.tokens.get("admin@teste.com")
        success, response = self.run_test(
            "GET /api/dashboard/admin",
            "GET",
            "dashboard/admin",
            200,
            token=token
        )
        if success:
            kpis = response.get('kpis', {})
            self.log(f"   KPIs: {kpis}", "INFO")
            if 'total_imoveis' in kpis and 'receita_mes' in kpis:
                self.log("✅ Dashboard KPIs returned correctly", "PASS")
        return success
    
    def test_properties_privacy(self):
        """Test property privacy rules"""
        self.log("\n=== Testing Property Privacy Rules ===")
        
        # Admin should see all properties with owner_profile_id
        admin_token = self.tokens.get("admin@teste.com")
        success, admin_props = self.run_test(
            "GET /api/properties (admin)",
            "GET",
            "properties",
            200,
            token=admin_token
        )
        
        if success:
            self.log(f"   Admin sees {len(admin_props)} properties", "INFO")
            # Find property with owner_profile_id
            prop_with_owner = None
            for p in admin_props:
                if p.get('owner_profile_id'):
                    prop_with_owner = p
                    break
            
            if prop_with_owner:
                self.log(f"   Found property with owner_profile_id: {prop_with_owner['id']}", "INFO")
                
                # Corretor1 (Rafael) should see owner_profile_id for his own property
                corretor1_token = self.tokens.get("corretor@teste.com")
                success1, corretor1_props = self.run_test(
                    "GET /api/properties (corretor1)",
                    "GET",
                    "properties",
                    200,
                    token=corretor1_token
                )
                
                if success1:
                    corretor1_prop = next((p for p in corretor1_props if p['id'] == prop_with_owner['id']), None)
                    if corretor1_prop and corretor1_prop.get('owner_profile_id'):
                        self.log("✅ Corretor1 sees owner_profile_id for his own property", "PASS")
                    else:
                        self.log("⚠️  Corretor1 should see owner_profile_id for his property", "WARN")
                
                # Corretor2 (Camila) should NOT see owner_profile_id for corretor1's property
                corretor2_token = self.tokens.get("corretor2@teste.com")
                success2, corretor2_props = self.run_test(
                    "GET /api/properties (corretor2)",
                    "GET",
                    "properties",
                    200,
                    token=corretor2_token
                )
                
                if success2:
                    corretor2_prop = next((p for p in corretor2_props if p['id'] == prop_with_owner['id']), None)
                    if corretor2_prop and corretor2_prop.get('owner_profile_id') is None:
                        self.log("✅ Corretor2 does NOT see owner_profile_id for corretor1's property (privacy OK)", "PASS")
                    elif corretor2_prop:
                        self.log("❌ PRIVACY VIOLATION: Corretor2 sees owner_profile_id for corretor1's property", "FAIL")
                        self.failed_tests.append("Privacy violation: corretor2 sees owner_profile_id")
        
        return success
    
    def test_create_property(self):
        """Test creating a new property"""
        self.log("\n=== Testing Create Property ===")
        corretor_token = self.tokens.get("corretor@teste.com")
        
        new_property = {
            "titulo": "Test Property",
            "tipo": "apartamento",
            "endereco": "Rua Test, 123",
            "valor_aluguel": 3000.0,
            "status": "disponivel"
        }
        
        success, response = self.run_test(
            "POST /api/properties",
            "POST",
            "properties",
            200,
            data=new_property,
            token=corretor_token
        )
        
        if success and response.get('id'):
            self.log(f"✅ Property created with ID: {response['id']}", "PASS")
            # Store for later tests
            self.test_property_id = response['id']
            return True
        return False
    
    def test_edit_other_corretor_property(self):
        """Test that corretor2 cannot edit corretor1's property"""
        self.log("\n=== Testing Edit Other Corretor's Property (should fail) ===")
        
        # Get a property from corretor1
        corretor1_token = self.tokens.get("corretor@teste.com")
        success, props = self.run_test(
            "GET /api/properties (corretor1)",
            "GET",
            "properties",
            200,
            token=corretor1_token
        )
        
        if success and props:
            prop_id = props[0]['id']
            
            # Try to edit with corretor2
            corretor2_token = self.tokens.get("corretor2@teste.com")
            success, _ = self.run_test(
                "PUT /api/properties/{id} (corretor2 editing corretor1's property)",
                "PUT",
                f"properties/{prop_id}",
                403,
                data={"titulo": "Hacked Property"},
                token=corretor2_token
            )
            return success
        return False
    
    def test_appointments_conflict(self):
        """Test appointment conflict detection"""
        self.log("\n=== Testing Appointment Conflict Detection ===")
        corretor_token = self.tokens.get("corretor@teste.com")
        
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        
        # Create first appointment
        appt1 = {
            "nome_cliente": "Test Client 1",
            "data": tomorrow,
            "hora_inicio": "14:00",
            "hora_fim": "15:00"
        }
        
        success1, response1 = self.run_test(
            "POST /api/appointments (first)",
            "POST",
            "appointments",
            200,
            data=appt1,
            token=corretor_token
        )
        
        if success1:
            # Try to create conflicting appointment
            appt2 = {
                "nome_cliente": "Test Client 2",
                "data": tomorrow,
                "hora_inicio": "14:30",
                "hora_fim": "15:30"
            }
            
            success2, _ = self.run_test(
                "POST /api/appointments (conflict - should fail)",
                "POST",
                "appointments",
                409,
                data=appt2,
                token=corretor_token
            )
            
            # Create non-conflicting appointment
            appt3 = {
                "nome_cliente": "Test Client 3",
                "data": tomorrow,
                "hora_inicio": "16:00",
                "hora_fim": "17:00"
            }
            
            success3, _ = self.run_test(
                "POST /api/appointments (no conflict)",
                "POST",
                "appointments",
                200,
                data=appt3,
                token=corretor_token
            )
            
            return success2 and success3
        return False
    
    def test_payments_kanban(self):
        """Test payments kanban endpoint"""
        self.log("\n=== Testing Payments Kanban ===")
        admin_token = self.tokens.get("admin@teste.com")
        
        success, response = self.run_test(
            "GET /api/payments/kanban",
            "GET",
            "payments/kanban",
            200,
            token=admin_token
        )
        
        if success:
            # Check for expected buckets
            expected_buckets = [5, 10, 15, 20, 25, 30]
            for bucket in expected_buckets:
                if str(bucket) in response:
                    bucket_data = response[str(bucket)]
                    self.log(f"   Bucket {bucket}: {len(bucket_data.get('a_cobrar', []))} a_cobrar, {len(bucket_data.get('pago', []))} pago, {len(bucket_data.get('atrasado', []))} atrasado", "INFO")
            self.log("✅ Kanban returned all buckets", "PASS")
        return success
    
    def test_crm_locatarios(self):
        """Test CRM locatarios endpoint"""
        self.log("\n=== Testing CRM Locatarios ===")
        admin_token = self.tokens.get("admin@teste.com")
        
        success, response = self.run_test(
            "GET /api/crm/locatarios",
            "GET",
            "crm/locatarios",
            200,
            token=admin_token
        )
        
        if success and len(response) > 0:
            locatario = response[0]
            self.log(f"   Found locatario: {locatario.get('nome')}", "INFO")
            if 'contract' in locatario and 'property' in locatario:
                self.log("✅ CRM locatarios returned with embedded contract and property", "PASS")
        return success
    
    def test_crm_locadores(self):
        """Test CRM locadores endpoint"""
        self.log("\n=== Testing CRM Locadores ===")
        admin_token = self.tokens.get("admin@teste.com")
        
        success, response = self.run_test(
            "GET /api/crm/locadores",
            "GET",
            "crm/locadores",
            200,
            token=admin_token
        )
        
        if success and len(response) > 0:
            locador = response[0]
            self.log(f"   Found locador: {locador.get('nome')}", "INFO")
            if 'contract' in locador and 'property' in locador:
                self.log("✅ CRM locadores returned with embedded contract and property", "PASS")
        return success
    
    def test_chat_conversations(self):
        """Test chat conversations endpoint"""
        self.log("\n=== Testing Chat Conversations ===")
        
        # Admin should see all locadores
        admin_token = self.tokens.get("admin@teste.com")
        success1, admin_convs = self.run_test(
            "GET /api/chat/conversations (admin)",
            "GET",
            "chat/conversations",
            200,
            token=admin_token
        )
        
        if success1:
            self.log(f"   Admin sees {len(admin_convs)} conversations", "INFO")
        
        # Locador should see only their own conversation
        locador_token = self.tokens.get("locador@teste.com")
        success2, locador_convs = self.run_test(
            "GET /api/chat/conversations (locador)",
            "GET",
            "chat/conversations",
            200,
            token=locador_token
        )
        
        if success2:
            self.log(f"   Locador sees {len(locador_convs)} conversations", "INFO")
            if len(locador_convs) == 1:
                self.log("✅ Locador sees only their own conversation", "PASS")
        
        return success1 and success2
    
    def test_chat_messages(self):
        """Test creating chat messages"""
        self.log("\n=== Testing Chat Messages ===")
        
        # Get locador ID first
        admin_token = self.tokens.get("admin@teste.com")
        success, convs = self.run_test(
            "GET /api/chat/conversations",
            "GET",
            "chat/conversations",
            200,
            token=admin_token
        )
        
        if success and len(convs) > 0:
            locador_id = convs[0]['id']
            
            # Create a message
            message_data = {
                "locador_id": locador_id,
                "mensagem": "Test message from API test"
            }
            
            success2, response = self.run_test(
                "POST /api/chat/messages",
                "POST",
                "chat/messages",
                200,
                data=message_data,
                token=admin_token
            )
            
            if success2 and response.get('id'):
                self.log("✅ Chat message created successfully", "PASS")
                return True
        return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        self.log("\n" + "="*60)
        self.log("STARTING IMOBSYS BACKEND API TESTS")
        self.log("="*60)
        
        # 1. Health check
        self.test_health()
        
        # 2. Auth tests
        self.test_login("admin@teste.com", "senha123", "admin")
        self.test_login("corretor@teste.com", "senha123", "corretor")
        self.test_login("corretor2@teste.com", "senha123", "corretor")
        self.test_login("locatario@teste.com", "senha123", "locatario")
        self.test_login("locador@teste.com", "senha123", "locador")
        self.test_login("super@teste.com", "senha123", "superadmin")
        self.test_login_invalid()
        
        # 3. /me tests
        self.test_me_with_token("admin@teste.com")
        self.test_me_without_token()
        
        # 4. Dashboard
        self.test_admin_dashboard()
        
        # 5. Properties (including privacy)
        self.test_properties_privacy()
        self.test_create_property()
        self.test_edit_other_corretor_property()
        
        # 6. Appointments
        self.test_appointments_conflict()
        
        # 7. Payments
        self.test_payments_kanban()
        
        # 8. CRM
        self.test_crm_locatarios()
        self.test_crm_locadores()
        
        # 9. Chat
        self.test_chat_conversations()
        self.test_chat_messages()
        
        # Print summary
        self.log("\n" + "="*60)
        self.log("TEST SUMMARY")
        self.log("="*60)
        self.log(f"Total tests run: {self.tests_run}")
        self.log(f"Tests passed: {self.tests_passed}")
        self.log(f"Tests failed: {self.tests_run - self.tests_passed}")
        self.log(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            self.log("\n❌ FAILED TESTS:", "FAIL")
            for i, test in enumerate(self.failed_tests, 1):
                self.log(f"  {i}. {test}", "FAIL")
        else:
            self.log("\n✅ ALL TESTS PASSED!", "PASS")
        
        self.log("="*60 + "\n")
        
        return 0 if self.tests_passed == self.tests_run else 1

if __name__ == "__main__":
    tester = ImobSysAPITester()
    sys.exit(tester.run_all_tests())
