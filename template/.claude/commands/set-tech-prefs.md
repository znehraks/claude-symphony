Set or update tech stack preferences for this project.

Read the current `config/tech_preferences.jsonc` and show the user their current preferences.

Then ask the user what tech stack they prefer (frameworks, languages, databases, hosting, etc.).

Update `config/tech_preferences.jsonc` with:
- `raw_input`: the user's stated preferences
- `locked`: false (unless user says to lock)

If the pipeline has already passed Stage 02 (research) or Stage 03 (planning), warn the user that previously generated research/planning outputs may not reflect the new preferences, and suggest re-running those stages with `/run-stage 02-research`.

$ARGUMENTS
