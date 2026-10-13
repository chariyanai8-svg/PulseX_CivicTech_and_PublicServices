"""Script to start uvicorn live, test real HTTP requests, and exit."""
import subprocess
import time
import sys
import json
from pathlib import Path
import urllib.request
import urllib.error

def run_live_verification():
    print("Starting uvicorn server on port 8000...")
    python_exe = sys.executable
    cmd = [python_exe, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"]
    
    log_path = Path("server_live.log")
    log_file = open(log_path, "w", encoding="utf-8")
    proc = subprocess.Popen(cmd, stdout=log_file, stderr=subprocess.STDOUT, text=True)
    
    health_url = "http://127.0.0.1:8000/nlp/health"
    root_url = "http://127.0.0.1:8000/"
    analyze_url = "http://127.0.0.1:8000/nlp/analyze"
    
    server_ready = False
    start_time = time.time()
    
    try:
        print("Waiting for server to initialize and load models...")
        while time.time() - start_time < 180:
            if proc.poll() is not None:
                log_file.close()
                print("Server exited prematurely! Output:")
                print(log_path.read_text(encoding="utf-8", errors="replace"))
                return 1
            try:
                with urllib.request.urlopen(health_url, timeout=2) as resp:
                    if resp.status == 200:
                        server_ready = True
                        break
            except Exception:
                time.sleep(2)
                
        if not server_ready:
            log_file.close()
            print("Server timed out during startup! Last log output:")
            print(log_path.read_text(encoding="utf-8", errors="replace")[-2000:])
            return 1
            
        print("Server is up! Testing endpoints...")
        
        # 1. Test GET /nlp/health
        print("\n--- Testing GET /nlp/health ---")
        with urllib.request.urlopen(health_url, timeout=5) as resp:
            status = resp.status
            body = json.loads(resp.read().decode("utf-8"))
            print(f"Status: {status}")
            print(f"Body: {json.dumps(body, indent=2)}")
            assert body["status"] == "healthy", f"Expected healthy, got {body['status']}"
            assert body["models_loaded"] is True, f"Expected models_loaded True, got {body['models_loaded']}"
            assert body["model_version"] == "0.2.0", f"Expected 0.2.0, got {body['model_version']}"
            
        # 2. Test GET /
        print("\n--- Testing GET / ---")
        try:
            with urllib.request.urlopen(root_url, timeout=5) as resp:
                print(f"Unexpected status: {resp.status}")
        except urllib.error.HTTPError as e:
            body = json.loads(e.read().decode("utf-8"))
            print(f"Status: {e.code}")
            print(f"Body: {json.dumps(body, indent=2)}")
            assert e.code == 404, f"Expected 404, got {e.code}"
            
        # 3. Test POST /nlp/analyze
        print("\n--- Testing POST /nlp/analyze ---")
        payload = json.dumps({"text": "Tolong baiki lampu jalan rosak teruk di Jalan SS2 semalam."}).encode("utf-8")
        req = urllib.request.Request(analyze_url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=10) as resp:
            status = resp.status
            body = json.loads(resp.read().decode("utf-8"))
            print(f"Status: {status}")
            print(f"Body: {json.dumps(body, indent=2)}")
            assert body["category"] == "LIGHTING", f"Expected LIGHTING, got {body['category']}"
            assert any("SS2" in loc for loc in body["extracted_info"]["location"]), "Expected Jalan SS2 in location"
            
        print("\nAll live HTTP endpoint checks PASSED successfully!")
        return 0
        
    finally:
        print("\nTerminating server process...")
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
        log_file.close()
        print("Server process stopped.")

if __name__ == "__main__":
    sys.exit(run_live_verification())
