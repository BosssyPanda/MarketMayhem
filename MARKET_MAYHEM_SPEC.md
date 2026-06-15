# Market Mayhem: Java Trading Academy — Specification

## What the game is

A single-file terminal Java game (`MarketMayhem.java`) that teaches beginner Java **through
play**. The student trades fake stocks and unlocks trading tools by mastering Java topics in
the Java Trading Academy. There is no source editing: the student learns by playing.

Build/run:

```bash
javac MarketMayhem.java
java MarketMayhem
```

## Starting state

- $1000 cash, Day 1 of 15.
- 8 stocks in parallel arrays: `tickers`, `stockIds`, `prices`, `previousPrices`,
  `sharesOwned`, `riskLevels`.
- Daily prices move randomly within `±(riskLevel + 2)` using `Math.random`, floored at $1.
- Win at $1500 net worth, legendary at $2200, bankrupt (game over) at $200 or below,
  final day is Day 15.

## Main menu

```
MARKET MAYHEM: JAVA TRADING ACADEMY
0. Exit
1. View Market
2. Advance Day
3. View Portfolio
4. Buy Stock
5. Sell Stock
6. Java Trading Academy
7. Mastery Report
8. Toggle Learning Mode
99. Run Developer Tests
```

The header always shows Day, Cash, Portfolio Value, Net Worth, Java XP, Questions
Correct/Answered, Learning Mode ON/OFF, and Java Trading License LOCKED/UNLOCKED.

## Learning rules

- No XP for reading or opening menus. All XP comes from correct answers.
- Every question: show it, read input, then reveal correct/incorrect, then explain.
- Five active challenge types: Predict Output, Trace Variable, Fix Bug, Fill Blank,
  Stock Application.
- A topic is **mastered** at 3 correct answers (`topicCorrect[t] >= 3`). Mastery unlocks the
  topic's trading tool immediately and permanently. Wrong answers give no XP but still count
  as attempts.

## Java Trading Academy

```
JAVA TRADING ACADEMY
0. Return to Market
1. For Loop Floor
2. While Loop Floor
3. Arrays Floor
4. Methods Floor
5. Sequential Search Floor
6. Binary Search Floor
7. Mixed Review Boss
```

The hub shows Java XP, Questions Correct/Answered, Mastered Topics X/6, each floor's status
(OPEN/MASTERED), each ability's status (LOCKED/UNLOCKED), and the boss status
(LOCKED until all six mastered, OPEN when all mastered, PASSED after the license is earned).

### Floors (5 questions each) and their unlocks

| Floor | Topic | Teaches | Unlocks |
|------|-------|---------|---------|
| 1 | For Loops | init/condition/update, `i < length`, off-by-one | **Market Scanner** |
| 2 | While Loops | condition, update step, infinite-loop risk, `%` and `/` | **Signal Decoder** |
| 3 | Arrays | index 0, last index `length - 1`, parallel arrays | **Index Vision** |
| 4 | Methods | signature, params, return type, calls | **Trade Calculator** |
| 5 | Sequential Search | linear scan, return index or -1, comparison count | **Ticker Finder** |
| 6 | Binary Search | sorted data, low/high/mid, halving, comparison count | **Fast Broker** |

### Unlock effects (all award no XP)

- **Market Scanner** — in View Market: prints the scan loop, first/last index, count, and
  (Learning Mode) traces each `i -> ticker`.
- **Signal Decoder** — before Advance Day changes prices: generates a 100–999 signal, prints
  its digit count (while loop), last digit (`% 10`), reduced value (`/ 10`), and a
  non-mutating volatility hint.
- **Index Vision** — in Buy/Sell: prints the valid index range, warns that
  `prices[prices.length]` is invalid, and (Learning Mode) explains parallel arrays.
- **Trade Calculator** — in Buy/Sell before the trade: prints `calculateTradeValue(index,
  shares)`, the formula, price, shares, and trade value.
- **Ticker Finder** — in Buy Stock: optional manual sequential search by ticker, with
  comparison count and (Learning Mode) per-index trace.
- **Fast Broker** — in Buy Stock: optional manual binary search by stock ID, with sorted
  check, comparison count, and (Learning Mode) low/high/mid trace.

## Mixed Review Boss

- Academy option 7. Locked until all six topics are mastered (lists what's still needed).
- When open: 10 active questions; passing score is 8/10.
- Tracks `mixedBossAttempts` and `mixedBossBestScore`.
- Passing unlocks the **Java Trading License**, which grants a 20% final-score bonus
  (`getLicensedFinalNetWorth`).

## Final summary

On game over (final day or bankruptcy) the game prints net worth, licensed final net worth,
Java XP, questions correct/answered, mastered topics, license status, boss best score, and a
final rating (Legendary / Profitable / Rookie / Bankrupt).

## Developer tests (option 99)

Simple PASS/FAIL output (no JUnit). Covers index validation, portfolio/trade math, sequential
and binary search (found / not found / comparison count), sorted check, topic mastery
unlocks, ability names, license bonus, and the while-loop digit helpers. All game state is
snapshotted before and restored after, so running the tests never corrupts a game in
progress (`copyIntArray`, `copyBooleanArray`).

## Constraints

Beginner Java only: arrays, `for`/`while`, `static` methods, `Scanner`, `Math.random`,
`if`/`else`, `String` methods, manual sequential and binary search. One `Scanner`,
`nextLine()` everywhere, integers parsed by hand; end-of-input is a clean exit/cancel.
Forbidden: `ArrayList`, `HashMap`, streams, lambdas, `Arrays.sort`, `Arrays.binarySearch`,
`Collections.sort`, `java.util.Random`, JavaFX, Swing, libGDX, Maven, Gradle, external
libraries, file saving, networking, graphics, `StudentWork.java`, source-editing workflows.

## Validation commands

```bash
javac MarketMayhem.java
printf "1\n3\n4\n0\n1\n3\n5\n0\n2\n1\n0\n" | java MarketMayhem
printf "6\n1\nB\nB\nB\nA\nC\n2\nB\nD\nB\nA\nC\n3\nC\nB\nB\nA\n2\n4\nB\nC\nB\nB\nB\n5\nB\nC\nB\nA\n8\n6\nA\nB\nB\nA\nB\n7\nB\nC\nA\nC\nD\nB\nC\nA\nB\nB\n0\n7\n0\n" | java MarketMayhem
printf "6\n1\nA\nA\nA\nB\nD\n0\n7\n0\n" | java MarketMayhem
printf "99\n0\n" | java MarketMayhem
grep -nE "ArrayList|HashMap|stream\(|lambda|Collections\.sort|Arrays\.sort|Arrays\.binarySearch|java\.util\.Random" MarketMayhem.java
```
