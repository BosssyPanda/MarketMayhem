// Beginner Java teaching content — the "deep half" of the lesson system.
//
// The engine (engine/Objectives.java) owns each objective's short GOAL text,
// checks, starter, and unlock. This file owns the *teaching*: for every concept
// a player meets, a plain-English explanation, the syntax, a walked example,
// how it maps to a drone/farm action, and the mistakes beginners actually make.
//
// Keyed by the same `concept` string the engine tags each objective with, plus
// "woven" sub-topics (if/else, nested loops, %/ , 2D arrays, String methods…)
// that show up across objectives and on the Concepts roadmap. Pure data — no
// engine, no contract, no side effects.

export interface WalkthroughStep {
  code: string;
  note: string;
}

export interface ConceptLesson {
  /** Matches ObjectiveInfo.concept (or a woven sub-topic key). */
  concept: string;
  /** Human title, e.g. "for loops". */
  title: string;
  /** One line for the roadmap + tab header. */
  summary: string;
  /** Plain-English teaching, one paragraph per entry. */
  explanation: string[];
  /** The bare syntax shape, as a code block. */
  syntax: string;
  /** A real example walked line-by-line. */
  walkthrough: WalkthroughStep[];
  /** How the concept maps to a drone/farm action in this game. */
  gameMapping: string;
  /** The errors beginners hit, phrased as "watch out for…". */
  commonMistakes: string[];
  /** Woven concept keys worth reading alongside this one. */
  related?: string[];
}

// A core concept that anchors an objective gets `isCore: true`; woven topics
// are surfaced inside the relevant Learn tab and listed on the roadmap.
export interface ConceptMeta {
  isCore: boolean;
}

export const CORE_CONCEPT_META: Record<string, ConceptMeta> = {
  methods: { isCore: true },
  "variables-types": { isCore: true },
  "modulo-division": { isCore: true },
  "comparison-operators": { isCore: true },
  "if-else": { isCore: true },
  "for-loops": { isCore: true },
  "nested-loops": { isCore: true },
  "while-loops": { isCore: true },
  arrays: { isCore: true },
  "static-methods": { isCore: true },
  "sequential-search": { isCore: true },
  "binary-search": { isCore: true },
  "bubble-sort": { isCore: true },
  "selection-sort": { isCore: true },
  "recursion-puzzles": { isCore: false },
};

// Sub-topics woven through the cores (taught via lessons + drills, not their own
// objective track). Listed on the roadmap's "woven throughout" row.
export const WOVEN_CONCEPTS = ["2d-arrays", "string-methods"] as const;

