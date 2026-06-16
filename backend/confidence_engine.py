import numpy as np

def calculate_final_confidence(agent_outputs: list[dict], winning_category: str) -> float:
    """
    Calculates final confidence score based on the mathematical formula:
    FinalConfidence = VoteRatio * AverageConfidence * (1 - Variance)
    
    Where:
    - VoteRatio = WinningVotes / TotalAgents
    - AverageConfidence is the mean confidence of all 5 agents.
    - Variance is the statistical variance of the confidences of all 5 agents.
    """
    total_agents = len(agent_outputs)
    if total_agents == 0:
        return 0.0
        
    # Winning votes count
    winning_votes = sum(1 for out in agent_outputs if out["document_type"] == winning_category)
    vote_ratio = winning_votes / total_agents
    
    # Calculate average confidence and variance of all agents using numpy
    conf_array = np.array([out["confidence"] for out in agent_outputs])
    avg_confidence = float(np.mean(conf_array))
    
    # Variance of the confidences of all agents
    variance = float(np.var(conf_array)) if total_agents > 1 else 0.0
    
    final_confidence = vote_ratio * avg_confidence * (1.0 - variance)
    
    # Safe clip bounds
    return min(max(final_confidence, 0.0), 1.0)
