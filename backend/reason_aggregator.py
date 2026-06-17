def aggregate_reasoning(agent_outputs: list[dict], winning_category: str) -> str:
    """
    Merges the reasoning strings from all 5 agents into a single aggregate statement,
    clearly separating consensus votes from dissenting opinions.
    """
    if not agent_outputs:
        return ""
        
    winning_reasons = []
    dissent_reasons = []
    
    for out in agent_outputs:
        agent_name = out.get("agent_name", "Unknown Agent")
        reason = out.get("reasoning", "").strip()
        cat = out.get("document_type")
        conf = out.get("confidence", 0.0)
        
        formatted_reason = f"[{agent_name} (Conf: {conf:.2f})]: {reason}"
        
        if cat == winning_category:
            winning_reasons.append(formatted_reason)
        else:
            dissent_reasons.append(f"{formatted_reason} [Voted for: {cat}]")
            
    combined_lines = ["### Consensus Reasoning:"]
    combined_lines.extend(winning_reasons)
    
    if dissent_reasons:
        combined_lines.append("### Dissenting Opinions:")
        combined_lines.extend(dissent_reasons)
        
    return "\n".join(combined_lines)