const LESSONS: Record<string, ConceptLesson> = {
  // ---------------------------------------------------------------- CORE: methods
  methods: {
    concept: "methods",
    title: "Methods & sequencing",
    summary: "Call named instructions in order — the bedrock of every program.",
    explanation: [
      "A method is a named action you can ask something to perform. drone.moveEast() and drone.plant(Crop.WHEAT) are methods on the drone — each one tells it to do exactly one thing.",
      "Programs run top to bottom. The order of your method calls is the order the drone acts in. Move first, then plant, and the drone plants on the new tile; swap them and it plants on the old one.",
      "Some methods take inputs in the parentheses (arguments), like plant(Crop.WHEAT). Some give a value back (return), like harvest() handing you the crop it picked.",
    ],
    syntax: "object.methodName();            // no input\nobject.methodName(argument);    // with input\nType result = object.methodName(); // keep what it returns",
    walkthrough: [
      { code: "drone.moveEast();", note: "Step the drone one tile east. This call costs ticks — the world advances." },
      { code: "drone.plant(Crop.WHEAT);", note: "Plant wheat on the tile the drone is now standing on." },
      { code: "drone.watch(\"planted\", 1);", note: "Send a value to the live Inspector so you can see progress as it runs." },
    ],
    gameMapping: "Every drone.* call IS a method call. The whole game is sequencing these methods to automate the farm.",
    commonMistakes: [
      "Forgetting the semicolon ; at the end of a statement.",
      "Forgetting the parentheses () — drone.moveEast without () does not call the method.",
      "Wrong order: planting before moving puts the crop on the wrong tile.",
    ],
    related: ["variables-types"],
  },

  // -------------------------------------------------------------- CORE: for-loops
  "for-loops": {
    concept: "for-loops",
    title: "for loops",
    summary: "Repeat code a known number of times with a counter.",
    explanation: [
      "A for loop repeats a block of code. Use it when you know how many times to repeat — like 'do this for every tile in the row'.",
      "It has three parts in the header: start (int x = 0), the keep-going test (x < farm.width()), and the step (x++). The body runs, then the step runs, then the test is checked again.",
      "The counter (x here) usually doubles as an index or position, so the same code does slightly different work each pass.",
    ],
    syntax: "for (int x = 0; x < limit; x++) {\n    // runs once for each value of x: 0, 1, 2, ... limit-1\n}",
    walkthrough: [
      { code: "for (int x = 0; x < farm.width(); x++) {", note: "Start x at 0, keep going while x is less than the field width, add 1 each pass." },
      { code: "    drone.plant(Crop.WHEAT);", note: "Body: plant on the current tile. Runs once per column." },
      { code: "    if (x < farm.width() - 1) drone.moveEast();", note: "Move east between tiles, but not after the last one (you'd fall off the field)." },
      { code: "}", note: "End of the loop body. Control jumps back to the step (x++), then the test." },
    ],
    gameMapping: "Sweeping a whole row of tiles: one loop pass = one tile planted, then a step east.",
    commonMistakes: [
      "Off-by-one: using <= instead of < runs one extra time and walks off the field.",
      "Moving after the final tile — guard the move with if (x < width - 1).",
      "Changing the counter inside the body and in the header, causing skips.",
    ],
    related: ["comparison-operators", "nested-loops", "if-else"],
  },

  // ----------------------------------------------------------------- CORE: arrays
  arrays: {
    concept: "arrays",
    title: "Arrays & parallel arrays",
    summary: "Hold many values in one ordered list, read by index.",
    explanation: [
      "An array is a fixed-size, ordered list of values of the same type. farm.prices() hands you an int[] — a row of numbers.",
      "You read a value by its index, starting at 0: prices[0] is the first, prices[prices.length - 1] is the last. prices.length is how many there are.",
      "Parallel arrays line up by index: crops[i] is the crop whose price is prices[i]. Walk one index across both to keep them in sync.",
    ],
    syntax: "int[] prices = farm.prices();\nint first = prices[0];\nint count = prices.length;\nfor (int i = 0; i < prices.length; i++) { /* prices[i] */ }",
    walkthrough: [
      { code: "int[] prices = farm.prices();", note: "Grab the array of stall prices." },
      { code: "int total = 0;", note: "An accumulator to add into." },
      { code: "for (int i = 0; i < prices.length; i++) {", note: "Visit every index 0..length-1." },
      { code: "    total += prices[i];", note: "Add the price at this index to the running total." },
    ],
    gameMapping: "The market stall is two parallel arrays — crops() (names) and prices() (numbers) — read together by index.",
    commonMistakes: [
      "Index out of bounds: prices[prices.length] does not exist; the last valid index is length - 1.",
      "Starting min/max at 0 instead of prices[0] — a real price might be larger or all values positive.",
      "Letting the two parallel arrays drift out of step by using different indexes.",
    ],
    related: ["for-loops", "2d-arrays", "variables-types"],
  },

  // ------------------------------------------------------------- CORE: while-loops
  "while-loops": {
    concept: "while-loops",
    title: "while loops",
    summary: "Repeat while a condition holds — when you don't know the count.",
    explanation: [
      "A while loop repeats as long as its condition is true. Use it when you can't predict the number of repetitions — 'harvest until the row is empty'.",
      "Something inside the loop must eventually make the condition false, or it never stops. With the drone that's usually moving toward an edge or shrinking a number.",
      "while pairs naturally with % (remainder) and / (integer divide) to peel a number apart digit by digit — n % 10 is the last digit, n / 10 drops it.",
    ],
    syntax: "while (condition) {\n    // repeats until condition becomes false\n}",
    walkthrough: [
      { code: "int n = farm.moisture()[0];", note: "Say n is 314 — a code to decode digit by digit." },
      { code: "while (n > 0) {", note: "Keep going while there are digits left." },
      { code: "    int digit = n % 10;", note: "% 10 gives the last digit (4, then 1, then 3)." },
      { code: "    n = n / 10;", note: "Integer divide drops the last digit (314 -> 31 -> 3 -> 0). Now the loop can end." },
    ],
    gameMapping: "Harvesting an unknown number of ripe tiles, or decoding an irrigation code — loop until done, not a fixed count.",
    commonMistakes: [
      "Infinite loop: forgetting to change the variable the condition tests.",
      "Using / when you meant % (or vice versa) when splitting digits.",
      "Off-by-one at the edge: test the stop condition before acting, not after.",
    ],
    related: ["modulo-division", "comparison-operators", "if-else"],
  },

  // ------------------------------------------------------ CORE: sequential-search
  "sequential-search": {
    concept: "sequential-search",
    title: "Sequential search",
    summary: "Check each element in turn until you find the target.",
    explanation: [
      "Sequential (linear) search walks an array from the start, comparing each element to what you want, and stops at the first match.",
      "Return the index where you found it, or -1 if you reach the end without a match. Starting the answer at -1 means 'not found yet'.",
      "It works on any array, sorted or not — that's its strength. Its cost grows with the list size (you may check every element).",
    ],
    syntax: "int found = -1;\nfor (int i = 0; i < a.length; i++) {\n    if (a[i].equals(target)) { found = i; break; }\n}",
    walkthrough: [
      { code: "int found = -1;", note: "Assume not found until proven otherwise." },
      { code: "for (int i = 0; i < crops.length; i++) {", note: "Scan left to right." },
      { code: "    if (crops[i].equals(\"PUMPKIN\")) {", note: "Compare names with .equals, never == for Strings." },
      { code: "        found = i; break;", note: "Record the index and stop early — no need to keep looking." },
    ],
    gameMapping: "The crop locator scanning crops() left to right for a target crop, counting comparisons as it goes.",
    commonMistakes: [
      "Using == to compare Strings instead of .equals() — == checks identity, not text.",
      "Forgetting break, so a later match overwrites the first one you wanted.",
      "Not handling 'not found' — leaving found uninitialized instead of -1.",
    ],
    related: ["if-else", "string-methods", "for-loops"],
  },

  // ---------------------------------------------------------- CORE: binary-search
  "binary-search": {
    concept: "binary-search",
    title: "Binary search",
    summary: "Halve a SORTED list each step — far fewer comparisons.",
    explanation: [
      "Binary search only works on a sorted array. You track a window with low and high, look at the middle, and throw away the half that can't contain the target.",
      "If the middle equals the target, you're done. If the middle is too small, move low above mid; if too big, move high below mid. The window shrinks by half each step.",
      "That halving is why it's fast: a list of 1000 takes ~10 checks, not 1000. Objectives cap comparisons so a linear scan won't pass.",
    ],
    syntax: "int low = 0, high = a.length - 1;\nwhile (low <= high) {\n    int mid = (low + high) / 2;\n    if (a[mid] == target) { found = mid; break; }\n    if (a[mid] < target) low = mid + 1; else high = mid - 1;\n}",
    walkthrough: [
      { code: "int low = 0, high = prices.length - 1;", note: "The search window starts as the whole array." },
      { code: "while (low <= high) {", note: "Keep going while the window is non-empty." },
      { code: "    int mid = (low + high) / 2;", note: "Look at the middle index." },
      { code: "    if (prices[mid] < target) low = mid + 1;", note: "Too small — discard the left half (everything up to mid)." },
      { code: "    else high = mid - 1;", note: "Too big — discard the right half. Either way the window halves." },
    ],
    gameMapping: "Fast Market: prices() arrives sorted ascending, and the comparison budget forces a real low/high/mid search.",
    commonMistakes: [
      "Running it on an unsorted array — binary search needs sorted input.",
      "Forgetting mid +/- 1, so low and high never move and the loop spins forever.",
      "Using < where you need <= in the while test, missing the last element.",
    ],
    related: ["comparison-operators", "while-loops", "arrays"],
  },

  // ------------------------------------------------------------- CORE: bubble-sort
  "bubble-sort": {
    concept: "bubble-sort",
    title: "Bubble sort",
    summary: "Compare neighbours and swap until the list is ordered.",
    explanation: [
      "Bubble sort makes repeated passes over the array. On each pass it compares each pair of neighbours and swaps them if they're out of order.",
      "After one pass the largest value has 'bubbled' to the end, so each pass can stop one element earlier. Repeat until a full pass makes no swaps.",
      "It's not the fastest sort, but it's the clearest way to see ordering happen — every swap is a visible, local move.",
    ],
    syntax: "for (int pass = 0; pass < a.length - 1; pass++) {\n    for (int i = 0; i < a.length - 1 - pass; i++) {\n        if (a[i] > a[i + 1]) { /* swap a[i], a[i+1] */ }\n    }\n}",
    walkthrough: [
      { code: "int t = a[i];", note: "A swap needs a temp variable so you don't lose a value." },
      { code: "a[i] = a[i + 1];", note: "Copy the right neighbour left." },
      { code: "a[i + 1] = t;", note: "Put the saved value on the right. The pair is now in order." },
      { code: "swaps++;", note: "Watch the swap count to see the sort working." },
    ],
    gameMapping: "Tidy the Stalls: bubble-sort a COPY of prices() ascending so the market view reads in order.",
    commonMistakes: [
      "Sorting the farm's array directly instead of a copy — mutate a copy.",
      "Swapping without a temp variable, which overwrites one value with the other.",
      "Comparing a[i] with a[i] (same index) instead of a[i] with a[i + 1].",
    ],
    related: ["nested-loops", "comparison-operators", "arrays"],
  },

  // ---------------------------------------------------------- CORE: selection-sort
  "selection-sort": {
    concept: "selection-sort",
    title: "Selection sort",
    summary: "Pick the best of the rest and place it in the next slot.",
    explanation: [
      "Selection sort builds the sorted list one slot at a time. For each slot, scan the remaining unsorted elements, find the best one, and swap it into place.",
      "'Best' depends on the order you want: smallest for ascending, largest for descending. You track the index of the best seen so far.",
      "When two arrays are parallel (crops and prices), swap BOTH together so a name always stays with its price.",
    ],
    syntax: "for (int slot = 0; slot < a.length - 1; slot++) {\n    int best = slot;\n    for (int i = slot + 1; i < a.length; i++)\n        if (a[i] > a[best]) best = i;\n    // swap a[slot] with a[best]\n}",
    walkthrough: [
      { code: "int best = slot;", note: "Assume the current slot holds the best, then look for better." },
      { code: "for (int i = slot + 1; i < prices.length; i++)", note: "Scan only the unsorted tail." },
      { code: "    if (prices[i] > prices[best]) best = i;", note: "Found a bigger value (descending) — remember its index." },
      { code: "// swap prices[slot]<->prices[best] AND crops[slot]<->crops[best]", note: "Move the winner into place, keeping the parallel arrays aligned." },
    ],
    gameMapping: "Pick the Best: selection-sort crops by value (descending) so the highest-value crop ranks first.",
    commonMistakes: [
      "Swapping prices but forgetting to swap the parallel crops array too.",
      "Resetting best to slot inside the inner loop instead of before it.",
      "Comparing values but swapping the wrong indexes.",
    ],
    related: ["nested-loops", "arrays", "comparison-operators"],
  },

  // ------------------------------------------------------ open phase: recursion
  "recursion-puzzles": {
    concept: "recursion-puzzles",
    title: "Recursion & puzzles",
    summary: "A method that calls itself — unlocked after the 8 cores.",
    explanation: [
      "Recursion is a method that solves a big problem by calling itself on a smaller one. Every recursion needs a base case that stops it, or it runs forever.",
      "sumTo(10) = 10 + sumTo(9) = 10 + 9 + sumTo(8) ... down to sumTo(0) = 0 (the base case), then the additions unwind back up to 55.",
      "This is the open-ended phase: recursion and logic puzzles that keep growing once you've mastered the eight core concepts.",
    ],
    syntax: "int sumTo(int n) {\n    if (n == 0) return 0;   // base case\n    return n + sumTo(n - 1); // smaller subproblem\n}",
    walkthrough: [
      { code: "if (n == 0) return 0;", note: "Base case — the smallest problem you can answer directly. Without it, recursion never ends." },
      { code: "return n + sumTo(n - 1);", note: "Recursive step — combine n with the answer to a smaller call." },
      { code: "int result = sumTo(10);", note: "Kick it off. The calls stack down to 0, then add back up to 55." },
      { code: "drone.watch(\"recursiveSum\", result);", note: "Show your answer in the Inspector." },
    ],
    gameMapping: "Mastery Garden: the first open-ended puzzle uses a tiny recursive helper instead of a loop.",
    commonMistakes: [
      "No base case (or one that's never reached) — infinite recursion / stack overflow.",
      "Recursing on the same size instead of a smaller one, so it never shrinks.",
      "Forgetting to combine the recursive result (just calling it and dropping the value).",
    ],
    related: ["methods", "if-else"],
  },

  // ============================================================ WOVEN sub-topics
  "variables-types": {
    concept: "variables-types",
    title: "Variables & types",
    summary: "Named boxes for values: int, double, boolean, char, String.",
    explanation: [
      "A variable is a named box holding a value. You declare it with a type then a name: int count = 0.",
      "Java is typed: int (whole numbers), double (decimals), boolean (true/false), char (one letter), String (text). The type fixes what fits in the box.",
      "Reassign with name = newValue. Declare once, reassign as often as you like.",
    ],
    syntax: "int count = 0;\ndouble average = 12.5;\nboolean done = false;\nString name = \"WHEAT\";",
    walkthrough: [
      { code: "int total = 0;", note: "Declare an int and start it at 0." },
      { code: "total = total + 5;", note: "Reassign: compute on the right, store back on the left." },
      { code: "boolean found = false;", note: "A flag you flip to true when something happens." },
    ],
    gameMapping: "Counters, totals, and flags you watch() so the Inspector shows your program's state.",
    commonMistakes: [
      "Mixing types: putting a decimal into an int truncates it.",
      "Using a variable before giving it a value.",
      "int / int is integer division: 7 / 2 is 3, not 3.5.",
    ],
    related: ["modulo-division"],
  },

  "comparison-operators": {
    concept: "comparison-operators",
    title: "Comparisons & booleans",
    summary: "==, !=, <, >, <=, >= produce true/false to drive decisions.",
    explanation: [
      "Comparison operators ask a yes/no question and answer with a boolean: a < b, a == b, a >= b.",
      "These feed if statements and loop conditions. == compares numbers, but for Strings you must use .equals().",
      "Combine conditions with && (and), || (or), ! (not): x >= 0 && x < width.",
    ],
    syntax: "a == b   a != b   a < b   a <= b\ncond1 && cond2   cond1 || cond2   !cond",
    walkthrough: [
      { code: "if (x < farm.width() - 1) { ... }", note: "A comparison that decides whether moving is safe." },
      { code: "while (low <= high) { ... }", note: "A comparison that keeps a loop alive." },
      { code: "if (a >= 0 && a < n) { ... }", note: "Two comparisons combined with && (both must hold)." },
    ],
    gameMapping: "Bounds checks (don't walk off the field) and loop conditions everywhere.",
    commonMistakes: [
      "Using = (assignment) where you meant == (comparison).",
      "Comparing Strings with == instead of .equals().",
      "Confusing < and <= at the boundary (off-by-one).",
    ],
    related: ["if-else", "string-methods"],
  },

  "if-else": {
    concept: "if-else",
    title: "if / else",
    summary: "Branch: run different code depending on a condition.",
    explanation: [
      "if runs its block only when the condition is true. else gives an alternative when it's false. else if chains more cases.",
      "Conditions are booleans — usually a comparison. The branch not taken is skipped entirely.",
      "Use it to react: only move when there's room, only swap when out of order, only record the first match.",
    ],
    syntax: "if (condition) {\n    // when true\n} else if (other) {\n    // when that's true\n} else {\n    // otherwise\n}",
    walkthrough: [
      { code: "if (prices[i] > prices[i + 1]) {", note: "Only enter when the pair is out of order." },
      { code: "    // swap them", note: "This runs solely in the true case." },
      { code: "}", note: "If the condition was false, the whole block was skipped." },
    ],
    gameMapping: "Deciding whether to plant, harvest, move, or swap based on the tile or the data.",
    commonMistakes: [
      "Putting a ; right after if (...) — it makes the body empty.",
      "Forgetting braces, so only the first line is inside the if.",
      "Assuming else runs always — it runs only when the if was false.",
    ],
    related: ["comparison-operators"],
  },

  "nested-loops": {
    concept: "nested-loops",
    title: "Nested loops",
    summary: "A loop inside a loop — sweep a grid or compare every pair.",
    explanation: [
      "A nested loop is a loop in the body of another loop. The inner loop runs fully for each single pass of the outer one.",
      "Two counters (e.g. row y and column x) let you visit every cell of a grid, or every pass/element pair in a sort.",
      "If the outer runs N times and the inner M times, the body runs N x M times — keep an eye on the total work.",
    ],
    syntax: "for (int y = 0; y < rows; y++) {\n    for (int x = 0; x < cols; x++) {\n        // runs rows * cols times\n    }\n}",
    walkthrough: [
      { code: "for (int pass = 0; pass < n - 1; pass++)", note: "Outer loop: one pass per sort round." },
      { code: "    for (int i = 0; i < n - 1 - pass; i++)", note: "Inner loop: walk the neighbours this pass." },
      { code: "        if (a[i] > a[i + 1]) swap(...);", note: "The body runs for every (pass, i) pair." },
    ],
    gameMapping: "Sweeping the whole field row-by-row, and the heart of bubble/selection sort.",
    commonMistakes: [
      "Reusing the same counter name for both loops.",
      "Resetting the inner counter in the wrong place.",
      "Forgetting the cost multiplies — nested loops over big data get slow.",
    ],
    related: ["for-loops", "bubble-sort", "2d-arrays"],
  },

  "2d-arrays": {
    concept: "2d-arrays",
    title: "2D arrays & grids",
    summary: "A grid of values addressed by [row][column].",
    explanation: [
      "A 2D array is an array of arrays — a grid. You read a cell with two indexes: grid[row][col].",
      "grid.length is the number of rows; grid[0].length is the number of columns. A nested loop visits every cell.",
      "The farm itself is a grid; you address tiles by (x, y) — column and row — the same idea.",
    ],
    syntax: "int[][] grid = new int[rows][cols];\nint cell = grid[r][c];\nfor (int r = 0; r < grid.length; r++)\n    for (int c = 0; c < grid[r].length; c++) { /* grid[r][c] */ }",
    walkthrough: [
      { code: "for (int y = 0; y < farm.height(); y++)", note: "Outer loop over rows." },
      { code: "    for (int x = 0; x < farm.width(); x++)", note: "Inner loop over columns — visits every tile." },
      { code: "        drone moves/plants at (x, y)", note: "Address each cell by its (column, row)." },
    ],
    gameMapping: "Sweeping the entire field — every (x, y) tile — to plant or harvest the whole farm.",
    commonMistakes: [
      "Swapping row and column order ([col][row] vs [row][col]).",
      "Using grid.length for the column count (it's the row count).",
      "Walking off the edge — guard both x and y against width/height.",
    ],
    related: ["nested-loops", "arrays"],
  },

  "modulo-division": {
    concept: "modulo-division",
    title: "% and / (remainder & divide)",
    summary: "Split numbers apart: % is the remainder, / divides.",
    explanation: [
      "% (modulo) gives the remainder after division: 314 % 10 is 4, 7 % 2 is 1. It's how you grab the last digit or test even/odd.",
      "/ between two ints is integer division — it throws away the fraction: 314 / 10 is 31, 7 / 2 is 3.",
      "Together they peel a number apart: % 10 reads the last digit, / 10 removes it. Loop and you've read every digit.",
    ],
    syntax: "int last = n % 10;   // remainder -> last digit\nint rest = n / 10;   // integer divide -> drop last digit\nboolean even = (n % 2 == 0);",
    walkthrough: [
      { code: "int digit = n % 10;", note: "For 314, this is 4 — the last digit." },
      { code: "n = n / 10;", note: "Now n is 31 — the digit is gone." },
      { code: "// repeat in a while loop until n == 0", note: "Each pass reads one more digit, right to left." },
    ],
    gameMapping: "Decoding the irrigation code digit by digit in the while-loop objective.",
    commonMistakes: [
      "Expecting / to keep decimals — int / int truncates.",
      "Swapping % and / (remainder vs quotient).",
      "Dividing by zero — guard against it.",
    ],
    related: ["while-loops", "variables-types"],
  },

  "string-methods": {
    concept: "string-methods",
    title: "String methods",
    summary: "Compare and inspect text — .equals(), .length(), .charAt().",
    explanation: [
      "A String is text. Compare two Strings with a.equals(b), NOT a == b — == checks if they're the same object, not the same letters.",
      "Useful methods: s.length() (how many characters), s.charAt(i) (the character at index i), s.equals(other) (same text?).",
      "Crop names arrive as Strings (\"PUMPKIN\"), so searching them means comparing text with .equals().",
    ],
    syntax: "String s = \"PUMPKIN\";\nboolean same = s.equals(\"PUMPKIN\");\nint len = s.length();\nchar first = s.charAt(0);",
    walkthrough: [
      { code: "if (crops[i].equals(\"PUMPKIN\")) { ... }", note: "Correct String comparison — matches the text." },
      { code: "// NOT: if (crops[i] == \"PUMPKIN\")", note: "== can be false even when the text matches. Avoid it for Strings." },
      { code: "int n = crops[i].length();", note: "Other String methods read length, characters, etc." },
    ],
    gameMapping: "Matching crop names in sequential search (find the PUMPKIN stall).",
    commonMistakes: [
      "Using == to compare Strings — the classic Java beginner bug.",
      "Calling .charAt(i) with i past the end (index out of bounds).",
      "Case sensitivity: \"Wheat\".equals(\"WHEAT\") is false.",
    ],
    related: ["sequential-search", "comparison-operators"],
  },

  // ============================================================ CORE: static-methods
  "static-methods": {
    concept: "static-methods",
    title: "Writing your own methods",
    summary: "Bundle a reusable calculation behind a name, with inputs and a return value.",
    explanation: [
      "Earlier you CALLED methods the drone gave you. Now you WRITE your own. A method packages a piece of work behind a name; you give it inputs (parameters) and it can hand back one value with return.",
      "The header names the return type, the method name, and the parameters: int doubleIt(int x). Call it like any other method: int y = doubleIt(5);",
      "Methods keep code short and reusable — write the logic once, call it as often as you like, even inside a loop.",
    ],
    syntax: "int doubleIt(int x) {\n    return x * 2;   // hand a value back\n}\n// ...\nint y = doubleIt(5);   // y is 10",
    walkthrough: [
      { code: "int area(int w, int h) {", note: "Header: returns an int, takes two int parameters w and h." },
      { code: "    return w * h;", note: "return computes the answer and hands it back to the caller." },
      { code: "}", note: "End of the method body." },
      { code: "int a = area(4, 3);", note: "Call it with arguments 4 and 3; a becomes 12." },
    ],
    gameMapping: "Write a helper once — like fullBaskets(count) or isRipe(growth) — then reuse it across the farm instead of repeating the logic.",
    commonMistakes: [
      "Forgetting return, so the method gives nothing back (or won't compile).",
      "Return type mismatch — declaring int but returning a decimal.",
      "Calling with the wrong number or order of arguments.",
    ],
    related: ["methods", "variables-types"],
  },
};

/** The deep lesson for a concept (core or woven), or null if none authored. */
export function getConceptLesson(concept: string | null | undefined): ConceptLesson | null {
  if (!concept) return null;
  return LESSONS[concept] ?? null;
}

/** Lessons for a list of concept keys, skipping any without content. */
export function getConceptLessons(concepts: readonly string[]): ConceptLesson[] {
  const out: ConceptLesson[] = [];
  for (const c of concepts) {
    const lesson = LESSONS[c];
    if (lesson) out.push(lesson);
  }
  return out;
}

export function isCoreConcept(concept: string): boolean {
  return CORE_CONCEPT_META[concept]?.isCore ?? false;
}
