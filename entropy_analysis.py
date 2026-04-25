import math
from collections import Counter

def calculate_entropy(text):
    if not text:
        return 0

    counter = Counter(text)
    length = len(text)

    entropy = 0
    for count in counter.values():
        p = count / length
        entropy -= p * math.log2(p)

    return entropy


def is_high_entropy_domain(domain):
    # remove dots for better analysis
    clean = domain.replace(".", "")

    entropy = calculate_entropy(clean)

    # threshold (tuned for phishing-like randomness)
    return entropy > 3.5, entropy