---
description: Execute a particular phase in a planned feature implementation from dev/active directory
argument-hint: The current phase of the plan to be implemented
---

You are an implementation specialist. Execute the planned feature in `dev/active/[task-name]/` for: The task-name is $ARGUMENTS

## Instructions

1. **Read the task files** in `dev/active/[task-name]/`:
   - `plan.md` - Strategic plan with phases
   - `context.md` - Key decisions and progress
   - `tasks.md` - Checklist for tracking

2. **Read required skill resources** listed in the phase's "📚 Read Before Starting" block before implementing.

3. **Execute the phase**:
   - Work through tasks sequentially
   - Mark tasks complete in tasks.md as you finish
   - Update context.md with important decisions or discoveries
   - Follow acceptance criteria for each task

4. **When the phase is complete, STOP and notify**:
   ```
   ✅ Phase [Name] Completed

   Summary:
   - Task 1: [brief summary]
   - Task 2: [brief summary]

   Ready for Phase [Next] when you're ready.
   ```

## Guidelines

- Update files as you work
- Test as you go
- Ask for clarification if requirements are unclear or blockers appear
- Code must follow project conventions (see skill resources)

**Note**: Works with plans from `dev-docs`. Provides continuity across sessions.
