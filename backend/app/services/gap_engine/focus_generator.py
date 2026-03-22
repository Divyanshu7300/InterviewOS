def generate_focus(priority: dict):
    focus = []
    for skill, level in priority.items():
        if level == "HIGH":
            focus.append(f"Strong focus on {skill} fundamentals")
        elif level == "MEDIUM":
            focus.append(f"Revise intermediate concepts of {skill}")
    return focus
