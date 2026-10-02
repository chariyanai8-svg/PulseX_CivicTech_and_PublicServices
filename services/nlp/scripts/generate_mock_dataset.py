import json
import random
import os
from pathlib import Path
from collections import Counter

# Set random seed for reproducibility
random.seed(42)

# Define our 11 categories
CATEGORIES = [
    "ROADS", "DRAINAGE", "WASTE", "LIGHTING", "FALLEN_TREES",
    "OBSTRUCTION", "FACILITIES", "PEDESTRIAN", "HAZARD", "ENVIRONMENT", "OTHER"
]

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DATA_DIR = BASE_DIR / "training" / "data" / "raw"

# Ensure output directory exists
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)

# Vocabulary & Templates per Category
TEMPLATES = {
    "ROADS": {
        "en": [
            "There is a {severity} pothole {location}.",
            "The road {location} is {severity} damaged.",
            "Please fix the {severity} road lines {location}."
        ],
        "ms": [
            "Jalan berlubang {severity} {location}.",
            "Banyak lubang {location} sangat membahayakan.",
            "Tolong baiki jalan yang rosak {location}."
        ],
        "mixed": [
            "Pothole {severity} gila {location}.",
            "Jalan {location} teruk sangat, full of holes.",
            "Can't pass jalan ni again, too many lubang {location}."
        ]
    },
    "DRAINAGE": {
        "en": [
            "The drain {location} is {severity} clogged.",
            "Severe flooding happens {location} every time it rains.",
            "Manhole cover is broken {location}."
        ],
        "ms": [
            "Longkang tersumbat {severity} {location}.",
            "Asyik banjir je {location} bila hujan lebat.",
            "Penutup longkang pecah {location}."
        ],
        "mixed": [
            "Drain {location} sumbat teruk.",
            "Everytime hujan confirm banjir {location}.",
            "Please check longkang {location}, bau very bad."
        ]
    },
    "WASTE": {
        "en": [
            "Uncollected trash piling up {location}.",
            "Illegal dumping site found {location}, {severity} smell.",
            "The rubbish bins {location} are overflowing."
        ],
        "ms": [
            "Sampah tak kutip berhari-hari {location}.",
            "Ada pembuangan sampah haram {location}.",
            "Tong sampah penuh melimpah {location}."
        ],
        "mixed": [
            "Rubbish {location} dah seminggu tak collect.",
            "Orang buang sampah merata-rata {location}.",
            "Very smelly rubbish dump {location}."
        ]
    },
    "LIGHTING": {
        "en": [
            "The streetlight {location} is broken.",
            "Traffic lights {location} are totally dark.",
            "No lighting {location} at night, very dangerous."
        ],
        "ms": [
            "Lampu jalan {location} rosak.",
            "Lampu isyarat {location} mati terus.",
            "Gelap sangat {location} bila malam."
        ],
        "mixed": [
            "Streetlight {location} dah lama rosak.",
            "Traffic light {location} tak function.",
            "Lampu jalan {location} always flickering."
        ]
    },
    "FALLEN_TREES": {
        "en": [
            "A large tree has fallen {location}.",
            "Dangerous overhanging branches {location}.",
            "Uprooted tree blocking the path {location}."
        ],
        "ms": [
            "Ada pokok tumbang {location}.",
            "Dahan pokok patah dan bahaya {location}.",
            "Pokok tumbang halang jalan {location}."
        ],
        "mixed": [
            "Tree tumbang {location}, please clear.",
            "Big branch patah {location}.",
            "Pokok besar blocking the way {location}."
        ]
    },
    "OBSTRUCTION": {
        "en": [
            "Abandoned car blocking the road {location}.",
            "Illegal structure blocking the sidewalk {location}.",
            "Construction materials obstructing traffic {location}."
        ],
        "ms": [
            "Kereta terbiar halang laluan {location}.",
            "Ada gerai haram halang jalan kaki {location}.",
            "Bahan binaan block jalan {location}."
        ],
        "mixed": [
            "Abandoned car {location} dah berbulan.",
            "Illegal parking block the road {location}.",
            "Gerai block sidewalk {location}."
        ]
    },
    "FACILITIES": {
        "en": [
            "Playground equipment {location} is broken.",
            "Bus stop roof {location} is leaking.",
            "Public toilet {location} is in terrible condition."
        ],
        "ms": [
            "Taman permainan {location} rosak teruk.",
            "Bumbung perhentian bas {location} bocor.",
            "Tandas awam {location} kotor gila."
        ],
        "mixed": [
            "Playground {location} rosak, bahaya for kids.",
            "Bus stop {location} roof bocor.",
            "Toilet awam {location} very dirty."
        ]
    },
    "PEDESTRIAN": {
        "en": [
            "Sidewalk {location} is heavily damaged.",
            "Tactile paving missing {location}.",
            "Pedestrian bridge {location} is unsafe."
        ],
        "ms": [
            "Kaki lima {location} pecah dan bahaya.",
            "Laluan pejalan kaki {location} rosak.",
            "Jejantas {location} goyang dan bahaya."
        ],
        "mixed": [
            "Sidewalk {location} pecah teruk.",
            "Pedestrian bridge {location} tak safe to use.",
            "Laluan pejalan kaki {location} blocked."
        ]
    },
    "HAZARD": {
        "en": [
            "Exposed live wiring found {location}.",
            "Dangerous open hole {location}.",
            "Sharp debris on the road {location}."
        ],
        "ms": [
            "Wayar elektrik terdedah {location}.",
            "Ada lubang terbuka yang bahaya {location}.",
            "Sisa kaca dan besi tajam {location}."
        ],
        "mixed": [
            "Exposed wire {location}, very dangerous.",
            "Open hole {location} takde cover.",
            "Banyak sharp objects {location}."
        ]
    },
    "ENVIRONMENT": {
        "en": [
            "Severe open burning happening {location}.",
            "Chemical spill suspected {location}.",
            "Extreme noise pollution from factory {location}."
        ],
        "ms": [
            "Ada pembakaran terbuka {location}.",
            "Tumpahan sisa kimia {location}.",
            "Bunyi bising sangat dari kilang {location}."
        ],
        "mixed": [
            "Open burning {location}, asap tebal.",
            "Factory {location} release toxic smoke.",
            "Air sungai {location} looks polluted."
        ]
    },
    "OTHER": {
        "en": [
            "Stray dogs roaming aggressively {location}.",
            "Strange incident {location}, need council help.",
            "General complaint about area {location}."
        ],
        "ms": [
            "Anjing liar garang {location}.",
            "Masalah tak pasti {location}.",
            "Kawasan {location} perlukan pemeriksaan majlis."
        ],
        "mixed": [
            "Many stray dogs {location} attacking people.",
            "Weird smell {location}, don't know from where.",
            "Need council to check {location}."
        ]
    }
}

