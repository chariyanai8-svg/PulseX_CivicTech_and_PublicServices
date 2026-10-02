"""CivicPulse NLP Service — Train Baseline Classifier.

This script fine-tunes XLM-RoBERTa on the custom classification dataset
to categorize civic issues into 11 predefined categories.

Usage:
    # Full training (can take a while without GPU):
    python scripts/train_classifier.py
    
    # Fast dev run (tests the pipeline on a tiny subset):
    python scripts/train_classifier.py --dev
"""

import argparse
import json
import os
from pathlib import Path

import torch
from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    DataCollatorWithPadding
)

# Set paths relative to the script location
BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_NAME = "xlm-roberta-base"
OUTPUT_DIR = BASE_DIR / "models" / "classifier" / "v0.1.0"
CHECKPOINT_DIR = BASE_DIR / "training" / "checkpoints" / "classifier"


def main():
    parser = argparse.ArgumentParser(
        description="Train civic category classifier.")
    parser.add_argument("--dev", action="store_true",
                        help="Run a fast test on 30 samples.")
    parser.add_argument("--epochs", type=int, default=3,
                        help="Number of training epochs.")
    parser.add_argument("--batch-size", type=int, default=8,
                        help="Batch size per device.")
    args = parser.parse_args()

    print("=== CivicPulse: Classifier Training Pipeline ===")

    # 1. Load label maps (created in Step 3)
    map_path = BASE_DIR / "training" / "data" / "annotations" / "label_maps.json"
    with open(map_path, "r", encoding="utf-8") as f:
        maps = json.load(f)

    label2id = {v: int(k) for k, v in maps["categories"].items()}
    id2label = {int(k): v for k, v in maps["categories"].items()}
    num_labels = len(label2id)

    print(f"Loaded {num_labels} categories from label map.")

    # 2. Load dataset
    data_files = {
        "train": str(BASE_DIR / "training" / "data" / "raw" / "train.jsonl"),
        "val": str(BASE_DIR / "training" / "data" / "raw" / "val.jsonl")
    }

    # HuggingFace datasets library makes it easy to load JSONL files
    dataset = load_dataset("json", data_files=data_files)

    if args.dev:
        print(
            "\n[DEV MODE] Subsampling dataset to 30 training / 10 validation examples.")
        dataset["train"] = dataset["train"].select(range(30))
        dataset["val"] = dataset["val"].select(range(10))
        args.epochs = 1

    # 3. Load Tokenizer & Model
    print(f"\nLoading base model: {MODEL_NAME} ...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=num_labels,
        id2label=id2label,
        label2id=label2id
    )

    # 4. Tokenization function
    def tokenize_function(examples):
        # Tokenize the text, but let the data collator handle dynamic padding
        tokens = tokenizer(
            examples["text"],
            padding=False,
            truncation=True,
            max_length=128
        )
        # Map string categories to their integer IDs
        tokens["label"] = [label2id[c] for c in examples["category"]]
        return tokens

    print("Tokenizing datasets...")
    tokenized_datasets = dataset.map(tokenize_function, batched=True)

    # Data collator dynamically pads batches to the longest sequence in the batch
    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

    # 5. Training Arguments
    print("\nConfiguring Trainer...")
    training_args = TrainingArguments(
        output_dir=str(CHECKPOINT_DIR),
        eval_strategy="epoch",
        save_strategy="epoch",
        learning_rate=2e-5,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        num_train_epochs=args.epochs,
        weight_decay=0.01,
        load_best_model_at_end=True,
        push_to_hub=False,
        report_to="none",  # Disables wandb/tensorboard logging to keep console clean
        log_level="info",
        use_cpu=not torch.cuda.is_available()  # Fallback to CPU if no GPU
    )

    # 6. Initialize Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_datasets["train"],
        eval_dataset=tokenized_datasets["val"],
        processing_class=tokenizer,
        data_collator=data_collator,
    )

    # 7. Start Training
    print("\nStarting fine-tuning...")
    trainer.train()

    # 8. Save Final Model
    print(f"\nSaving fine-tuned model to: {OUTPUT_DIR}")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    trainer.save_model(str(OUTPUT_DIR))

    # Also save a dummy metrics file for demonstration
    metrics = {"status": "trained",
               "base_model": MODEL_NAME, "epochs": args.epochs}
    with open(OUTPUT_DIR / "training_metrics.json", "w") as f:
        json.dump(metrics, f)

    print("\nTraining complete! Baseline classifier is ready.")


if __name__ == "__main__":
    main()
