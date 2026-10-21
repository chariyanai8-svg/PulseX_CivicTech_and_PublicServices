# CivicPulse NLP Annotation Guidelines

This document provides instructions for the team to annotate the civic report dataset. High-quality models require consistent annotation.

## 1. Classification Guidelines (Primary Category)

Each report must be assigned exactly **one** primary category.

**Categories:**
- `ROADS`: Potholes, damaged asphalt, faded road lines. (Excludes blockages).
- `DRAINAGE`: Blocked drains, flooding, broken manhole covers.
- `WASTE`: Illegal dumping, uncollected trash, overflowing bins.
- `LIGHTING`: Broken streetlights, traffic light issues.
- `FALLEN_TREES`: Uprooted trees, dangerous overhanging branches.
- `OBSTRUCTION`: Abandoned cars, illegal structures blocking roads/sidewalks.
- `FACILITIES`: Broken playground equipment, damaged bus stops, public toilets.
- `PEDESTRIAN`: Damaged sidewalks, missing tactile paving, broken pedestrian bridges.
- `HAZARD`: Exposed wiring, open holes, dangerous construction debris.
- `ENVIRONMENT`: Open burning, chemical spills, severe noise pollution.
- `OTHER`: Anything that clearly doesn't fit above.

**Rules:**
1. **Multiple Issues:** If a report says *"Jalan berlubang dan streetlight rosak"*, pick the one that seems most dangerous or prominent. (Usually the first one mentioned).
2. **Do Not Force-Fit:** If someone complains about *"Cows on the highway"*, use `OTHER` (or possibly `HAZARD`), don't force it into `ROADS`.
3. **Ambiguity:** If "banjir" is mentioned, it's `DRAINAGE`, even if the water is on the `ROADS`.

---

## 2. NER Annotation Guidelines (Entity Extraction)

We use the **BIO scheme** (Begin, Inside, Outside).
- `B-[TYPE]`: The first word of an entity.
- `I-[TYPE]`: Subsequent words of the SAME entity.
- `O`: Outside any entity.

### Entities to Extract:

1. **`ISSUE`**: The core problem.
   - Example: "Jalan [banyak lubang](ISSUE)"
   - Example: "Longkang [tersumbat](ISSUE)"
   - *Rule:* Keep the span as short as possible. Exclude words like "ada", "yang", "is".

2. **`LOCATION`**: Clues about where it is.
   - Example: "Jalan berlubang [dekat Mydin USJ](LOCATION)"
   - Example: "Streetlight [depan rumah saya](LOCATION) rosak."
   - *Rule:* Include relative words ("depan", "near", "belakang") if they help pinpoint the spot. 

3. **`SEVERITY`**: Words indicating how bad it is.
   - Example: "Banjir [teruk](SEVERITY) gila"
   - Example: "Pothole is [very dangerous](SEVERITY)"
   - *Rule:* Only extract explicit severity adjectives/adverbs.

4. **`TIMING`**: When it happens or how long it's been.
   - Example: "[Sejak semalam](TIMING) air tak jalan"
   - Example: "[Everytime hujan](TIMING) confirm banjir"

5. **`SYMPTOM`**: Observable secondary effects.
   - Example: "Longkang tersumbat, [air dah masuk rumah](SYMPTOM)"
   - Example: "Sampah sarap bersepah, [bau busuk sangat](SYMPTOM)"

### NER Examples

**Example 1: Code-switching**
```
Streetlight depan school rosak teruk
Streetlight  (B-ISSUE)
depan        (B-LOCATION)
school       (I-LOCATION)
rosak        (B-ISSUE)  <- Wait, split issue? Yes, it's okay to have two B-ISSUEs if separated.
teruk        (B-SEVERITY)
```
*Correction for Example 1:* Better to tag "Streetlight rosak" as the issue.
```
Streetlight  (O) or (B-ISSUE - but implies broken by itself?)
depan        (B-LOCATION)
school       (I-LOCATION)
rosak        (B-ISSUE)
teruk        (B-SEVERITY)
```
*Best Practice:* Tag the noun and the adjective if adjacent: `[Streetlight rosak](ISSUE)`. If split, tag the defect: `[rosak](ISSUE)`.

**Example 2: BM Informal**
```
Jalan    (O)
kat      (B-LOCATION)
sini     (I-LOCATION)
banyak   (O)
lubang2  (B-ISSUE)
```

## 3. Language Tagging (`language`)
- `en`: Purely English (minor spelling mistakes allowed).
- `ms`: Purely Malay (formal or informal/slang).
- `mixed`: Contains words from both. E.g., *"Jalan ni ada pothole."*

## 4. Synthetic Data Handling
If using Claude/ChatGPT to generate data for bootstrapping:
- Mark `source: "synthetic"`.
- A human MUST read the text and verify the `category` and `ner_tags`. 
- Set `reviewed: true` only after verifying.
