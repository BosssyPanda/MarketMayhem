# Market Mayhem: Java Trading Academy

A complete, playable **terminal Java game**. The student learns Java **by playing the
game** — there is no source-editing workflow. The game (built by Codex/Claude) presents
active challenges; the student plays to learn.

## Build and run

```bash
javac MarketMayhem.java
java MarketMayhem
```

Everything lives in a single source file: `MarketMayhem.java` (one public class,
default package). Compiled `.class` files are build artifacts and are git-ignored — never
treat them as source.

## How the student learns

- The student **plays**, never edits source. There is **no `StudentWork.java`** and no
  "fill in this method" lab.
- **No XP for reading.** Opening a menu, viewing the market, or reading an unlock hint
  awards nothing.
- **All XP requires a correct answer** to an active challenge. Every question is shown,
  the student's input is read, and only then is correctness revealed and explained.
- Mastering a topic (3 correct answers) **immediately and permanently** unlocks a trading
  tool used during real gameplay.

## Game shape

- Start with $1000 cash, Day 1 of 15, 8 fake stocks with risk-driven daily price moves.
- Trade via Buy/Sell; track cash, portfolio value, and net worth.
- The **Java Trading Academy** has six floors (For Loops, While Loops, Arrays, Methods,
  Sequential Search, Binary Search). Each normal floor asks **5 active questions**.
- Mastering all six floors opens the **Mixed Review Boss** (10 questions, pass at 8/10),
  which unlocks the **Java Trading License** (20% final-score bonus).

## Constraints (do not violate)

Beginner Java only: arrays, `for`/`while` loops, `static` methods, `Scanner`,
`Math.random`, `if`/`else`, `String` methods, manual sequential search, manual binary
search.

**Forbidden:** `ArrayList`, `HashMap`, streams, lambdas, `Arrays.sort`,
`Arrays.binarySearch`, `Collections.sort`, `java.util.Random`, JavaFX, Swing, libGDX,
Maven, Gradle, external libraries, file saving, networking, graphics, `StudentWork.java`,
any source-editing workflow.

**Input rule:** one `Scanner`, `nextLine()` everywhere, integers parsed by hand
(`parseIntManually`). Never mix `nextInt()` and `nextLine()`. End-of-input is treated as a
clean exit/cancel so piped input never crashes the game.

## Validation

```bash
# 1. Compile
javac MarketMayhem.java

# 2. Gameplay smoke (view market, portfolio, buy, sell, exit)
printf "1\n3\n4\n0\n1\n3\n5\n0\n2\n1\n0\n" | java MarketMayhem

# 3. Full academy + boss (all six floors, boss, license unlock)
printf "6\n1\nB\nB\nB\nA\nC\n2\nB\nD\nB\nA\nC\n3\nC\nB\nB\nA\n2\n4\nB\nC\nB\nB\nB\n5\nB\nC\nB\nA\n8\n6\nA\nB\nB\nA\nB\n7\nB\nC\nA\nC\nD\nB\nC\nA\nB\nB\n0\n7\n0\n" | java MarketMayhem

# 4. Wrong answers earn no XP and no unlocks
printf "6\n1\nA\nA\nA\nB\nD\n0\n7\n0\n" | java MarketMayhem

# 5. Developer tests (state preserved)
printf "99\n0\n" | java MarketMayhem

# 6. Forbidden-feature check (expect no matches)
grep -nE "ArrayList|HashMap|stream\(|lambda|Collections\.sort|Arrays\.sort|Arrays\.binarySearch|java\.util\.Random" MarketMayhem.java
```
