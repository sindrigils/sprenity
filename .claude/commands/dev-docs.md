---
description: Write a completed plan to persistent documentation in dev/active directory
argument-hint: task-name (e.g., object-lists)
---

You have just completed planning a feature (in plan mode or conversation). Now write the plan to persistent documentation in `/dev/active[task-name]/`. The task is $ARGUMENTS.

## Instructions

### Step 1: Create Task Directory

Create directory: `dev/active/[task-name]`

### Step 2: Write plan.md

Write `plan.md` based on the plan discussed:
- Executive Summary
- Current State Analysis
- Proposed Changes
- Implementation Phases with detailed steps

### Step 3: Write context.md

Write `context.md` with key context:
- Critical files to modify
- Key decisions made
- Dependencies and blockers
- Last Updated: YYYY-MM-DD

### Step 4: Discover Skills for tasks.md

Before writing `tasks.md`, you MUST:
1. Read `.claude/skills/README.md` to see all available skills
2. Activate ALL skills using the Skill tool
3. Each skill will show its resource files - note which ones apply to each phase

### Step 5: Write tasks.md

Write `tasks.md` with phases and checkbox tasks. Each phase MUST reference relevant skill resources based on what you learned in Step 4:

```markdown
## Phase 1: Backend Changes

**📚 Read Before Starting:**
- [api-endpoints-guide.md](/.claude/skills/backend-dev-guidelines/resources/api-endpoints-guide.md)
- [testing-guide.md](/.claude/skills/backend-dev-guidelines/resources/testing-guide.md)

### Tasks
- [ ] Create new endpoint in `api/v1/feature/views.py`
- [ ] Add serializer with validation
- [ ] Write tests

---

## Phase 2: Frontend Changes

**📚 Read Before Starting:**
- [component-guide.md](/.claude/skills/frontend-dev-guidelines/resources/component-guide.md)
- [api-requests-guide.md](/.claude/skills/frontend-dev-guidelines/resources/api-requests-guide.md)

### Tasks
- [ ] Create API hooks
- [ ] Build component
```

### Step 6: Verify

List the directory contents to confirm all three files exist:
- `dev/active/[task-name]/plan.md`
- `dev/active/[task-name]/context.md`
- `dev/active/[task-name]/tasks.md`

## Note

This command documents a plan you've already developed. If you haven't planned yet, use plan mode first, then run this command to persist the documentation.

