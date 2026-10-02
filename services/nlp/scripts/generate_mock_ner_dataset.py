import json
import random
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DATA_DIR = BASE_DIR / "training" / "data" / "raw"

# We define varied sentence structures with pre-annotated BIO tags
TEMPLATES = [
    # --- English ---
    [("The", "O"), ("pothole", "B-ISSUE"), ("in", "O"), ("front", "B-LOCATION"), ("of", "I-LOCATION"), ("the", "I-LOCATION"), ("school", "I-LOCATION"), ("is", "O"), ("very", "B-SEVERITY"), ("dangerous", "I-SEVERITY")],
    [("Traffic", "B-ISSUE"), ("lights", "I-ISSUE"), ("are", "O"), ("broken", "B-ISSUE"), ("near", "B-LOCATION"), ("the", "I-LOCATION"), ("hospital", "I-LOCATION"), ("since", "B-TIMING"), ("yesterday", "I-TIMING")],
    [("Uncollected", "B-ISSUE"), ("rubbish", "I-ISSUE"), ("is", "O"), ("piling", "B-SYMPTOM"), ("up", "I-SYMPTOM"), ("behind", "B-LOCATION"), ("block", "I-LOCATION"), ("A", "I-LOCATION")],
    [("A", "O"), ("large", "O"), ("tree", "B-ISSUE"), ("fell", "I-ISSUE"), ("blocking", "B-SYMPTOM"), ("the", "I-SYMPTOM"), ("road", "I-SYMPTOM"), ("at", "O"), ("Jalan", "B-LOCATION"), ("Gasing", "I-LOCATION")],
    
    # --- Malay ---
    [("Jalan", "B-ISSUE"), ("berlubang", "I-ISSUE"), ("sangat", "B-SEVERITY"), ("teruk", "I-SEVERITY"), ("dekat", "B-LOCATION"), ("simpang", "I-LOCATION"), ("tiga", "I-LOCATION")],
    [("Longkang", "B-ISSUE"), ("tersumbat", "I-ISSUE"), ("bau", "B-SYMPTOM"), ("busuk", "I-SYMPTOM"), ("semenjak", "B-TIMING"), ("minggu", "I-TIMING"), ("lepas", "I-TIMING")],
    [("Lampu", "B-ISSUE"), ("jalan", "I-ISSUE"), ("tak", "O"), ("menyala", "B-ISSUE"), ("dari", "B-TIMING"), ("malam", "I-TIMING"), ("tadi", "I-TIMING"), ("bahaya", "B-SEVERITY")],
    [("Sisa", "B-ISSUE"), ("kimia", "I-ISSUE"), ("tumpah", "B-ISSUE"), ("di", "O"), ("kawasan", "B-LOCATION"), ("kilang", "I-LOCATION"), ("bau", "B-SYMPTOM"), ("sangat", "I-SYMPTOM"), ("kuat", "I-SYMPTOM")],
    
    # --- Mixed / Code-switching ---
    [("Streetlight", "B-ISSUE"), ("depan", "B-LOCATION"), ("mall", "I-LOCATION"), ("tak", "O"), ("function", "B-ISSUE"), ("everytime", "B-TIMING"), ("hujan", "I-TIMING")],
    [("Rubbish", "B-ISSUE"), ("bertimbun", "I-ISSUE"), ("kat", "O"), ("belakang", "B-LOCATION"), ("kedai", "I-LOCATION"), ("very", "B-SEVERITY"), ("smelly", "I-SEVERITY")],
    [("Pothole", "B-ISSUE"), ("besar", "B-SEVERITY"), ("gila", "I-SEVERITY"), ("near", "B-LOCATION"), ("KTM", "I-LOCATION"), ("station", "I-LOCATION"), ("tolong", "O"), ("fix", "O")],
    [("Drain", "B-ISSUE"), ("tersumbat", "I-ISSUE"), ("causing", "O"), ("banjir", "B-SYMPTOM"), ("teruk", "B-SEVERITY"), ("area", "B-LOCATION"), ("perumahan", "I-LOCATION")]
]

def generate_ner_dataset(num_samples=400):
    dataset = []
    
    for i in range(num_samples):
        # Pick a random template
        template = random.choice(TEMPLATES)
        
        # Extract parallel arrays
        tokens = [t[0] for t in template]
        tags = [t[1] for t in template]
        
        # Basic validation against schema requirements
        assert len(tokens) == len(tags), "Tokens and tags length mismatch"
        
        dataset.append({
            "text": " ".join(tokens),
            "tokens": tokens,
            "ner_tags": tags,
            "language": "mixed", # Defaulting to mixed for synthetic variety flag
            "source": "synthetic"
        })
        
    random.shuffle(dataset)
    return dataset

def main():
    print("Generating synthetic NER dataset...")
    
    # Generate 450 total samples
    data = generate_ner_dataset(450)
    
    # Split: 400 train, 50 val
    train_data = data[:400]
    val_data = data[400:]
    
    # Ensure output directory exists
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    with open(RAW_DATA_DIR / "ner_train.jsonl", "w", encoding="utf-8") as f:
        for item in train_data:
            f.write(json.dumps(item) + "\n")
            
    with open(RAW_DATA_DIR / "ner_val.jsonl", "w", encoding="utf-8") as f:
        for item in val_data:
            f.write(json.dumps(item) + "\n")
            
    print(f"Success! Generated {len(train_data)} train and {len(val_data)} val NER examples.")
    print(f"Saved to {RAW_DATA_DIR}")

if __name__ == "__main__":
    main()