# Fillers
LOCATIONS_EN = ["near the hospital", "in front of the school", "along the highway", "behind the shops", "at the intersection"]
LOCATIONS_MS = ["depan sekolah", "dekat simpang", "belakang kedai", "berhampiran taman", "di laluan utama"]
LOCATIONS_MIXED = ["near Mydin", "depan mall", "kat highway", "area kedai makan", "belakang hospital"]

SEVERITIES = ["very", "extremely", "teruk", "sangat", "really"]

def generate_dataset(num_samples: int = 1000):
    dataset = []
    
    # Calculate target samples per category to ensure balance
    samples_per_cat = num_samples // len(CATEGORIES)
    
    for category in CATEGORIES:
        for _ in range(samples_per_cat):
            # Pick a random language
            lang = random.choice(["en", "ms", "mixed"])
            
            # Pick a random template
            template = random.choice(TEMPLATES[category][lang])
            
            # Pick random fillers based on language
            if lang == "en":
                loc = random.choice(LOCATIONS_EN)
            elif lang == "ms":
                loc = random.choice(LOCATIONS_MS)
            else:
                loc = random.choice(LOCATIONS_MIXED)
                
            sev = random.choice(SEVERITIES)
            
            # Format text
            text = template.format(location=loc, severity=sev)
            
            # Clean up double spaces if severity wasn't in template
            text = " ".join(text.split())
            
            # Create record compliant with schema_classification.json
            record = {
                "text": text,
                "category": category,
                "language": lang,
                "source": "synthetic",
                "reviewed": True
            }
            
            dataset.append(record)
            
    # Shuffle the dataset
    random.shuffle(dataset)
    
    # Ensure exactly num_samples (in case of rounding issues with division)
    return dataset[:num_samples]

def save_jsonl(data: list, filepath: Path):
    with open(filepath, 'w', encoding='utf-8') as f:
        for item in data:
            f.write(json.dumps(item) + '\n')

def main():
    print("Generating synthetic classification dataset...")
    
    data = generate_dataset(1100) # Generate 1100 total
    
    # Split 80/10/10
    train_size = int(len(data) * 0.8)
    val_size = int(len(data) * 0.1)
    
    train_data = data[:train_size]
    val_data = data[train_size:train_size+val_size]
    test_data = data[train_size+val_size:]
    
    # Save splits
    save_jsonl(train_data, RAW_DATA_DIR / "train.jsonl")
    save_jsonl(val_data, RAW_DATA_DIR / "val.jsonl")
    save_jsonl(test_data, RAW_DATA_DIR / "test.jsonl")
    
    print(f"Generated {len(data)} examples successfully.")
    print(f"Train: {len(train_data)}, Val: {len(val_data)}, Test: {len(test_data)}")
    
    # Validate balance
    cat_counts = Counter([d["category"] for d in train_data])
    lang_counts = Counter([d["language"] for d in train_data])
    
    print("\n--- Training Set Distribution ---")
    print("Categories:")
    for cat, count in cat_counts.most_common():
        print(f"  {cat}: {count}")
        
    print("\nLanguages:")
    for lang, count in lang_counts.most_common():
        print(f"  {lang}: {count}")

if __name__ == "__main__":
    main()
