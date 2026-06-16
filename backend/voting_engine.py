from collections import Counter

def determine_winning_category(agent_outputs: list[dict]) -> str:
    """
    Takes the output dictionary from 5 classification agents and returns
    the winning category based on majority voting. 
    Tie-breaking selects the category with the highest cumulative confidence.
    """
    if not agent_outputs:
        raise ValueError("Agent outputs list cannot be empty.")
        
    votes = [out["document_type"] for out in agent_outputs]
    vote_counts = Counter(votes)
    
    # Identify the highest vote count received
    max_votes = max(vote_counts.values())
    winners = [cat for cat, count in vote_counts.items() if count == max_votes]
    
    # Direct majority winner
    if len(winners) == 1:
        return winners[0]
        
    # Tie-breaker logic using cumulative confidence sum of tied categories
    category_confidences = {}
    for out in agent_outputs:
        cat = out["document_type"]
        if cat in winners:
            category_confidences[cat] = category_confidences.get(cat, 0.0) + out["confidence"]
            
    return max(category_confidences, key=category_confidences.get)
