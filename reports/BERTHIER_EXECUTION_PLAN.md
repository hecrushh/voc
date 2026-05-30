# BERTHIER EXECUTION PLAN

## Phase 2A - Mission Engine Foundation

- [ ] Create command table.
- [ ] Expand mission event model.
- [ ] Link commands to missions.
- [ ] Build mission audit timeline.
- [ ] Add mission owner assignment to agent roles.
- [ ] Define and enforce mission status transitions.
- [ ] Define and enforce mission priority handling.
- [ ] Add mission notes/events.
- [ ] Add safe validation rules.
- [ ] Ensure every mission change is attributable and reconstructable.
- [ ] Ensure BERTHIER can create/update missions through a controlled backend path.
- [ ] Ensure no external side effects exist.

## Phase 2B - BERTHIER Command Intake

- [ ] Make the /berthier command form functional.
- [ ] Add create mission command.
- [ ] Add update mission command.
- [ ] Add summarize status command.
- [ ] Add list blocked missions command.
- [ ] Add list pending approvals command.
- [ ] Add create memory proposal command if memory write path exists.
- [ ] Implement deterministic command parser first.
- [ ] Defer LLM-assisted parsing until policy is defined.
- [ ] Ensure BERTHIER can turn a commander instruction into structured mission state.
- [ ] Ensure invalid or risky commands are refused or converted into approval requests.
- [ ] Ensure all responses preserve the “Sire” command doctrine.

## Phase 2C - Approval System

- [ ] Create approval model.
- [ ] Add approval status: requested.
- [ ] Add approval status: approved.
- [ ] Add approval status: rejected.
- [ ] Add approval status: modified.
- [ ] Add approval status: expired.
- [ ] Add approval risk level: low.
- [ ] Add approval risk level: medium.
- [ ] Add approval risk level: high.
- [ ] Add approval risk level: critical.
- [ ] Add UI list of pending approvals.
- [ ] Enforce approvals before any future external action.
- [ ] Link approval records back to commands, missions, and agents.
- [ ] Ensure the system can request approval even before it can execute approved actions.

## Phase 2D - Writable Memory

- [ ] Create memory table/store.
- [ ] Add memory create workflow.
- [ ] Add memory update workflow.
- [ ] Add memory delete workflow.
- [ ] Add memory field: type.
- [ ] Add memory field: title.
- [ ] Add memory field: body.
- [ ] Add memory field: source.
- [ ] Add memory field: confidence.
- [ ] Add memory field: scope.
- [ ] Add memory field: tags.
- [ ] Add memory field: created_at.
- [ ] Add memory field: updated_at.
- [ ] Add memory proposal flow from commands.
- [ ] Block inferred memory unless explicitly approved.
- [ ] Ensure BERTHIER can save and retrieve explicit memory.
- [ ] Ensure memory can be corrected or deleted.
- [ ] Ensure secrets are blocked from memory.

## Phase 2E - Agent Assignment Model

- [ ] Keep agent assignment non-autonomous.
- [ ] Allow agent roles to own missions.
- [ ] Show current assigned missions on agent pages.
- [ ] Add assignment workflow from BERTHIER to agent roles.
- [ ] Add agent assignment registry.
- [ ] Add agent assignment fields: mission_id.
- [ ] Add agent assignment fields: agent_id.
- [ ] Add agent assignment fields: assignment_type.
- [ ] Add agent assignment fields: status.
- [ ] Add agent assignment fields: instructions.
- [ ] Add agent assignment fields: created_by.
- [ ] Add agent assignment fields: created_at.
- [ ] Add agent assignment fields: updated_at.
- [ ] Prevent worker execution in this phase.
- [ ] Prevent external tools in this phase.
- [ ] Ensure the Command Center can model delegation without pretending agents are running.
