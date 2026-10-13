import json
import random
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DATA_DIR = BASE_DIR / "training" / "data" / "raw"

# Diverse, realistic sentence structures with accurate BIO annotations
TEMPLATES = [
    # --- English ---
    [("The", "O"), ("pothole", "B-ISSUE"), ("in", "O"), ("front", "B-LOCATION"), ("of", "I-LOCATION"), ("the", "I-LOCATION"), ("school", "I-LOCATION"), ("is", "O"), ("very", "B-SEVERITY"), ("dangerous", "I-SEVERITY")],
    [("Traffic", "B-ISSUE"), ("lights", "I-ISSUE"), ("are", "O"), ("broken", "B-ISSUE"), ("near", "B-LOCATION"), ("the", "I-LOCATION"), ("hospital", "I-LOCATION"), ("since", "B-TIMING"), ("yesterday", "I-TIMING")],
    [("Uncollected", "B-ISSUE"), ("rubbish", "I-ISSUE"), ("is", "O"), ("piling", "B-SYMPTOM"), ("up", "I-SYMPTOM"), ("behind", "B-LOCATION"), ("block", "I-LOCATION"), ("A", "I-LOCATION")],
    [("A", "O"), ("large", "O"), ("tree", "B-ISSUE"), ("fell", "I-ISSUE"), ("blocking", "B-SYMPTOM"), ("the", "I-SYMPTOM"), ("road", "I-SYMPTOM"), ("at", "O"), ("Jalan", "B-LOCATION"), ("Gasing", "I-LOCATION")],
    [("There", "O"), ("is", "O"), ("a", "O"), ("large", "O"), ("pothole", "B-ISSUE"), ("near", "B-LOCATION"), ("the", "I-LOCATION"), ("bus", "I-LOCATION"), ("stop", "I-LOCATION"), ("since", "B-TIMING"), ("Monday", "I-TIMING")],
    [("Broken", "B-ISSUE"), ("water", "I-ISSUE"), ("pipe", "I-ISSUE"), ("leaking", "B-SYMPTOM"), ("badly", "B-SEVERITY"), ("at", "O"), ("Section", "B-LOCATION"), ("14", "I-LOCATION")],
    [("Please", "O"), ("fix", "O"), ("the", "O"), ("damaged", "B-SEVERITY"), ("sidewalk", "B-ISSUE"), ("near", "B-LOCATION"), ("KTM", "I-LOCATION"), ("station", "I-LOCATION")],
    [("Live", "B-SEVERITY"), ("electric", "B-ISSUE"), ("wire", "I-ISSUE"), ("hanging", "B-SYMPTOM"), ("low", "I-SYMPTOM"), ("near", "B-LOCATION"), ("primary", "I-LOCATION"), ("school", "I-LOCATION")],

    # --- Malay ---
    [("Jalan", "B-ISSUE"), ("berlubang", "I-ISSUE"), ("sangat", "B-SEVERITY"), ("teruk", "I-SEVERITY"), ("dekat", "B-LOCATION"), ("simpang", "I-LOCATION"), ("tiga", "I-LOCATION")],
    [("Longkang", "B-ISSUE"), ("tersumbat", "I-ISSUE"), ("bau", "B-SYMPTOM"), ("busuk", "I-SYMPTOM"), ("semenjak", "B-TIMING"), ("minggu", "I-TIMING"), ("lepas", "I-TIMING")],
    [("Lampu", "B-ISSUE"), ("jalan", "I-ISSUE"), ("tak", "O"), ("menyala", "B-ISSUE"), ("dari", "B-TIMING"), ("malam", "I-TIMING"), ("tadi", "I-TIMING"), ("bahaya", "B-SEVERITY")],
    [("Sisa", "B-ISSUE"), ("kimia", "I-ISSUE"), ("tumpah", "B-ISSUE"), ("di", "O"), ("kawasan", "B-LOCATION"), ("kilang", "I-LOCATION"), ("bau", "B-SYMPTOM"), ("sangat", "I-SYMPTOM"), ("kuat", "I-SYMPTOM")],
    [("Tolong", "O"), ("baiki", "O"), ("lampu", "B-ISSUE"), ("jalan", "I-ISSUE"), ("rosak", "B-SEVERITY"), ("teruk", "I-SEVERITY"), ("di", "O"), ("Jalan", "B-LOCATION"), ("SS2", "I-LOCATION"), ("semalam", "B-TIMING")],
    [("Sampah", "B-ISSUE"), ("bertimbun", "I-ISSUE"), ("sangat", "B-SEVERITY"), ("busuk", "I-SEVERITY"), ("dekat", "B-LOCATION"), ("taman", "I-LOCATION"), ("permainan", "I-LOCATION"), ("seksyen", "I-LOCATION"), ("7", "I-LOCATION")],
    [("Pokok", "B-ISSUE"), ("tumbang", "I-ISSUE"), ("menghalang", "B-SYMPTOM"), ("laluan", "I-SYMPTOM"), ("di", "O"), ("Jalan", "B-LOCATION"), ("Ampang", "I-LOCATION"), ("pagi", "B-TIMING"), ("tadi", "I-TIMING")],
    [("Longkang", "B-ISSUE"), ("tersumbat", "I-ISSUE"), ("depan", "B-LOCATION"), ("rumah", "I-LOCATION"), ("bila", "O"), ("hujan", "O"), ("air", "B-SYMPTOM"), ("naik", "I-SYMPTOM")],
    [("Paip", "B-ISSUE"), ("bocor", "I-ISSUE"), ("air", "B-SYMPTOM"), ("melimpah", "I-SYMPTOM"), ("teruk", "B-SEVERITY"), ("di", "O"), ("kawasan", "B-LOCATION"), ("perumahan", "I-LOCATION")],

    # --- Mixed / Code-switching ---
    [("Streetlight", "B-ISSUE"), ("depan", "B-LOCATION"), ("mall", "I-LOCATION"), ("tak", "O"), ("function", "B-ISSUE"), ("everytime", "B-TIMING"), ("hujan", "I-TIMING")],
    [("Rubbish", "B-ISSUE"), ("bertimbun", "I-ISSUE"), ("kat", "O"), ("belakang", "B-LOCATION"), ("kedai", "I-LOCATION"), ("very", "B-SEVERITY"), ("smelly", "I-SEVERITY")],
    [("Pothole", "B-ISSUE"), ("besar", "B-SEVERITY"), ("gila", "I-SEVERITY"), ("near", "B-LOCATION"), ("KTM", "I-LOCATION"), ("station", "I-LOCATION"), ("tolong", "O"), ("fix", "O")],
    [("Drain", "B-ISSUE"), ("tersumbat", "I-ISSUE"), ("causing", "O"), ("banjir", "B-SYMPTOM"), ("teruk", "B-SEVERITY"), ("area", "B-LOCATION"), ("perumahan", "I-LOCATION")],
    [("Streetlight", "B-ISSUE"), ("dekat", "B-LOCATION"), ("school", "I-LOCATION"), ("dah", "O"), ("rosak", "B-SEVERITY"), ("sejak", "B-TIMING"), ("minggu", "I-TIMING"), ("lepas", "I-TIMING")],
    [("Abandoned", "B-ISSUE"), ("car", "I-ISSUE"), ("blocking", "B-SYMPTOM"), ("entrance", "B-LOCATION"), ("lorong", "I-LOCATION"), ("dah", "O"), ("berbulan", "B-TIMING")],
    [("Tolong", "O"), ("clear", "O"), ("big", "O"), ("tree", "B-ISSUE"), ("blocking", "B-SYMPTOM"), ("road", "B-LOCATION"), ("near", "O"), ("hospital", "B-LOCATION")]
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
