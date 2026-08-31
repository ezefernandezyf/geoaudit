# Delta for Citability Engine

> **Change**: `sprint-11-rebrand-polish` · **Type**: Delta (MODIFIED)

## MODIFIED Requirements

### Requirement: Top/Bottom Block Output (RCI-10)

The system MUST return the top 3 and bottom 3 blocks with individual dimension scores and excerpts. The bottom 3 MUST be derived from blocks NOT in the top 3, so the two lists are disjoint. When fewer than 3 non-overlapping blocks remain, the system MUST show fewer bottom blocks rather than repeating a top block.
(Previously: top3 and bottom3 were computed independently from the same array and could overlap.)

#### Scenario: Disjoint on long pages

- GIVEN a page with 8 scored blocks
- WHEN top/bottom output is computed
- THEN the top 3 and bottom 3 share no block

#### Scenario: Five blocks → 3 top + 2 bottom

- GIVEN a page with 5 scored blocks
- WHEN top/bottom output is computed
- THEN the top 3 and bottom 2 are disjoint (no overlap)

#### Scenario: Three blocks → 3 top + 0 bottom

- GIVEN a page with exactly 3 scored blocks
- WHEN top/bottom output is computed
- THEN the top 3 is returned and the bottom list is empty (fewer shown, never repeated)

#### Scenario: Four blocks → 3 top + 1 bottom

- GIVEN a page with 4 scored blocks
- WHEN top/bottom output is computed
- THEN the bottom list contains only the 1 block not in the top 3, with no duplication
