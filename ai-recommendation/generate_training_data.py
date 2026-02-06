"""
Synthetic Training Data Generator for Supervisor-Student Matching

Generates realistic student-supervisor profile pairs with match quality labels
using an ACM Computing Classification System (CCS) inspired taxonomy.

Usage:
    python generate_training_data.py                     # Generate 10,000 pairs
    python generate_training_data.py --num_pairs 5000    # Custom size
    python generate_training_data.py --output data/      # Custom output dir
"""

import json
import random
import argparse
import os
import numpy as np
from pathlib import Path

# ============================================================================
# CS Research Taxonomy (ACM CCS-inspired)
# ============================================================================

# Related research clusters -- areas within the same cluster are strongly related
RESEARCH_CLUSTERS = {
    "AI_ML": {
        "areas": [
            "Artificial Intelligence", "Machine Learning", "Deep Learning",
            "Natural Language Processing", "Computer Vision", "Reinforcement Learning",
            "Neural Networks", "Data Mining", "Pattern Recognition",
            "Knowledge Representation", "Expert Systems", "Generative AI"
        ],
        "skills": [
            "Python", "TensorFlow", "PyTorch", "Scikit-learn", "Keras",
            "Pandas", "NumPy", "OpenCV", "Hugging Face", "NLTK",
            "SpaCy", "Jupyter", "Data Analysis", "Statistics"
        ],
        "project_types": [
            "Research", "Data Science", "AI Application", "ML Pipeline"
        ]
    },
    "Software_Engineering": {
        "areas": [
            "Software Engineering", "Software Architecture", "Agile Development",
            "DevOps", "Software Testing", "Software Quality Assurance",
            "Requirements Engineering", "Design Patterns", "Microservices",
            "Cloud Computing", "Continuous Integration", "Code Analysis"
        ],
        "skills": [
            "Java", "Python", "Git", "Docker", "Kubernetes", "Jenkins",
            "Spring Boot", "REST API", "Agile/Scrum", "JUnit",
            "CI/CD", "UML", "Software Design"
        ],
        "project_types": [
            "Software Development", "System Design", "Tool Development"
        ]
    },
    "Web_Mobile": {
        "areas": [
            "Web Development", "Mobile Computing", "Frontend Engineering",
            "Full-Stack Development", "Progressive Web Apps", "Cross-Platform Development",
            "User Interface Design", "Web Performance", "API Design",
            "Cloud-Native Applications", "Serverless Computing"
        ],
        "skills": [
            "JavaScript", "TypeScript", "React", "Angular", "Vue.js",
            "Node.js", "HTML/CSS", "Flutter", "React Native", "Swift",
            "Kotlin", "REST API", "GraphQL", "MongoDB", "PostgreSQL"
        ],
        "project_types": [
            "Web Application", "Mobile Application", "Full-Stack Project"
        ]
    },
    "Cybersecurity": {
        "areas": [
            "Cybersecurity", "Network Security", "Cryptography",
            "Information Security", "Ethical Hacking", "Penetration Testing",
            "Digital Forensics", "Malware Analysis", "Security Protocols",
            "Blockchain Security", "Privacy Computing", "Access Control"
        ],
        "skills": [
            "Python", "Wireshark", "Metasploit", "Linux", "Kali Linux",
            "Network Protocols", "Encryption", "OWASP", "Burp Suite",
            "Nmap", "Firewall Configuration", "Security Auditing"
        ],
        "project_types": [
            "Security Analysis", "Tool Development", "Research"
        ]
    },
    "Data_Science": {
        "areas": [
            "Data Science", "Big Data Analytics", "Data Visualization",
            "Business Intelligence", "Statistical Modeling", "Predictive Analytics",
            "Data Engineering", "ETL Pipelines", "Time Series Analysis",
            "Recommendation Systems", "A/B Testing", "Data Warehousing"
        ],
        "skills": [
            "Python", "R", "SQL", "Tableau", "Power BI", "Apache Spark",
            "Hadoop", "Pandas", "NumPy", "Matplotlib", "Seaborn",
            "Scikit-learn", "Statistical Analysis", "Excel"
        ],
        "project_types": [
            "Data Analysis", "Dashboard Development", "Research", "Data Pipeline"
        ]
    },
    "Networks_IoT": {
        "areas": [
            "Computer Networks", "Internet of Things", "Wireless Networks",
            "Sensor Networks", "Edge Computing", "5G Networks",
            "Network Protocols", "Embedded Systems", "Smart Systems",
            "Distributed Systems", "Cloud Infrastructure", "SDN/NFV"
        ],
        "skills": [
            "C/C++", "Python", "Arduino", "Raspberry Pi", "MQTT",
            "TCP/IP", "Linux", "Network Simulation", "Wireshark",
            "Embedded C", "Circuit Design", "AWS/Azure IoT"
        ],
        "project_types": [
            "IoT System", "Prototype Development", "Research", "Network Design"
        ]
    },
    "HCI_UX": {
        "areas": [
            "Human-Computer Interaction", "User Experience Design",
            "Usability Engineering", "Accessibility", "Interaction Design",
            "Information Visualization", "Virtual Reality", "Augmented Reality",
            "Gamification", "Affective Computing", "Collaborative Systems"
        ],
        "skills": [
            "Figma", "Adobe XD", "Sketch", "User Research", "Prototyping",
            "Wireframing", "A/B Testing", "JavaScript", "Unity",
            "HTML/CSS", "Usability Testing", "Survey Design"
        ],
        "project_types": [
            "UI/UX Design", "User Study", "Prototype Development", "VR/AR Application"
        ]
    },
    "Database_Systems": {
        "areas": [
            "Database Systems", "Information Retrieval", "Knowledge Graphs",
            "NoSQL Databases", "Distributed Databases", "Data Modeling",
            "Query Optimization", "Transaction Processing", "Search Engines",
            "Semantic Web", "Ontology Engineering"
        ],
        "skills": [
            "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis",
            "Elasticsearch", "Neo4j", "Database Design", "Data Modeling",
            "Python", "Java", "ORM Frameworks"
        ],
        "project_types": [
            "Database Design", "System Development", "Research"
        ]
    },
}

