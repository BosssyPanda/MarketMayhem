# Market Mayhem — Teaching-Game Review Report

## 1. Final verdict

**TEACHING GAME PASSED**

A beginner can play `MarketMayhem.java` for 30–45 minutes and actively practise for loops,
while loops, arrays, methods, sequential search, and binary search. All learning happens
inside the running terminal game; no source editing is required and there is no
`StudentWork.java`. Java XP is earned only by answering active challenges correctly, and
mastering a topic unlocks a trading tool that changes how the trading game plays.

## 2. Evidence checklist

| Requirement | Status | Evidence |
|---|---|---|
| Active questions asked **before** any answer is revealed | PASS | `askMultipleChoice`/`askShortAnswer` read input first; the only "Correct!"/"Incorrect" prints occur after the read (`MarketMayhem.java:332-345`, `:365-378`). Wrong-answer smoke shows 5 "Incorrect" + 5 "Why:" only after answers. |
| No passive XP (reading, menus, explanations) | PASS | `awardXpIfCorrect` is called only inside the two ask methods (`:342`, `:375`); the only `javaXp +=` is inside `awardXpIfCorrect` (`:405`). Wrong-answer smoke ends with `Java XP: 0`. |
| Wrong answers give no XP but a useful explanation | PASS | Wrong-answer smoke: `Java XP: 0`, `For Loops OPEN (0/5 correct)`, 5 explanations printed. |
| Six full Java floors, 5 active challenges each (Predict / Trace / Fix / Fill / Application) | PASS | `runForLoopFloor`, `runWhileLoopFloor`, `runArraysFloor`, `runMethodsFloor`, `runSequentialSearchFloor`, `runBinarySearchFloor`; academy/boss smoke asks 28 floor MCQs + 2 short answers. |
| Mastery requires correct answers (3 per topic) and gates unlocks | PASS | `updateTopicMastery` sets mastery at `topicCorrect >= 3`; `unlockAbilityIfMastered` then unlocks. Academy/boss smoke: `Mastered Topics: 6 / 6`, 6 abilities unlocked. |
| Unlocks affect trading gameplay (not decorative) | PASS | Market Scanner → View Market; Signal Decoder → Advance Day; Index Vision + Trade Calculator → Buy/Sell; Ticker Finder (`sequentialSearchTickerWithCount`) + Fast Broker (`binarySearchIdWithCount`) → Buy Stock index selection. |
| Mixed Review Boss: locked until all six mastered, 10 questions, 8/10 to pass | PASS | `runMixedReviewBoss` prints missing topics when locked; academy/boss smoke: `Boss Score: 10 / 10`. |
| Java Trading License: unlocks on pass, 20% bonus, shown in mastery report + final summary | PASS | `unlockJavaTradingLicense`, `getFinalScoreBonusPercent`=20, `getLicensedFinalNetWorth`; smoke shows `JAVA TRADING LICENSE UNLOCKED` and mastery report `Java Trading License: UNLOCKED`. |
| Developer tests pass and preserve game state | PASS | `99` runs 20 tests: `Developer Tests Passed: 20 / 20`, `Game state restored`, 0 FAIL. |
| Trading gameplay works (market, buy, sell, advance, exit) | PASS | Gameplay smoke: market + portfolio render, buy 1 APEX, sell 1 APEX, exit, 0 exceptions. |
| No forbidden features | PASS | Forbidden grep returns no matches. |
| Input is robust (nextLine only, EOF-safe) | PASS | `getMenuChoice`/`readIntInRange`/`readLine` use `nextLine()` + manual parse; 0 `nextInt` in the file; all four piped smoke streams exit with no exception. |

## 3. Commands run

1. `javac MarketMayhem.java`
2. `printf "1\n3\n4\n0\n1\n3\n5\n0\n2\n1\n0\n" | java MarketMayhem` (gameplay smoke)
3. `printf "6\n1\nA\nA\nA\nB\nD\n0\n7\n0\n" | java MarketMayhem` (wrong-answer smoke)
4. `printf "6\n1\nB\nB\nB\nA\nC\n2\nB\nD\nB\nA\nC\n3\nC\nB\nB\nA\n2\n4\nB\nC\nB\nB\nB\n5\nB\nC\nB\nA\n8\n6\nA\nB\nB\nA\nB\n7\nB\nC\nA\nC\nD\nB\nC\nA\nB\nB\n0\n7\n0\n" | java MarketMayhem` (full academy + boss smoke)
5. `printf "99\n0\n" | java MarketMayhem` (developer tests)
6. `grep -nE "ArrayList|HashMap|stream\(|lambda|Collections\.sort|Arrays\.sort|Arrays\.binarySearch|java\.util\.Random" MarketMayhem.java` (forbidden-feature check)

## 4. Result of each command

| # | Command | Result |
|---|---|---|
| 1 | `javac MarketMayhem.java` | **COMPILE OK** (no errors/warnings) |
| 2 | gameplay smoke | **PASS** — View Market, Portfolio, Buy 1 @ index 0 ($45), Sell 1 @ index 0, exit; 0 exceptions |
| 3 | wrong-answer smoke | **PASS** — `Java XP: 0`; `For Loops OPEN (0/5 correct) -> Market Scanner LOCKED`; 5 "Incorrect" + 5 "Why:" explanations after answers; 0 exceptions |
| 4 | full academy + boss smoke | **PASS** — 6 abilities unlocked in order; 38 MCQs asked; `Boss Score: 10 / 10`; `JAVA TRADING LICENSE UNLOCKED`; mastery report `Java Trading License: UNLOCKED`; `Mastered Topics: 6 / 6`; 0 exceptions |
| 5 | developer tests | **PASS** — `Developer Tests Passed: 20 / 20`; `ALL DEVELOPER TESTS PASSED`; `Game state restored`; 0 FAIL |
| 6 | forbidden-feature grep | **PASS** — no matches |

## 5. Remaining risks

- **None affecting teaching.** Every Java learning path (floors, boss, unlocks, mastery,
  developer tests) is deterministic and verified.
- Daily price movement uses `Math.random`, so the trading outcome (final net-worth rating) is
  intentionally non-deterministic. This is by design and does not affect any teaching
  requirement, XP accounting, mastery, or unlock logic. Prices are floored at $1 so they never
  go non-positive and never crash the day-15 / bankruptcy logic.
- The required input helpers are present as `readLine`, `parseIntManually`, `readIntInRange`,
  and `getMenuChoice` (the mission allows "or equivalent"); all use `nextLine()` only and
  handle invalid input by re-prompting and end-of-input by exiting/cancelling safely.
