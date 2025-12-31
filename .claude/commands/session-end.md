# End Session and Log Progress

You are ending a Claude Code session. Follow these steps to log your work:

## 1. Generate Thread Entry

Create a thread entry for `.claude/threads.json`:

```json
{
  "threadId": "{project-id}-{YYYY-MM-DD}-{context-kebab-case}",
  "date": "{today's date}",
  "title": "{brief title of what was worked on}",
  "context": "{what the user asked to work on}",
  "summary": "{2-3 sentence summary of accomplishments}",
  "outcome": "{success|partial|blocked|abandoned}",
  "tasksCompleted": ["{list of completed tasks}"],
  "tasksCreated": ["{any new tasks identified}"],
  "filesModified": ["{key files that were changed}"],
  "createdAt": "{session start time}",
  "updatedAt": "{now}"
}
```

## 2. Update Project Status

If significant progress was made, update `.claude/project.json`:
- Adjust `pipeline.progress` percentage
- Update `pipeline.stage` if phase changed
- Update `currentFocus` for next session
- Clear resolved `blockers`, add new ones
- Update `updatedAt` timestamp

## 3. Append to Activity Log

Add entry to `.claude/log.md`:

```markdown
## {YYYY-MM-DD} - {Session Title}

**Outcome:** {success|partial|blocked}
**Progress:** {old}% -> {new}%

### Summary
{What was accomplished}

### Tasks Completed
- {task 1}
- {task 2}

### Next Steps
- {what to focus on next session}

---
```

## 4. Remind About Sync

After updating, remind the user:
> "Session logged. Run `sync-registry.sh` to update the global dashboard."

## Important

- Always read the current `.claude/project.json` before updating
- Only update progress if meaningful work was done
- Be honest about outcomes (partial is fine, abandoned is valid)
- The thread ID should be descriptive and unique for this session