# Cross-cluster relationships (clusters that have moderate overlap)
CLUSTER_RELATIONS = {
    "AI_ML": ["Data_Science", "HCI_UX", "Networks_IoT"],
    "Data_Science": ["AI_ML", "Database_Systems", "Software_Engineering"],
    "Software_Engineering": ["Web_Mobile", "Data_Science", "Database_Systems"],
    "Web_Mobile": ["Software_Engineering", "HCI_UX"],
    "Cybersecurity": ["Networks_IoT", "Software_Engineering"],
    "Networks_IoT": ["Cybersecurity", "AI_ML"],
    "HCI_UX": ["Web_Mobile", "AI_ML"],
    "Database_Systems": ["Data_Science", "Software_Engineering"],
}

PROGRAMMES = [
    "Bachelor of Computer Science",
    "Bachelor of Information Technology",
    "Bachelor of Software Engineering",
    "Bachelor of Data Science",
    "Bachelor of Cybersecurity",
    "Bachelor of Artificial Intelligence",
]

SPECIALISATIONS = [
    "Artificial Intelligence", "Software Engineering", "Data Science",
    "Cybersecurity", "Game Development", "Cloud Computing",
    "Mobile Development", "Network Engineering",
]

DEPARTMENTS = [
    "Faculty of Computing and Informatics",
    "Faculty of Engineering and Technology",
    "Faculty of Information Science",
    "Department of Computer Science",
    "Department of Software Engineering",
    "Department of Data Science",
]


def pick_cluster():
    """Pick a random research cluster."""
    return random.choice(list(RESEARCH_CLUSTERS.keys()))


