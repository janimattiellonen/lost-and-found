#!/usr/bin/env bash
#
# Makes the code review a step you cannot forget rather than one you remember.
#
# The review itself is the `mattpocock-skills:code-review` skill (`/code-review
# master`), which reads the diff and reports on two axes: does this follow the
# repo's documented standards, and does it do what the spec asked. This script
# does not review anything. It only tracks *whether the current diff has been
# reviewed*, and refuses a commit when it has not.
#
# What is tracked is a digest of the diff under the code paths below. Edit a
# file after reviewing and the digest changes, so the review is stale and the
# gate closes again — which is the point: a review of the previous version is
# not a review of this one.
#
# Honest limits, so nobody trusts this further than it goes:
#
#  * The marker is written by whoever runs `record`. Nothing here verifies that
#    a review actually ran, or that its findings were acted on. This turns
#    "forgot to review" into "chose to skip the review", which is the whole of
#    what a marker file can do.
#  * It says nothing about quality. A review that found ten problems and a
#    review that found none record the same digest.
#
# Usage:
#   review-gate.sh record        # after a review: this diff is reviewed
#   review-gate.sh check-commit  # PreToolUse/Bash: deny `git commit` if stale
#   review-gate.sh check-stop    # Stop: remind, without blocking

set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
STATE="$ROOT/.claude/.review-state"

# What counts as a change worth reviewing. Specs and the changelog are
# deliberately out: editing them is part of *answering* a review, and would
# otherwise re-open the gate every time.
PATHS=(app supabase scripts e2e)

# What a commit would contain: the staged content, which is also what carries a
# brand-new file. Falling back to the whole tree when the index is empty covers
# `git commit -a` and the moment before anything is staged.
#
# Staged rather than everything-dirty on purpose. A branch usually has unrelated
# work in progress beside it, and gating on the whole tree means one person's
# half-finished file blocks a commit that does not include it — a gate that
# blocks the wrong thing is one people learn to bypass.
# $1: "sweeps-tree" when the command is a `git commit -a`, empty otherwise.
#
# The index is what a commit will contain, so the code part of the index is what
# to judge — and a commit with nothing of PATHS in it (a doc, a changelog) has no
# code to review, whatever else is dirty in the tree.
#
# The exception is `git commit -a`, which sweeps up tracked changes the index has
# never seen. Only then does the working tree matter.
#
# This runs *before* the command it is judging, so `git add x && git commit` sees
# the index as it was before the add. Falling back to the working tree whenever
# the index was empty would therefore gate every such one-liner on unrelated
# dirty files — which is how the first version of this blocked its own author.
# An empty index without -a commits nothing anyway, so there is nothing to gate.
current_diff() {
  if [ "${1:-}" = "sweeps-tree" ]; then
    git -C "$ROOT" diff HEAD -- "${PATHS[@]}" 2>/dev/null
  else
    git -C "$ROOT" diff --cached -- "${PATHS[@]}" 2>/dev/null
  fi
}

digest() {
  current_diff "${1:-}" | shasum -a 256 | cut -d ' ' -f 1
}

# Nothing to review is not the same as reviewed: exit 0 either way, but never
# write a marker for an empty diff.
has_changes() {
  [ -n "$(current_diff "${1:-}")" ]
}

is_reviewed() {
  [ -f "$STATE" ] && [ "$(cat "$STATE")" = "$(digest "${1:-}")" ]
}

case "${1:-}" in
  record)
    if has_changes; then
      digest > "$STATE"
      echo "Recorded: the current diff under ${PATHS[*]} is reviewed."
    else
      rm -f "$STATE"
      echo "Nothing to record — no changes under ${PATHS[*]}."
    fi
    ;;

  check-commit)
    # Only `git commit` is gated. Every other Bash call passes untouched, so the
    # hook costs one jq per command and nothing else.
    command=$(cat | jq -r '.tool_input.command // ""' 2>/dev/null)

    # Anchored to the start of a command rather than matched anywhere in the
    # string: `cd /repo && git commit -m x` is a commit, and a command that only
    # mentions one inside quotes is not. Written the long way because the first
    # version gated its own test.
    if ! [[ "$command" =~ (^|[\;\&\|][[:space:]]*)git[[:space:]]+commit([[:space:]]|$) ]]; then
      exit 0
    fi

    # -a / -am / --all: the commit takes tracked changes straight from the tree.
    scope=""
    # Tested on its own rather than as one regex with the verb: the flag may
    # follow the verb directly (`commit -am x`) or trail after other arguments,
    # and one pattern spanning both kept missing a form. We already know this is
    # a commit, so a flag found anywhere in it counts — erring towards gating.
    # The `a` may sit anywhere in a bundle of short flags: -a, -am, -sam.
    if [[ "$command" =~ (^|[[:space:]])-[a-zA-Z]*a[a-zA-Z]*([[:space:]]|$) ]] ||
      [[ "$command" =~ --all([[:space:]]|$) ]]; then
      scope="sweeps-tree"
    fi

    if ! has_changes "$scope" || is_reviewed "$scope"; then
      exit 0
    fi

    jq -nc '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "This diff has not been reviewed. Run /code-review master, act on the findings (or say why each is being left), then record it with .claude/hooks/review-gate.sh record and commit again. See CLAUDE.md."
      }
    }'
    ;;

  check-stop)
    # Advisory, not blocking. A blocking Stop hook fires on every turn while the
    # tree is dirty — including turns that answered a question and changed
    # nothing — which trains everyone to bypass it. The commit is where the gate
    # has teeth.
    if has_changes && ! is_reviewed; then
      jq -nc '{ systemMessage: "Unreviewed changes in the working tree — /code-review master before committing." }'
    fi
    ;;

  *)
    echo "Usage: review-gate.sh {record|check-commit|check-stop}" >&2
    exit 64
    ;;
esac
