"""CivicPulse NLP Service — Comparative Evaluation: v0.1.0 vs v0.2.0

Evaluates both model versions side-by-side on unseen test cases covering
the key test prompts, entity boundaries, and classification categories.
"""

import sys
import json
from pathlib import Path
from transformers import pipeline

BASE_DIR = Path(__file__).resolve().parent.parent

# Test cases representing key issues
TEST_CASES = [
    {
        "id": "NER-Location-Collapse",
        "text": "Tolong baiki lampu jalan rosak teruk di Jalan SS2 semalam.",
        "expected_category": "LIGHTING",
        "description": "Checks NER boundary separation between action verb, issue, severity, location, timing"
    },
    {
        "id": "Classification-Obstruction",
        "text": "Kenderaan rosak ditinggalkan menghalang laluan keluar masuk lorong.",
        "expected_category": "OBSTRUCTION",
        "description": "Checks OBSTRUCTION vs HAZARD distinction when 'rosak' is present"
    },
    {
        "id": "Classification-Other-Signboard",
        "text": "Permohonan semakan papan tanda nama taman yang telah pudar.",
        "expected_category": "OTHER",
        "description": "Checks OTHER vs FALLEN_TREES distinction when 'taman' is present"
    },
    {
        "id": "English-Roads",
        "text": "There is a large pothole near the bus stop since Monday.",
        "expected_category": "ROADS",
        "description": "Checks English text entity extraction and road classification"
    },
    {
        "id": "Mixed-CodeSwitch-Lighting",
        "text": "Streetlight dekat school dah rosak sejak minggu lepas, bahaya sangat.",
        "expected_category": "LIGHTING",
        "description": "Checks mixed-language code-switching handling"
    }
]


def extract_entities(ner_pipe, text):
    results = ner_pipe(text)
    entities = {"issue": [], "location": [], "severity": [], "timing": [], "symptom": []}
    for ent in results:
        group = ent["entity_group"].lower()
        word = " ".join(ent["word"].replace("\u2581", " ").split())
        if group in entities and word:
            entities[group].append(word)
    return entities


def evaluate_version(ner_path: Path, cls_path: Path, label: str):
    print(f"\n==========================================")
    print(f" Loading models for: {label}")
    print(f" NER: {ner_path}")
    print(f" Classifier: {cls_path}")
    print(f"==========================================")

    if not ner_path.exists():
        print(f"ERROR: NER path {ner_path} does not exist!")
        return None
    if not cls_path.exists():
        print(f"ERROR: Classifier path {cls_path} does not exist!")
        return None

    ner_pipe = pipeline("token-classification", model=str(ner_path), tokenizer=str(ner_path), aggregation_strategy="simple")
    cls_pipe = pipeline("text-classification", model=str(cls_path), tokenizer=str(cls_path))

    results = []
    for tc in TEST_CASES:
        text = tc["text"]
        cls_out = cls_pipe(text, truncation=True, max_length=512)[0]
        entities = extract_entities(ner_pipe, text)
        results.append({
            "id": tc["id"],
            "text": text,
            "expected_category": tc["expected_category"],
            "pred_category": cls_out["label"],
            "pred_score": round(float(cls_out["score"]), 4),
            "category_match": cls_out["label"] == tc["expected_category"],
            "entities": entities
        })
    return results


def main():
    ner_v01 = BASE_DIR / "models" / "ner" / "v0.1.0"
    cls_v01 = BASE_DIR / "models" / "classifier" / "v0.1.0"
    ner_v02 = BASE_DIR / "models" / "ner" / "v0.2.0"
    cls_v02 = BASE_DIR / "models" / "classifier" / "v0.2.0"

    print("Running CivicPulse Side-by-Side Model Evaluation...")
    res_v01 = evaluate_version(ner_v01, cls_v01, "v0.1.0 (Baseline)")
    res_v02 = evaluate_version(ner_v02, cls_v02, "v0.2.0 (Target)")

    if not res_v01 or not res_v02:
        print("Cannot produce side-by-side comparison until both versions exist.")
        return 1

    print("\n" + "="*80)
    print(" SIDE-BY-SIDE EVALUATION REPORT ")
    print("="*80)

    for r1, r2 in zip(res_v01, res_v02):
        print(f"\n--- [{r1['id']}] ---")
        print(f"Input Text: \"{r1['text']}\"")
        print(f"Expected Category: {r1['expected_category']}")
        print(f"  v0.1.0 Category: {r1['pred_category']} (conf: {r1['pred_score']:.4f}) [{'PASS' if r1['category_match'] else 'FAIL'}]")
        print(f"  v0.2.0 Category: {r2['pred_category']} (conf: {r2['pred_score']:.4f}) [{'PASS' if r2['category_match'] else 'FAIL'}]")
        print(f"  v0.1.0 Entities: {json.dumps(r1['entities'], ensure_ascii=False)}")
        print(f"  v0.2.0 Entities: {json.dumps(r2['entities'], ensure_ascii=False)}")

    # Summary
    v01_matches = sum(1 for r in res_v01 if r["category_match"])
    v02_matches = sum(1 for r in res_v02 if r["category_match"])
    print("\n" + "="*80)
    print(f"Category Accuracy on Test Prompts:")
    print(f"  v0.1.0: {v01_matches}/{len(TEST_CASES)} ({v01_matches/len(TEST_CASES)*100:.1f}%)")
    print(f"  v0.2.0: {v02_matches}/{len(TEST_CASES)} ({v02_matches/len(TEST_CASES)*100:.1f}%)")
    print("="*80)

    # Save to JSON
    report_file = BASE_DIR / "reports" / "evaluation_v01_vs_v02.json"
    report_file.parent.mkdir(parents=True, exist_ok=True)
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump({"v0.1.0": res_v01, "v0.2.0": res_v02}, f, indent=2, ensure_ascii=False)
    print(f"\nDetailed evaluation report saved to: {report_file}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
