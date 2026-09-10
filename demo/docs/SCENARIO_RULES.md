# DENGE KASABASI — WATER CRISIS SCENARIO RULES v0.1

**Status: APPROVED / LOCKED**

This document is the canonical product specification for the Water Crisis scenario logic. Changes require explicit product approval. Do not invent additional rules.

## GENERAL

| Setting | Approved value |
| --- | --- |
| Scenario ID | `water-crisis` |
| Scenario name | Su Krizi |
| Target age | 10–12 |
| Initial water level | 42% |
| Initial budget | 50 |
| Maximum interventions per plan | 3 |
| Minimum interventions | No minimum is currently required. |
| Maximum revision cycles | 1 |

There is no correct/incorrect plan label.
There is no success/failure score.
There is no competency score.

## INTERVENTIONS

All water deltas are percentage points, not relative percentage increases.

| ID | Name | Cost | Water delta | Agriculture impact | Environmental description |
| --- | --- | --- | --- | --- | --- |
| `network-leak-repair` | Şebeke kaçaklarını onar | 20 | +14 | neutral | low environmental risk |
| `reduce-agricultural-irrigation` | Tarımsal sulamayı azalt | 5 | +16 | negative | no additional numeric environmental score |
| `reduce-park-irrigation` | Park sulamasını azalt | 2 | +3 | neutral | moderate environmental trade-off |
| `rainwater-harvesting` | Yağmur suyu toplama sistemi kur | 25 | +5 initially | neutral | high long-term benefit |
| `new-well` | Yeni kuyu aç | 15 | +12 | neutral | high short-term water benefit with uncertain long-term environmental impact |

## BUDGET RULE

Total selected intervention cost must be <= 50.

A maximum of three interventions may be selected.

### Example valid plan

Şebeke kaçaklarını onar + Yağmur suyu toplama sistemi kur + Park sulamasını azalt

```text
Cost: 20 + 25 + 2 = 47
Remaining budget: 50 - 47 = 3
```

### Example invalid plan

Şebeke kaçaklarını onar + Yağmur suyu toplama sistemi kur + Yeni kuyu aç

```text
Cost: 20 + 25 + 15 = 60
```

This exceeds the available budget of 50 and must not be submitted.

## WATER CALCULATION

Initial water level: 42.

```text
First-outcome water level = 42 + sum(selected intervention water deltas)
```

Clamp final water value between 0 and 100.

Approved example plan:

```text
network-leak-repair + rainwater-harvesting + reduce-park-irrigation
42 + 14 + 5 + 3 = 64
```

The approved first outcome example is **42% → 64%**.

## NEW EVIDENCE

After the first plan outcome, reveal:

> Önümüzdeki üç ayda yağışların normalin yaklaşık %40 altında kalması bekleniyor.

This evidence affects the expected short-term benefit of the `rainwater-harvesting` intervention.

If a revised plan still contains `rainwater-harvesting`, its water delta becomes **+3** instead of **+5**.

This modified value is used only for the revised/final outcome.

Do not tell the learner that the original selection was wrong.

## REVISION

After the first Outcome:

```text
Outcome → Reflection
```

If the learner keeps the plan:

```text
Reflection → Session Summary
```

If the learner wants to revise:

```text
Reflection → Planning → Decision → Final Outcome → Session Summary
```

Final Outcome is NOT a ninth screen. The Outcome screen is reused in final-outcome mode.

`revisionCount` must never exceed 1.

Final Outcome CTA:

> OTURUM ÖZETİNİ GÖR

## OBSERVABLE EVENTS

Approved events:

```text
session_started
location_opened
source_opened
intervention_viewed
intervention_selected
intervention_removed
reason_selected
confidence_submitted
plan_submitted
outcome_viewed
new_evidence_viewed
hint_requested
reflection_answered
strategy_changed
plan_revised
session_completed
```

Do not use `belief_revised`.

Do not infer an internal belief state from observable behavior.

## SESSION SUMMARY

Summary contains observed process indicators only.

| Indicator | Derivation |
| --- | --- |
| `locationsExplored` | Unique `location_opened` targets |
| `sourcesViewed` | Unique `source_opened` targets |
| `interventionsReviewed` | Unique `intervention_viewed` targets |
| `plansCreated` | Count of `plan_submitted` |
| `hintsRequested` | Count of `hint_requested` |
| `newEvidenceViewed` | Existence of `new_evidence_viewed` |
| `strategyChanged` | Existence of `strategy_changed` or `plan_revised` |
| `reflectionCompleted` | Existence of `reflection_answered` |

Mandatory methodological statement:

> Bu göstergeler gözlenen etkileşim süreçlerini tanımlar. Bunlar doğrulanmış yetkinlik puanları değildir.

## DATA / PRIVACY

- No login.
- No name.
- No email.
- No student profile.
- No free-text response for the "Diğer" reason option in v0.1.

Use anonymous session UUIDs.

`localStorage` may contain:

- `sessionId`
- Required anonymous UI/session state

Do not store personal information.

## SOURCE OF TRUTH

`SCENARIO_RULES.md` is the approved scenario logic specification.

During implementation, create `frontend/src/data/waterCrisisScenario.ts` from this specification.

Do not introduce additional game rules while converting the specification into code.

Stitch screenshots may still visually show the old budget values. Treat them as visual/layout references only. `SCENARIO_RULES.md` is authoritative for scenario values.
