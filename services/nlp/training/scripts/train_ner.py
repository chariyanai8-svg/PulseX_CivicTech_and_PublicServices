"""CivicPulse NLP Service — Train NER Model.

This script fine-tunes XLM-RoBERTa for Token Classification to extract
Issue, Location, Severity, Timing, and Symptom entities using BIO tags.

Usage:
    # Full training:
    python scripts/train_ner.py
    
    # Fast dev run:
    python scripts/train_ner.py --dev
"""

import argparse
import json
import os
from pathlib import Path
import numpy as np

import torch
from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    TrainingArguments,
    Trainer,
    DataCollatorForTokenClassification
)
from seqeval.metrics import accuracy_score, f1_score, precision_score, recall_score

# Set paths relative to script
BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_NAME = "xlm-roberta-base"
OUTPUT_DIR = BASE_DIR / "models" / "ner" / "v0.1.0"
CHECKPOINT_DIR = BASE_DIR / "training" / "checkpoints" / "ner"


def main():
    parser = argparse.ArgumentParser(description="Train civic NER extractor.")
    parser.add_argument("--dev", action="store_true", help="Run a fast test on 20 samples.")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs.")
    parser.add_argument("--batch-size", type=int, default=8, help="Batch size per device.")
    args = parser.parse_args()

    print("=== CivicPulse: NER Training Pipeline ===")

    # 1. Load label maps
    map_path = BASE_DIR / "training" / "data" / "annotations" / "label_maps.json"
    with open(map_path, "r", encoding="utf-8") as f:
        maps = json.load(f)
        
    label2id = {v: int(k) for k, v in maps["ner_tags"].items()}
    id2label = {int(k): v for k, v in maps["ner_tags"].items()}
    label_list = [id2label[i] for i in range(len(id2label))]
    num_labels = len(label_list)
    
    print(f"Loaded {num_labels} NER tags.")

    # 2. Load dataset
    data_files = {
        "train": str(BASE_DIR / "training" / "data" / "raw" / "ner_train.jsonl"),
        "val": str(BASE_DIR / "training" / "data" / "raw" / "ner_val.jsonl")
    }
    dataset = load_dataset("json", data_files=data_files)

    if args.dev:
        print("\n[DEV MODE] Subsampling dataset to 20 training / 5 validation examples.")
        dataset["train"] = dataset["train"].select(range(20))
        dataset["val"] = dataset["val"].select(range(5))
        args.epochs = 1

    # 3. Load Tokenizer & Model
    print(f"\nLoading base model: {MODEL_NAME} ...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, add_prefix_space=True)
    
    model = AutoModelForTokenClassification.from_pretrained(
        MODEL_NAME, 
        num_labels=num_labels, 
        id2label=id2label, 
        label2id=label2id
    )

    # 4. Tokenization and Label Alignment
    # XLM-R uses Byte-Pair Encoding which splits words into subwords.
    # We must align our word-level BIO tags to these subwords.
    def tokenize_and_align_labels(examples):
        tokenized_inputs = tokenizer(
            examples["tokens"], 
            truncation=True, 
            is_split_into_words=True, 
            max_length=128
        )
        labels = []
        for i, label in enumerate(examples["ner_tags"]):
            word_ids = tokenized_inputs.word_ids(batch_index=i)
            previous_word_idx = None
            label_ids = []
            for word_idx in word_ids:
                # Special tokens get a label of -100 so they are ignored in the loss
                if word_idx is None:
                    label_ids.append(-100)
                # Set the label for the first subword of each word
                elif word_idx != previous_word_idx:
                    label_ids.append(label2id[label[word_idx]])
                # For subsequent subwords, we ignore them in the loss (-100)
                else:
                    label_ids.append(-100)
                previous_word_idx = word_idx
            labels.append(label_ids)
        tokenized_inputs["labels"] = labels
        return tokenized_inputs

    print("Tokenizing and aligning BIO tags...")
    tokenized_datasets = dataset.map(tokenize_and_align_labels, batched=True)
    
    data_collator = DataCollatorForTokenClassification(tokenizer)

    # 5. Define Evaluation Metrics using SeqEval
    def compute_metrics(p):
        predictions, labels = p
        predictions = np.argmax(predictions, axis=2)
        
        # Remove ignored index (special tokens)
        true_predictions = [
            [label_list[p] for (p, l) in zip(prediction, label) if l != -100]
            for prediction, label in zip(predictions, labels)
        ]
        true_labels = [
            [label_list[l] for (p, l) in zip(prediction, label) if l != -100]
            for prediction, label in zip(predictions, labels)
        ]
        
        return {
            "precision": precision_score(true_labels, true_predictions),
            "recall": recall_score(true_labels, true_predictions),
            "f1": f1_score(true_labels, true_predictions),
            "accuracy": accuracy_score(true_labels, true_predictions),
        }

    # 6. Training Arguments
    print("\nConfiguring Trainer...")
    training_args = TrainingArguments(
        output_dir=str(CHECKPOINT_DIR),
        eval_strategy="epoch",
        learning_rate=2e-5,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        num_train_epochs=args.epochs,
        weight_decay=0.01,
        report_to="none",
        log_level="info",
        use_cpu=not torch.cuda.is_available()
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_datasets["train"],
        eval_dataset=tokenized_datasets["val"],
        processing_class=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics
    )

    # 7. Start Training
    print("\nStarting fine-tuning...")
    trainer.train()

    # 8. Save Final Model
    print(f"\nSaving fine-tuned NER model to: {OUTPUT_DIR}")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    trainer.save_model(str(OUTPUT_DIR))
    
    # Save a dummy metrics file
    metrics = {"status": "trained", "base_model": MODEL_NAME, "epochs": args.epochs, "type": "token-classification"}
    with open(OUTPUT_DIR / "training_metrics.json", "w") as f:
        json.dump(metrics, f)
        
    print("\nNER Training complete!")

if __name__ == "__main__":
    main()
