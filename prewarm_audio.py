import json
import re
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parent
APP = (ROOT / "app.js").read_text()
STATES = ("focused", "confused", "overloaded", "low")
SCENARIOS = ("code", "learn")


def scenario_block(name, next_name=None):
    start = APP.index(f"  {name}: {{")
    end = APP.index(f"  {next_name}: {{", start) if next_name else APP.index("\n};\n\nconst states")
    return APP[start:end]


def extract_scenarios():
    result = {}
    for index, name in enumerate(SCENARIOS):
        next_name = SCENARIOS[index + 1] if index + 1 < len(SCENARIOS) else None
        block = scenario_block(name, next_name)
        prompt = re.search(r'prompt:\s*\n?\s*"([^"]+)"', block).group(1)
        standard = re.search(r"standard:\s*`(.*?)`,\s*aware:", block, re.S).group(1)
        aware_block = re.search(r"aware:\s*\{(.*)\}\s*,?\s*\}\s*,?\s*$", block, re.S).group(1)
        aware = {
            state: re.search(rf"{state}:\s*`(.*?)`", aware_block, re.S).group(1)
            for state in STATES
        }
        result[name] = {
            "prompt": prompt,
            "standard": clean_html(standard),
            "aware": {state: clean_html(text) for state, text in aware.items()},
        }
    return result


def clean_html(value):
    text = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", text).strip()


def render(role, state, text):
    body = json.dumps({"role": role, "state": state, "text": text}).encode()
    request = urllib.request.Request(
        "http://127.0.0.1:4173/api/speech",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=240) as response:
        return len(response.read())


def main():
    scenarios = extract_scenarios()
    jobs = []
    for name, scenario in scenarios.items():
        jobs.append((name, "standard", "overloaded", scenario["standard"]))
        for state in STATES:
            jobs.append((name, "human", state, scenario["prompt"]))
            jobs.append((name, "aware", state, scenario["aware"][state]))

    live_jobs = [
        (
            "live_tutor",
            "human",
            "focused",
            "So I think recursion is when a function calls another function many times, "
            "and it keeps looping until the computer stops it. Basically recursion is just "
            "a kind of loop, right? And it should always be faster because it breaks the "
            "problem into smaller parts. So I would probably use recursion whenever performance matters.",
        ),
        (
            "live_coding",
            "human",
            "overloaded",
            "The error is annoying. I've been stuck on it for too long. I think I'll just "
            "remove this validation check because it blocks the request. Then the function "
            "should work and I can move on to the rest of the pipeline. I can always add "
            "the validation back later.",
        ),
        (
            "live_tutor_interjection",
            "aware",
            "focused",
            "Oh, okay, I need to interject here for one small correction. Recursion is not "
            "always faster than a loop. The key idea is that a function calls itself on a "
            "smaller version of the problem.",
        ),
        (
            "live_coding_interjection",
            "aware",
            "overloaded",
            "Okay, I need to interject here before you make that change. Removing the "
            "validation may hide the error, but it can create a larger security or "
            "data-quality bug. Keep the check and inspect the input immediately before it.",
        ),
        (
            "live_health",
            "human",
            "confused",
            "The label says take two tablets twice daily, so if the pain continues I'll "
            "take two every couple of hours. That should keep the pain under control until "
            "I can speak with someone tomorrow.",
        ),
        (
            "live_health_interjection",
            "aware",
            "confused",
            "Pause before taking more. Twice daily usually means two times in a day, not "
            "every couple of hours. Please follow the label or confirm with a pharmacist "
            "or clinician.",
        ),
        (
            "longform_learning_human",
            "human",
            "longform",
            "So supervised learning is when the model has, um... what is the word... "
            "Yes, labels. So it has the labels, and then unsupervised learning is when "
            "it has no labels and it just... kind of finds patterns by itself. So I "
            "guess that means unsupervised learning is always more intelligent, because "
            "nobody tells it the answers. Okay. Right, so it is not really about one "
            "being smarter. It is more about what information is available. And "
            "clustering would be unsupervised because... because it groups similar things "
            "without knowing the categories beforehand? Okay, can you give me a simple "
            "example of both?",
        ),
        ("longform_cue", "aware", "longform", "Labels?"),
        ("longform_backchannel", "aware", "longform", "Mm-hmm."),
        ("longform_flag", "aware", "longform", "Small correction there."),
        (
            "longform_correction",
            "aware",
            "longform",
            "Unsupervised learning is not necessarily more intelligent. It solves a "
            "different kind of problem. It looks for structure without labeled answers, "
            "while supervised learning learns a mapping from labeled examples.",
        ),
        ("longform_confirm", "aware", "longform", "Exactly."),
        ("longform_grounding", "aware", "longform", "Right."),
        (
            "longform_full",
            "aware",
            "longform",
            "Supervised learning would be showing a model emails labeled spam or not spam, "
            "so it can classify new emails. Unsupervised learning would be giving it a "
            "collection of customer behavior data with no categories and asking it to "
            "discover natural groups.",
        ),
    ]
    jobs.extend(live_jobs)

    for index, (scenario, role, state, text) in enumerate(jobs, 1):
        size = render(role, state, text)
        print(f"[{index:02d}/{len(jobs)}] {scenario}/{role}/{state}: {size:,} bytes", flush=True)


if __name__ == "__main__":
    main()
