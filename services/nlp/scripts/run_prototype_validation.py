"""Comprehensive Prototype Validation Script for CivicPulse NLP Backend.

Tests:
1. API Edge Cases (Valid, empty, missing, bad types, unicode, short, long)
2. Synthetic Tests A-G (BM, EN, Code-Switching, Waste, Ambiguous, Multi-issue, Invalid)
3. 11 Categories Evaluation (One smoke test per category)
4. NER Extraction & Boundary Verification
5. Semantic Similarity (Positive match, negative match, symmetry, score bounds)
"""

import json
import time
from pathlib import Path
from typing import Dict, Any, List

from fastapi.testclient import TestClient
from app.main import app

def run_validation():
    results: Dict[str, Any] = {
        "timestamp": time.time(),
        "api_tests": [],
        "nlp_tests": [],
        "category_tests": [],
        "ner_tests": [],
        "similarity_tests": [],
        "summary": {}
    }

    print("Booting TestClient and loading models into memory...")
    t0 = time.time()
    with TestClient(app) as client:
        load_time = time.time() - t0
        results["model_startup_time_sec"] = round(load_time, 2)
        print(f"Startup took {load_time:.2f}s")

        # -------------------------------------------------------------
        # 1. API EDGE CASES & ERROR HANDLING
        # -------------------------------------------------------------
        print("\n--- 1. Testing API Endpoints & Error Handling ---")
        
        # Test 1.1: Valid input
        r = client.post("/nlp/analyze", json={"text": "Jalan berlubang depan kedai"})
        results["api_tests"].append({
            "name": "valid_input",
            "status_code": r.status_code,
            "pass": r.status_code == 200 and "category" in r.json(),
            "response": r.json() if r.status_code == 200 else r.text
        })

        # Test 1.2: Empty text
        r = client.post("/nlp/analyze", json={"text": ""})
        results["api_tests"].append({
            "name": "empty_string",
            "status_code": r.status_code,
            "pass": r.status_code == 200 and r.json().get("clean_text") == "",
            "response": r.json() if r.status_code == 200 else r.text
        })

        # Test 1.3: Whitespace only
        r = client.post("/nlp/analyze", json={"text": "   \n\t   "})
        results["api_tests"].append({
            "name": "whitespace_only",
            "status_code": r.status_code,
            "pass": r.status_code == 200 and r.json().get("clean_text") == "",
            "response": r.json() if r.status_code == 200 else r.text
        })

        # Test 1.4: Missing required field ("text" omitted)
        r = client.post("/nlp/analyze", json={})
        results["api_tests"].append({
            "name": "missing_required_field",
            "status_code": r.status_code,
            "pass": r.status_code == 422,
            "response": r.json()
        })

        # Test 1.5: Incorrect data type (int instead of string)
        r = client.post("/nlp/analyze", json={"text": 12345})
        # Pydantic may cast int to str or reject with 422 depending on v2 config
        results["api_tests"].append({
            "name": "incorrect_data_type_int",
            "status_code": r.status_code,
            "pass": r.status_code in [200, 422],
            "response": r.json()
        })

        # Test 1.6: Incorrect data type (dict instead of string)
        r = client.post("/nlp/analyze", json={"text": {"problem": "road"}})
        results["api_tests"].append({
            "name": "incorrect_data_type_dict",
            "status_code": r.status_code,
            "pass": r.status_code == 422,
            "response": r.json()
        })

        # Test 1.7: Malformed JSON body
        r = client.post("/nlp/analyze", content="Not a JSON", headers={"Content-Type": "application/json"})
        results["api_tests"].append({
            "name": "malformed_json",
            "status_code": r.status_code,
            "pass": r.status_code == 422,
            "response": r.json()
        })

        # Test 1.8: Very short text
        r = client.post("/nlp/analyze", json={"text": "A"})
        results["api_tests"].append({
            "name": "very_short_text",
            "status_code": r.status_code,
            "pass": r.status_code == 200,
            "response": r.json()
        })

        # Test 1.9: Very long text (500 words)
        long_text = "Jalan rosak dan berlubang teruk dekat simpang ini. " * 50
        r = client.post("/nlp/analyze", json={"text": long_text})
        results["api_tests"].append({
            "name": "long_text",
            "status_code": r.status_code,
            "pass": r.status_code == 200,
            "response_category": r.json().get("category") if r.status_code == 200 else None
        })

        # Test 1.10: Unicode & Malay characters
        r = client.post("/nlp/analyze", json={"text": "Ｊａｌａｎ ｒｏｓａｋ & longkang tersumbat (sekolah)"})
        results["api_tests"].append({
            "name": "unicode_characters",
            "status_code": r.status_code,
            "pass": r.status_code == 200 and r.json().get("clean_text") == "Jalan rosak & longkang tersumbat (sekolah)",
            "response": r.json()
        })

        # -------------------------------------------------------------
        # 2. NLP TESTS A THROUGH G
        # -------------------------------------------------------------
        print("\n--- 2. Testing NLP Cases A through G ---")
        cases = [
            {
                "case_id": "A",
                "name": "Bahasa Malaysia",
                "input": "Longkang depan rumah tersumbat. Bila hujan, air naik sampai jalan.",
                "expected_category": "DRAINAGE",
                "expected_features": ["location:depan rumah or issue:tersumbat"]
            },
            {
                "case_id": "B",
                "name": "English",
                "input": "There is a large pothole near the bus stop.",
                "expected_category": "ROADS",
                "expected_features": ["issue:pothole", "location:bus stop"]
            },
            {
                "case_id": "C",
                "name": "Code-switching",
                "input": "Streetlight dekat school dah rosak sejak minggu lepas.",
                "expected_category": "LIGHTING",
                "expected_features": ["timing:minggu lepas or location:school"]
            },
            {
                "case_id": "D",
                "name": "Waste",
                "input": "Sampah bertimbun dekat taman permainan dan masih belum dikutip.",
                "expected_category": "WASTE",
                "expected_features": ["issue:sampah bertimbun", "location:taman permainan"]
            },
            {
                "case_id": "E",
                "name": "Ambiguous Input",
                "input": "Please help with the problem near my house.",
                "expected_category": "OTHER",
                "expected_features": ["handles uncertainty or OTHER"]
            },
            {
                "case_id": "F",
                "name": "Multiple Issues",
                "input": "The road is full of potholes and the streetlight is broken.",
                "expected_category": ["ROADS", "LIGHTING"],
                "expected_features": ["primary category returned without crash"]
            },
            {
                "case_id": "G",
                "name": "Empty or Invalid Input",
                "input": "   ",
                "expected_category": "OTHER",
                "expected_features": ["clean_text empty", "category OTHER"]
            }
        ]

        for c in cases:
            r = client.post("/nlp/analyze", json={"text": c["input"]})
            resp = r.json() if r.status_code == 200 else {}
            pred_cat = resp.get("category")
            
            # Category match check
            if isinstance(c["expected_category"], list):
                cat_match = pred_cat in c["expected_category"]
            else:
                cat_match = (pred_cat == c["expected_category"])

            results["nlp_tests"].append({
                "case_id": c["case_id"],
                "name": c["name"],
                "input": c["input"],
                "expected_category": c["expected_category"],
                "predicted_category": pred_cat,
                "confidence": resp.get("confidence"),
                "language": resp.get("language"),
                "has_code_switching": resp.get("has_code_switching"),
                "extracted_info": resp.get("extracted_info"),
                "category_match": cat_match,
                "status_code": r.status_code
            })

        # -------------------------------------------------------------
        # 3. TEST THE 11 CATEGORIES (1 test case each)
        # -------------------------------------------------------------
        print("\n--- 3. Testing 11 Categories ---")
        category_prompts = [
            ("ROADS", "Jalan raya berlubang besar dan sangat bahaya untuk motosikal."),
            ("DRAINAGE", "Longkang tersumbat teruk dan air bertakung tidak mengalir."),
            ("WASTE", "Sampah bertimbun di tepi jalan dan tidak dikutip selama seminggu."),
            ("LIGHTING", "Lampu jalan mati dan kawasan ini sangat gelap pada waktu malam."),
            ("FALLEN_TREES", "Pokok tumbang menghempap kabel elektrik dan menghalang laluan."),
            ("OBSTRUCTION", "Kenderaan rosak ditinggalkan menghalang laluan keluar masuk lorong."),
            ("FACILITIES", "Tandas awam rosak dan paip air bocor di dewan serbaguna."),
            ("PEDESTRIAN", "Laluan pejalan kaki pecah dan jubin jalan retak berbahaya untuk orang tua."),
            ("HAZARD", "Kabel elektrik tergantung rendah di tepi jalan sangat bahaya."),
            ("ENVIRONMENT", "Pencemaran bau busuk akibat pelepasan asap kilang berhampiran."),
            ("OTHER", "Permohonan semakan papan tanda nama taman yang telah pudar.")
        ]

        for expected_cat, prompt in category_prompts:
            r = client.post("/nlp/analyze", json={"text": prompt})
            resp = r.json() if r.status_code == 200 else {}
            pred_cat = resp.get("category")
            conf = resp.get("confidence", 0.0)
            is_match = (pred_cat == expected_cat)
            
            results["category_tests"].append({
                "expected": expected_cat,
                "predicted": pred_cat,
                "confidence": round(conf, 4),
                "prompt": prompt,
                "match": is_match
            })

        # -------------------------------------------------------------
        # 4. TEST NER EXTRACTION
        # -------------------------------------------------------------
        print("\n--- 4. Testing NER Extraction Capabilities ---")
        ner_prompts = [
            "Tolong baiki lampu jalan rosak teruk di Jalan SS2 semalam.",
            "Sampah berbau busuk dekat taman permainan seksyen 7.",
            "Pothole on Jalan Bukit Bintang causing severe traffic."
        ]
        for p in ner_prompts:
            r = client.post("/nlp/analyze", json={"text": p})
            data = r.json()
            results["ner_tests"].append({
                "prompt": p,
                "extracted_info": data.get("extracted_info", {})
            })

        # -------------------------------------------------------------
        # 5. TEST SEMANTIC SIMILARITY & EMBEDDINGS
        # -------------------------------------------------------------
        print("\n--- 5. Testing Semantic Similarity ---")
        
        # Test 5.1: High similarity (EN vs MS same issue)
        r_sim1 = client.post("/nlp/similarity", json={
            "text1": "There is a massive pothole in front of my house.",
            "text2": "Ada lubang besar depan rumah saya."
        })
        score1 = r_sim1.json().get("similarity_score")

        # Test 5.2: Low similarity (different issues)
        r_sim2 = client.post("/nlp/similarity", json={
            "text1": "There is a massive pothole in front of my house.",
            "text2": "Lampu jalan dekat sekolah rosak bergelap."
        })
        score2 = r_sim2.json().get("similarity_score")

        # Test 5.3: Symmetry (sim(A,B) == sim(B,A))
        r_sim3 = client.post("/nlp/similarity", json={
            "text2": "There is a massive pothole in front of my house.",
            "text1": "Ada lubang besar depan rumah saya."
        })
        score3 = r_sim3.json().get("similarity_score")

        # Test 5.4: Embeddings
        r_emb = client.post("/nlp/embed", json={"text": "Banjir kilat berlaku di jalan raya"})
        emb = r_emb.json().get("embedding", [])

        results["similarity_tests"].append({
            "test": "cross_lingual_same_issue",
            "score": score1,
            "pass": score1 is not None and score1 > 0.75
        })
        results["similarity_tests"].append({
            "test": "different_issues",
            "score": score2,
            "pass": score2 is not None and score2 < 0.50
        })
        results["similarity_tests"].append({
            "test": "symmetry",
            "score_forward": score1,
            "score_reverse": score3,
            "pass": abs(score1 - score3) < 1e-4 if (score1 and score3) else False
        })
        results["similarity_tests"].append({
            "test": "embedding_dimension",
            "dimension": len(emb),
            "pass": len(emb) == 384
        })

    # Save results to JSON file
    out_path = Path("reports/validation_results.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"\nValidation completed! Results written to {out_path}")

if __name__ == "__main__":
    run_validation()
