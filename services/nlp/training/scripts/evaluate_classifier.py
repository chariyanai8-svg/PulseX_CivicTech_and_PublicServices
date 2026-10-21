"""CivicPulse NLP Service — Evaluate Baseline Classifier.

This script loads the trained XLM-RoBERTa classifier and evaluates it
against the held-out test set, computing Accuracy, F1 scores, and a
confusion matrix.

Usage:
    python scripts/evaluate_classifier.py
"""

import json
import torch
from pathlib import Path
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sklearn.metrics import classification_report, confusion_matrix
from tqdm import tqdm

# Set paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_DIR = BASE_DIR / "models" / "classifier" / "v0.1.0"
TEST_FILE = BASE_DIR / "training" / "data" / "raw" / "test.jsonl"
REPORT_DIR = BASE_DIR / "training" / "checkpoints" / "classifier"

def main():
    print("=== CivicPulse: Classifier Evaluation Pipeline ===")
    
    # 1. Load test data
    if not TEST_FILE.exists():
        print(f"Error: Test file not found at {TEST_FILE}")
        return
        
    dataset = load_dataset("json", data_files={"test": str(TEST_FILE)})
    test_data = dataset["test"]
    print(f"Loaded {len(test_data)} test examples.")
    
    # 2. Load model and tokenizer
    print(f"\nLoading model from {MODEL_DIR}...")
    try:
        tokenizer = AutoTokenizer.from_pretrained(str(MODEL_DIR))
        model = AutoModelForSequenceClassification.from_pretrained(str(MODEL_DIR))
    except Exception as e:
        print(f"Failed to load model. Did you run train_classifier.py? Error: {e}")
        return
        
    # Automatically use GPU if available
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()

    # 3. Label Mapping (read directly from model config)
    id2label = {int(k): v for k, v in model.config.id2label.items()}
    label2id = {k: int(v) for k, v in model.config.label2id.items()}

    true_labels = []
    pred_labels = []
    
    # 4. Predict
    print(f"Running inference on test set ({device})...")
    with torch.no_grad():
        for example in tqdm(test_data, desc="Evaluating"):
            text = example["text"]
            true_category = example["category"]
            
            # Tokenize input
            inputs = tokenizer(
                text, 
                return_tensors="pt", 
                truncation=True, 
                max_length=128
            ).to(device)
            
            # Forward pass
            outputs = model(**inputs)
            logits = outputs.logits
            pred_id = torch.argmax(logits, dim=-1).item()
            
            # Map back to string category
            pred_category = id2label[pred_id]
            
            true_labels.append(true_category)
            pred_labels.append(pred_category)
            
    # 5. Evaluate Metrics
    print("\n\n" + "="*50)
    print("--- Classification Report ---")
    
    # Extract labels in a deterministic order for the report
    # We sort by category name for easier reading
    labels_list = sorted(list(label2id.keys()))
    
    report = classification_report(
        true_labels, 
        pred_labels, 
        target_names=labels_list, 
        labels=labels_list, 
        zero_division=0
    )
    print(report)
    
    print("--- Confusion Matrix ---")
    cm = confusion_matrix(true_labels, pred_labels, labels=labels_list)
    print(cm)
    print("="*50)
    
    # 6. Save Report
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report_path = REPORT_DIR / "evaluation_report.txt"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("=== Classification Report ===\n")
        f.write(report)
        f.write("\n\n=== Confusion Matrix ===\n")
        f.write(str(cm))
        f.write(f"\nLabels order: {labels_list}\n")
        
    print(f"\nReport saved to: {report_path}")

if __name__ == "__main__":
    main()
