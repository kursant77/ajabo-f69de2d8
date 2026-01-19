"""
Utility for formatting order IDs.
"""

def format_order_id(raw_id: str) -> str:
    """
    Format a raw order ID into a more professional format like AA012345.
    
    Args:
        raw_id: The raw string ID (e.g., a UUID or integer string)
        
    Returns:
        A formatted string like AA00042
    """
    # If it's a numeric string, we can pad it
    if raw_id.isdigit():
        return f"AA{int(raw_id):06d}"
    
    # If it's a UUID or hex string, take the first 6 characters and uppercase
    # This ensures consistency even for UUIDs
    clean_id = raw_id.replace('-', '').upper()
    return f"AA{clean_id[:6]}"