def generate_student_profile(student_id):
    """Generate a synthetic student profile."""
    primary_cluster = pick_cluster()
    cluster_data = RESEARCH_CLUSTERS[primary_cluster]

    # Pick 2-4 interests, mostly from primary cluster, maybe 1 from related
    num_interests = random.randint(2, 4)
    interests = random.sample(cluster_data["areas"], min(num_interests - 1, len(cluster_data["areas"])))

    # Sometimes add an interest from a related cluster
    if random.random() < 0.4:
        related_clusters = CLUSTER_RELATIONS.get(primary_cluster, [])
        if related_clusters:
            rel_cluster = random.choice(related_clusters)
            rel_areas = RESEARCH_CLUSTERS[rel_cluster]["areas"]
            interests.append(random.choice(rel_areas))

    # Pick 3-6 skills from primary cluster
    num_skills = random.randint(3, 6)
    skills = random.sample(cluster_data["skills"], min(num_skills, len(cluster_data["skills"])))

    return {
        "userId": student_id,
        "fullName": f"Student_{student_id}",
        "programme": random.choice(PROGRAMMES),
        "specialisation": random.choice(SPECIALISATIONS),
        "interests": interests,
        "skills": skills,
        "bio": f"A student passionate about {', '.join(interests[:2])} with experience in {', '.join(skills[:3])}.",
        "_primary_cluster": primary_cluster,  # metadata for label generation
    }


def generate_supervisor_profile(supervisor_id):
    """Generate a synthetic supervisor profile."""
    primary_cluster = pick_cluster()
    cluster_data = RESEARCH_CLUSTERS[primary_cluster]

    # Pick 3-5 research areas, mostly from primary cluster
    num_areas = random.randint(3, 5)
    research_areas = random.sample(cluster_data["areas"], min(num_areas - 1, len(cluster_data["areas"])))

    # Sometimes add a research area from a related cluster
    if random.random() < 0.5:
        related_clusters = CLUSTER_RELATIONS.get(primary_cluster, [])
        if related_clusters:
            rel_cluster = random.choice(related_clusters)
            rel_areas = RESEARCH_CLUSTERS[rel_cluster]["areas"]
            research_areas.append(random.choice(rel_areas))

    # Pick 3-6 expertise keywords
    num_expertise = random.randint(3, 6)
    expertise = random.sample(cluster_data["skills"], min(num_expertise, len(cluster_data["skills"])))

    # Preferred project types
    project_types = random.sample(
        cluster_data["project_types"],
        min(random.randint(1, 3), len(cluster_data["project_types"]))
    )

    # Supervision capacity
    quota = random.choice([4, 6, 8, 10])
    current_load = random.randint(0, quota)
    availability = "AVAILABLE" if current_load < quota else "FULL"

    return {
        "userId": supervisor_id,
        "fullName": f"Dr. Supervisor_{supervisor_id}",
        "department": random.choice(DEPARTMENTS),
        "faculty": "Faculty of Computing and Informatics",
        "researchAreas": research_areas,
        "expertise": expertise,
        "preferredProjectTypes": project_types,
        "bio": f"Researcher specializing in {', '.join(research_areas[:2])} with expertise in {', '.join(expertise[:3])}.",
        "availabilityStatus": availability,
        "currentLoad": current_load,
        "supervisionQuota": quota,
        "_primary_cluster": primary_cluster,  # metadata for label generation
    }


