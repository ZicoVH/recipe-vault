#!/usr/bin/env bash
# PostToolUse hook for Edit and Write. Checks that an edited .ts, .tsx or .css
# file in src/ is formatted with the project's Prettier, and reports drift to
# Claude. It never modifies a file. Needs bash and jq.
#
# Exit codes: 0 = nothing to report, 2 = file is not formatted (stderr goes to
# Claude), 1 = the hook itself failed (a notice for the user, never blocks).

if ! command -v jq >/dev/null 2>&1; then
  echo 'check-format hook: jq not found' >&2
  exit 1
fi

input=$(cat)
if [ -z "$input" ]; then
  echo 'check-format hook: stdin is not valid JSON' >&2
  exit 1
fi

# Missing, non-string or empty values come out as empty strings.
if ! file_path=$(printf '%s' "$input" |
  jq -r '(try .tool_input.file_path catch empty) | select(type == "string")' 2>/dev/null); then
  echo 'check-format hook: stdin is not valid JSON' >&2
  exit 1
fi
[ -n "$file_path" ] || exit 0

root=${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '(try .cwd catch empty) | select(type == "string")' 2>/dev/null)}
root=${root:-$PWD}
root=${root%/}

case $file_path in
  /*) abs=$file_path ;;
  *) abs=$root/$file_path ;;
esac

# Paths with ".." segments are not resolved. Skip them instead of guessing.
case $abs in
  */../* | */..) exit 0 ;;
esac

rel=${abs#"$root"/}
[ "$rel" != "$abs" ] || exit 0

case $rel in
  src/*.ts | src/*.tsx | src/*.css) ;;
  *) exit 0 ;;
esac

[ -f "$abs" ] || exit 0

prettier=$root/node_modules/.bin/prettier
if [ ! -x "$prettier" ]; then
  echo 'check-format hook: node_modules/.bin/prettier not found' >&2
  exit 1
fi

(cd "$root" && "$prettier" --check "$abs" >/dev/null 2>&1)
status=$?

case $status in
  0) exit 0 ;;
  1)
    echo "Prettier: $rel is not formatted. Run: npx prettier --write $rel" >&2
    exit 2
    ;;
  *)
    echo "check-format hook: prettier failed on $rel (exit $status)" >&2
    exit 1
    ;;
esac
