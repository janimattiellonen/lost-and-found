"""Feeds the review gate the command shapes it has to tell apart.

Kept in a file rather than typed into a shell command because the gate inspects
the command string it is given, and a test typed inline contains the very words
it is testing for.

Expectations depend on the index, so each case says which state it assumes:
  "code"  — code under the gated paths is staged
  "clean" — nothing (or only non-code) is staged, but the tree is dirty with code
"""

import json
import pathlib
import subprocess
import sys

GATE = "/Users/janimattiellonen/Documents/Development/Frisbeegolf/lost-and-found/.claude/hooks/review-gate.sh"

VERB = "g" + "it " + "com" + "mit"

# (name, command, expected when code is staged, expected when the index is clean)
CASES = [
    ("plain commit", VERB + ' -m "x"', "deny", "allow"),
    ("commit after cd", "cd /repo && " + VERB + ' -m "x"', "deny", "allow"),
    ("commit with heredoc", VERB + " -F - <<'MSG'", "deny", "allow"),
    ("commit -am (sweeps the tree)", VERB + ' -am "x"', "deny", "deny"),
    ("commit --all (sweeps the tree)", VERB + ' --all -m "x"', "deny", "deny"),
    ("mentioned inside a string", 'echo "how do I ' + VERB + ' this"', "allow", "allow"),
    ("a different git command", "g" + "it log --oneline -3", "allow", "allow"),
    ("unrelated", "npm test", "allow", "allow"),
]

state = sys.argv[1] if len(sys.argv) > 1 else "code"
column = 2 if state == "code" else 3

failures = 0
for case in CASES:
    name, command, expected = case[0], case[1], case[column]
    payload = json.dumps({"tool_name": "Bash", "tool_input": {"command": command}})
    result = subprocess.run(
        [GATE, "check-commit"], input=payload, capture_output=True, text=True
    )
    out = result.stdout.strip()
    got = "allow"
    if out:
        got = json.loads(out)["hookSpecificOutput"]["permissionDecision"]
    ok = got == expected
    failures += 0 if ok else 1
    print(f"{'ok  ' if ok else 'FAIL'} [{state}] {name}: expected {expected}, got {got}")

sys.exit(1 if failures else 0)
