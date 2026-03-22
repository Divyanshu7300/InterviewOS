def generate_roadmap(priority: dict):
    roadmap = []
    day = 1

    for skill, level in priority.items():
        if level == "HIGH":
            roadmap.append({
                "day": f"Day {day}-{day+2}",
                "task": f"Master {skill} basics + practice"
            })
            day += 3
        elif level == "MEDIUM":
            roadmap.append({
                "day": f"Day {day}-{day+1}",
                "task": f"Revise {skill}"
            })
            day += 2

    roadmap.append({
        "day": f"Day {day}",
        "task": "Mock interview + revision"
    })

    return roadmap
