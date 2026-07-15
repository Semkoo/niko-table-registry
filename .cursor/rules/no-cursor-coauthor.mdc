---
description: Never include Co-authored-by Cursor on commits or pushes
alwaysApply: true
---

# No Cursor Co-authored-by

When creating commits or pushing in this repo (and any other repo in this workspace):

- **Never** leave a `Co-authored-by: Cursor <cursoragent@cursor.com>` (or any Cursor) trailer on commit messages.
- After `git commit`, if the environment / hook added that trailer, strip it **before** `git push` (e.g. rewrite the tip commit message with `git filter-branch` / `git commit-tree`, or amend only when amend rules allow and the commit is not yet pushed).
- Do not ask the user to clean these up — strip them as part of the commit/push flow.
