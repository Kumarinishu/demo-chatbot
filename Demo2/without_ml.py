def without_ml_rule(t):
    # BOT LOGIC: more cart attempts mean stronger intent and faster recovery
    return "N/A - No ML", "Fixed 10%", 10, {1:12,2:38,3:68,4:92}.get(t,12)