def compute_match_label(student, supervisor):
    """
    Compute a match quality label (0.0 - 1.0) based on cluster relationships
    and field overlap. This simulates what a 'ground truth' matching would look like.
    """
    s_cluster = student["_primary_cluster"]
    sv_cluster = supervisor["_primary_cluster"]

    # Base score from cluster relationship
    if s_cluster == sv_cluster:
        base_score = random.uniform(0.65, 0.95)  # Same cluster = strong match
    elif sv_cluster in CLUSTER_RELATIONS.get(s_cluster, []):
        base_score = random.uniform(0.35, 0.70)  # Related cluster = moderate match
    else:
        base_score = random.uniform(0.05, 0.35)  # Unrelated = weak match

    # Bonus for direct field overlap
    s_interests = set(i.lower() for i in student["interests"])
    sv_areas = set(a.lower() for a in supervisor["researchAreas"])
    overlap = len(s_interests & sv_areas)
    overlap_bonus = min(overlap * 0.08, 0.2)

    # Bonus for skills-expertise overlap
    s_skills = set(s.lower() for s in student["skills"])
    sv_expertise = set(e.lower() for e in supervisor["expertise"])
    skill_overlap = len(s_skills & sv_expertise)
    skill_bonus = min(skill_overlap * 0.05, 0.15)

    # Penalty for full supervisors
    availability_penalty = 0.0
    if supervisor["availabilityStatus"] == "FULL":
        availability_penalty = random.uniform(0.1, 0.25)

    # Final score with some noise
    score = base_score + overlap_bonus + skill_bonus - availability_penalty
    noise = random.gauss(0, 0.05)
    score = np.clip(score + noise, 0.0, 1.0)

    return round(float(score), 4)


def generate_dataset(num_pairs=10000, num_students=500, num_supervisors=100):
    """Generate the full training dataset."""
    print(f"Generating {num_students} students and {num_supervisors} supervisors...")
    students = [generate_student_profile(i) for i in range(1, num_students + 1)]
    supervisors = [generate_supervisor_profile(i) for i in range(1, num_supervisors + 1)]

    print(f"Generating {num_pairs} student-supervisor pairs with match labels...")
    pairs = []
    for _ in range(num_pairs):
        student = random.choice(students)
        supervisor = random.choice(supervisors)
        match_label = compute_match_label(student, supervisor)

        pairs.append({
            "student": student,
            "supervisor": supervisor,
            "match_score": match_label,
        })

    return pairs, students, supervisors


def save_dataset(pairs, output_dir="data"):
    """Save the generated dataset to JSON files."""
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, "training_pairs.json")
    # Remove internal metadata before saving
    clean_pairs = []
    for pair in pairs:
        clean_pair = {
            "student": {k: v for k, v in pair["student"].items() if not k.startswith("_")},
            "supervisor": {k: v for k, v in pair["supervisor"].items() if not k.startswith("_")},
            "match_score": pair["match_score"],
        }
        clean_pairs.append(clean_pair)

    with open(output_path, "w") as f:
        json.dump(clean_pairs, f, indent=2)

    print(f"Saved {len(clean_pairs)} training pairs to {output_path}")

    # Save summary statistics
    scores = [p["match_score"] for p in pairs]
    stats = {
        "num_pairs": len(pairs),
        "score_mean": round(np.mean(scores), 4),
        "score_std": round(np.std(scores), 4),
        "score_min": round(min(scores), 4),
        "score_max": round(max(scores), 4),
        "high_match_count": sum(1 for s in scores if s > 0.7),
        "medium_match_count": sum(1 for s in scores if 0.3 <= s <= 0.7),
        "low_match_count": sum(1 for s in scores if s < 0.3),
    }
    stats_path = os.path.join(output_dir, "dataset_stats.json")
    with open(stats_path, "w") as f:
        json.dump(stats, f, indent=2)

    print(f"Dataset statistics: {json.dumps(stats, indent=2)}")
    return output_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic training data")
    parser.add_argument("--num_pairs", type=int, default=10000, help="Number of pairs to generate")
    parser.add_argument("--num_students", type=int, default=500, help="Number of unique students")
    parser.add_argument("--num_supervisors", type=int, default=100, help="Number of unique supervisors")
    parser.add_argument("--output", type=str, default="data", help="Output directory")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    random.seed(args.seed)
    np.random.seed(args.seed)

    pairs, students, supervisors = generate_dataset(
        num_pairs=args.num_pairs,
        num_students=args.num_students,
        num_supervisors=args.num_supervisors,
    )
    save_dataset(pairs, args.output)
