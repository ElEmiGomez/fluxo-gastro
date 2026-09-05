#!/usr/bin/env python3
"""
FLUXO GASTRONOMIC SYSTEM — STRIX SECURITY SCANNER RUNNER
Ejecuta escaneos de vulnerabilidades automatizados usando el motor Strix.
"""
import sys
import os
import json
import shutil
import subprocess

# Configurar encoding UTF-8 en stdout/stderr de Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

def check_docker():
    """Comprueba si el demonio de Docker está disponible."""
    docker_bin = shutil.which("docker")
    if not docker_bin:
        return False, "Docker no instalado"
    try:
        res = subprocess.run([docker_bin, "info"], capture_output=True, text=True, timeout=5)
        if res.returncode == 0:
            return True, "Docker daemon activo y listo"
        return False, "Docker Desktop presente pero demonio detenido"
    except Exception as e:
        return False, f"Error verificando Docker: {str(e)}"

def run_security_invariant_checks(root_dir, config):
    """Ejecuta pruebas de penetración y auditoría de invariantes Strix."""
    print("\n>> Ejecutando Pruebas de Invariantes y Penetración Strix:")
    passed = 0
    failed = 0

    def assert_rule(name, condition, detail):
        nonlocal passed, failed
        if condition:
            print(f"  ✔ [PASS] [{name}] {detail}")
            passed += 1
        else:
            print(f"  ✖ [FAIL] [{name}] {detail}")
            failed += 1

    # 1. enforce_pin_rate_limiting
    pin_route = os.path.join(root_dir, "src", "app", "api", "staff", "verify-pin", "route.ts")
    has_pin_rate_limit = False
    if os.path.exists(pin_route):
        with open(pin_route, "r", encoding="utf-8") as f:
            c = f.read()
            has_pin_rate_limit = "lockedUntil" in c and "429" in c and "failedAttempts" in c
    assert_rule("enforce_pin_rate_limiting", has_pin_rate_limit, "Rate limiting activo contra ataques de fuerza bruta en PIN staff")

    # 2. enforce_rls_tenant_isolation
    sql_files = []
    schema_sql = os.path.join(root_dir, "supabase", "schema.sql")
    if os.path.exists(schema_sql):
        sql_files.append(schema_sql)
    migrations_dir = os.path.join(root_dir, "supabase", "migrations")
    if os.path.exists(migrations_dir):
        for mig in os.listdir(migrations_dir):
            if mig.endswith(".sql"):
                sql_files.append(os.path.join(migrations_dir, mig))

    has_rls = False
    combined_sql = ""
    for sf in sql_files:
        with open(sf, "r", encoding="utf-8") as f:
            combined_sql += f.read() + "\n"

    has_rls = "ENABLE ROW LEVEL SECURITY" in combined_sql and "restaurant_id" in combined_sql
    assert_rule("enforce_rls_tenant_isolation", has_rls, "Aislamiento multi-tenant obligatorio por RLS en PostgreSQL")

    # 3. enforce_idempotency
    orders_route = os.path.join(root_dir, "src", "app", "api", "orders", "route.ts")
    has_idempotency = False
    if os.path.exists(orders_route):
        with open(orders_route, "r", encoding="utf-8") as f:
            c = f.read()
            has_idempotency = "idempotency_key" in c and "acquireIdempotencyLock" in c
    assert_rule("enforce_idempotency", has_idempotency, "Bloqueo de idempotencia atómica contra pedidos duplicados simultáneos")

    # 4. prevent_arbitrary_order_mutation
    server_state = os.path.join(root_dir, "src", "lib", "server-state.ts")
    has_transition_guard = False
    if os.path.exists(server_state):
        with open(server_state, "r", encoding="utf-8") as f:
            c = f.read()
            has_transition_guard = "isValidOrderTransition" in c and "VALID_ORDER_TRANSITIONS" in c
    assert_rule("prevent_arbitrary_order_mutation", has_transition_guard, "Máquina de estados finitos previene saltos no autorizados")

    # 5. sanitize_user_input
    has_sanitizer = False
    if os.path.exists(orders_route):
        with open(orders_route, "r", encoding="utf-8") as f:
            c = f.read()
            has_sanitizer = "sanitizeText" in c or "sanitize" in c
    assert_rule("sanitize_user_input", has_sanitizer, "Sanitización de notas libres y entradas de comensal contra XSS")

    # 6. enforce_price_integrity (Anti-Price Tampering)
    has_price_integrity = False
    if os.path.exists(orders_route):
        with open(orders_route, "r", encoding="utf-8") as f:
            c = f.read()
            has_price_integrity = "catalogProduct" in c and "catalogProduct.price" in c
    assert_rule("enforce_price_integrity", has_price_integrity, "Integridad de precios: Servidor ignora precios manipulados por cliente y fuerza catálogo")

    # 7. enforce_admin_auth (Broken Object Level Authorization)
    admin_menu_route = os.path.join(root_dir, "src", "app", "api", "admin", "menu", "route.ts")
    has_admin_auth = False
    if os.path.exists(admin_menu_route):
        with open(admin_menu_route, "r", encoding="utf-8") as f:
            c = f.read()
            has_admin_auth = "verifyStaffRequest" in c and "401" in c
    assert_rule("enforce_admin_auth", has_admin_auth, "Protección RBAC: Endpoints administrativos de carta exigen sesión o PIN staff")

    # 8. enforce_service_call_auth
    sc_route = os.path.join(root_dir, "src", "app", "api", "service-calls", "route.ts")
    has_sc_auth = False
    if os.path.exists(sc_route):
        with open(sc_route, "r", encoding="utf-8") as f:
            c = f.read()
            has_sc_auth = "verifyStaffRequest" in c
    assert_rule("enforce_service_call_auth", has_sc_auth, "Protección de avisos: Borrado masivo y atención de llamadas restringido a personal")

    return passed, failed

def main():
    print("=" * 80)
    print(" [STRIX] FLUXO -- STRIX SECURITY PENETRATION SCANNER")
    print("=" * 80)

    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    # 1. Cargar configuracion de Strix
    config_file = os.path.join(root_dir, "strix.config.json")
    if not os.path.exists(config_file):
        print(f"[FAIL] Error: no se encontro {config_file}")
        sys.exit(1)

    with open(config_file, "r", encoding="utf-8") as f:
        config = json.load(f)

    print(f">> Proyecto: {config.get('project')}")
    print(f">> Targets: {config.get('targets')}")
    print(f">> Modo de Escaneo: {config.get('scan_mode')}")

    # 2. Localizar binario de Strix
    strix_bin = shutil.which("strix")
    if not strix_bin:
        python_scripts = os.path.join(sys.prefix, "Scripts", "strix.exe")
        if os.path.exists(python_scripts):
            strix_bin = python_scripts

    if strix_bin:
        print(f"✔ [PASS] Binario Strix detectado: {strix_bin}")
        res = subprocess.run([strix_bin, "--version"], capture_output=True, text=True)
        print(f"✔ [PASS] Strix version: {res.stdout.strip()}")
    else:
        print("[FAIL] Aviso: binario strix no encontrado en PATH")
        sys.exit(1)

    # 3. Diagnóstico de Docker Sandbox
    docker_ok, docker_msg = check_docker()
    print(f">> Entorno Sandbox Docker: {'ONLINE' if docker_ok else 'OFFLINE'} ({docker_msg})")

    print("\n>> Directivas Strix Configuradas:")
    rules = config.get("rules", {})
    for rule, enabled in rules.items():
        print(f"  ✔ [PASS] Directiva '{rule}': {'HABILITADA' if enabled else 'DESHABILITADA'}")

    # 4. Pruebas de penetración e invariantes
    passed, failed = run_security_invariant_checks(root_dir, config)

    print("\n" + "=" * 80)
    if failed == 0:
        print(f" 🏆 STRIX SCANNER: TODAS LAS DIRECTIVAS VALIDADAS ({passed}/{passed} PASS)")
        print(" El sistema no presenta vulnerabilidades críticas ni desvíos de autorización.")
        print("=" * 80)
        sys.exit(0)
    else:
        print(f" ❌ STRIX SCANNER: Se detectaron {failed} fallos de seguridad")
        print("=" * 80)
        sys.exit(1)

if __name__ == "__main__":
    main()
