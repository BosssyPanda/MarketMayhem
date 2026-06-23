// Skill Drills — short active-recall challenges per concept.
//
// Two formats: "predict" (read code, pick the output / true statement — checked
// instantly in the browser) and "write-line" (type one line; we compile + run it
// for real via the existing /api/run with a THROWAWAY farm state and read only
// compiled/stdout — the returned state is never committed). No engine, runner,
// or contract changes. Concept keys match lib/curriculum.ts + engine concepts.

import { buildStrategySource, createDefaultFarmState, emptyConceptPractice } from "./persist";
import type { ConceptPractice, PracticeState } from "./persist";
import type { RunResponse } from "./types";

export type DrillKind = "predict" | "write-line";

export interface PredictDrill {
  id: string;
  concept: string;
  kind: "predict";
  difficulty: 1 | 2 | 3;
  prompt: string;
  /** optional code snippet to read */
  code?: string;
  choices: string[];
  answerIndex: number;
  explain: string;
  /** optional per-choice "why this is tempting" notes, parallel to choices.
   *  When the learner picks a wrong choice, its note (if any) is shown so the
   *  feedback targets the specific misconception, not just the right answer. */
  choiceNotes?: string[];
}

export interface WriteLineDrill {
  id: string;
  concept: string;
  kind: "write-line";
  difficulty: 1 | 2 | 3;
  prompt: string;
  /** full Strategy body with a single __LINE__ placeholder for the learner's line */
  template: string;
  /** light scaffold prefilled into the input (kept intentionally incomplete) */
  starter: string;
  /** regex source the typed line must match (proves the concept was used) */
  requirePattern: string;
  /** plain-English description of what must be used */
  patternHint: string;
  /** expected trimmed stdout when correct */
  expectStdout?: string;
  explain: string;
}

export type Drill = PredictDrill | WriteLineDrill;

const XP_PREDICT = 10;
const XP_WRITE = 20;
/** correct answers that fill a concept's practice mastery bar */
export const MASTERY_TARGET = 6;

// Beginner-first teaching order — starts at the absolute basics (variables,
// % and /, comparisons, if/else) BEFORE loops/arrays/methods, then the
// search/sort cores. The practice hub walks this ladder so a total beginner
// can start at the very beginning. Keys match lib/curriculum.ts lessons +
// engine concepts. Anything here without drills is simply skipped by the hub.
export const LEARNING_ORDER = [
  "variables-types",
  "modulo-division",
  "comparison-operators",
  "if-else",
  "for-loops",
  "nested-loops",
  "while-loops",
  "arrays",
  "static-methods",
  "methods",
  "string-methods",
  "2d-arrays",
  "sequential-search",
  "binary-search",
  "bubble-sort",
  "selection-sort",
  "recursion-puzzles",
] as const;

/** The learning ladder, limited to concepts that actually have drills, in order. */
export function learningLadder(): string[] {
  const ordered = LEARNING_ORDER.filter((c) => hasDrills(c));
  // Append any drill concept not listed above so nothing goes missing.
  const extras = allDrillConcepts().filter((c) => !LEARNING_ORDER.includes(c as (typeof LEARNING_ORDER)[number]));
  return [...ordered, ...extras];
}

// ----------------------------------------------------------------- content
const DRILLS: Drill[] = [
  // ---- methods ----
  {
    id: "methods-p1", concept: "methods", kind: "predict", difficulty: 1,
    prompt: "What does this print?",
    code: "int dbl(int x) { return x * 2; }\n// ...\nSystem.out.println(dbl(5) + 1);",
    choices: ["10", "11", "12", "52"], answerIndex: 1,
    explain: "dbl(5) returns 10, then + 1 makes 11. The method's return value is used in the expression.",
  },
  {
    id: "methods-p2", concept: "methods", kind: "predict", difficulty: 2,
    prompt: "What does this print?",
    code: "int add(int a, int b) { return a + b; }\n// ...\nSystem.out.println(add(add(1, 2), 4));",
    choices: ["6", "7", "3", "124"], answerIndex: 1,
    explain: "Inner add(1,2) is 3, then add(3,4) is 7. Calls evaluate inside-out.",
  },
  {
    id: "methods-w1", concept: "methods", kind: "write-line", difficulty: 2,
    prompt: "Finish the method so dbl(5) returns 10 (it should print 10).",
    template: "public void run(Drone drone, Farm farm) {\n    System.out.println(dbl(5));\n}\n\nint dbl(int x) {\n    __LINE__\n}",
    starter: "return x * ?;",
    requirePattern: "return", patternHint: "a return statement",
    expectStdout: "10",
    explain: "A method gives a value back with return. return x * 2 sends 10 back to the caller.",
  },

  // ---- for-loops ----
  {
    id: "for-p1", concept: "for-loops", kind: "predict", difficulty: 1,
    prompt: "What does this print?",
    code: "int s = 0;\nfor (int i = 1; i <= 3; i++) { s += i; }\nSystem.out.println(s);",
    choices: ["3", "6", "9", "10"], answerIndex: 1,
    explain: "The loop adds 1 + 2 + 3 into s, giving 6.",
  },
  {
    id: "for-p2", concept: "for-loops", kind: "predict", difficulty: 1,
    prompt: "What does this print?",
    code: "for (int i = 0; i < 3; i++) { System.out.print(i); }",
    choices: ["123", "012", "0 1 2", "0123"], answerIndex: 1,
    explain: "i runs 0, 1, 2 (stops at < 3). print (no ln) joins them: 012.",
  },
  {
    id: "for-w1", concept: "for-loops", kind: "write-line", difficulty: 2,
    prompt: "Write the for-loop header so it prints 0 1 2 3 4 (each on its own line).",
    template: "public void run(Drone drone, Farm farm) {\n    __LINE__\n        System.out.println(i);\n}",
    starter: "for (int i = 0; i < ?; i++)",
    requirePattern: "for\\s*\\(", patternHint: "a for loop (for ( ... ))",
    expectStdout: "0\n1\n2\n3\n4",
    explain: "for (int i = 0; i < 5; i++) runs i from 0 up to 4. Using < 5 (not <= 5) stops at 4.",
  },

  // ---- while-loops ----
  {
    id: "while-p1", concept: "while-loops", kind: "predict", difficulty: 2,
    prompt: "What does this print?",
    code: "int n = 8, c = 0;\nwhile (n > 1) { n = n / 2; c++; }\nSystem.out.println(c);",
    choices: ["2", "3", "4", "8"], answerIndex: 1,
    explain: "8 -> 4 -> 2 -> 1 is three halvings, so c is 3.",
  },
  {
    id: "while-p2", concept: "while-loops", kind: "predict", difficulty: 1,
    prompt: "What does this print?",
    code: "int n = 234;\nSystem.out.println(n % 10);",
    choices: ["2", "3", "4", "234"], answerIndex: 2,
    explain: "% 10 gives the remainder after dividing by 10 — the last digit, 4.",
  },
  {
    id: "while-w1", concept: "while-loops", kind: "write-line", difficulty: 2,
    prompt: "Fill the while condition so it prints 0 1 2 3 4.",
    template: "public void run(Drone drone, Farm farm) {\n    int i = 0;\n    while (__LINE__) {\n        System.out.println(i);\n        i++;\n    }\n}",
    starter: "i < ?",
    requirePattern: "<", patternHint: "a comparison like i < 5",
    expectStdout: "0\n1\n2\n3\n4",
    explain: "i < 5 keeps the loop going while i is 0..4, then stops. i++ each pass makes it end.",
  },

  // ---- arrays ----
  {
    id: "arrays-p1", concept: "arrays", kind: "predict", difficulty: 1,
    prompt: "What does this print?",
    code: "int[] a = {4, 7, 2, 9};\nSystem.out.println(a[1] + a[3]);",
    choices: ["6", "11", "16", "13"], answerIndex: 2,
    explain: "a[1] is 7 and a[3] is 9 (indexes start at 0), so 7 + 9 = 16.",
  },
  {
    id: "arrays-p2", concept: "arrays", kind: "predict", difficulty: 1,
    prompt: "What does this print?",
    code: "int[] a = {5, 5, 5};\nSystem.out.println(a.length);",
    choices: ["2", "3", "5", "15"], answerIndex: 1,
    explain: ".length is how many elements there are (3), not their values.",
  },
  {
    id: "arrays-w1", concept: "arrays", kind: "write-line", difficulty: 2,
    prompt: "Print the sum of the first and last elements of a (should print 13).",
    template: "public void run(Drone drone, Farm farm) {\n    int[] a = {4, 7, 2, 9};\n    __LINE__\n}",
    starter: "System.out.println(a[0] + a[?]);",
    requirePattern: "a\\[", patternHint: "array indexing like a[0]",
    expectStdout: "13",
    explain: "The last index is length - 1 = 3. a[0] + a[3] is 4 + 9 = 13.",
  },

  // ---- sequential-search ----
  {
    id: "seq-p1", concept: "sequential-search", kind: "predict", difficulty: 2,
    prompt: "What does this print?",
    code: "String[] c = {\"WHEAT\", \"CORN\", \"PUMPKIN\"};\nint idx = -1;\nfor (int i = 0; i < c.length; i++) {\n    if (c[i].equals(\"CORN\")) { idx = i; break; }\n}\nSystem.out.println(idx);",
    choices: ["-1", "0", "1", "2"], answerIndex: 2,
    explain: "CORN is at index 1; the loop finds it and breaks, so idx is 1.",
  },
  {
    id: "seq-p2", concept: "sequential-search", kind: "predict", difficulty: 2,
    prompt: "The target isn't in the array. What does this print?",
    code: "String[] c = {\"WHEAT\", \"CORN\"};\nint idx = -1;\nfor (int i = 0; i < c.length; i++) {\n    if (c[i].equals(\"CARROT\")) { idx = i; break; }\n}\nSystem.out.println(idx);",
    choices: ["-1", "0", "1", "2"], answerIndex: 0,
    explain: "No element matches, so idx keeps its starting value -1 — the 'not found' signal.",
  },

  // ---- binary-search ----
  {
    id: "bin-p1", concept: "binary-search", kind: "predict", difficulty: 2,
    prompt: "What is the first mid value looked at?",
    code: "int[] a = {1, 3, 5, 7, 9};\nint lo = 0, hi = 4;\nint mid = (lo + hi) / 2;\nSystem.out.println(a[mid]);",
    choices: ["1", "5", "7", "9"], answerIndex: 1,
    explain: "mid = (0 + 4) / 2 = 2, and a[2] is 5 — binary search always starts in the middle.",
  },
  {
    id: "bin-p2", concept: "binary-search", kind: "predict", difficulty: 3,
    prompt: "Searching for 9: after a[mid]=5 is too small, what does low become? (lo=0, hi=4, mid=2)",
    choices: ["1", "2", "3", "4"], answerIndex: 2,
    explain: "Too small means discard the left half: low = mid + 1 = 3. The window halves each step.",
  },

  // ---- bubble-sort ----
  {
    id: "bubble-p1", concept: "bubble-sort", kind: "predict", difficulty: 2,
    prompt: "What does this print after one pass?",
    code: "int[] a = {3, 1, 2};\nfor (int i = 0; i < a.length - 1; i++) {\n    if (a[i] > a[i + 1]) { int t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; }\n}\nSystem.out.println(a[0] + \",\" + a[1] + \",\" + a[2]);",
    choices: ["3,1,2", "1,3,2", "1,2,3", "2,1,3"], answerIndex: 2,
    explain: "i=0: 3>1 swap -> 1,3,2. i=1: 3>2 swap -> 1,2,3. One pass sorted this small array.",
  },
  {
    id: "bubble-p2", concept: "bubble-sort", kind: "predict", difficulty: 1,
    prompt: "After one full pass of ascending bubble sort, what is guaranteed?",
    choices: [
      "The smallest value is at the start",
      "The largest value is at the end",
      "The array is fully sorted",
      "Nothing changes",
    ], answerIndex: 1,
    explain: "Each pass 'bubbles' the largest remaining value to the end — that's why later passes can stop earlier.",
  },

  // ---- selection-sort ----
  {
    id: "sel-p1", concept: "selection-sort", kind: "predict", difficulty: 2,
    prompt: "Descending selection sort, first slot. What does this print?",
    code: "int[] a = {9, 30, 14};\nint best = 0;\nfor (int i = 1; i < a.length; i++) { if (a[i] > a[best]) best = i; }\nint t = a[0]; a[0] = a[best]; a[best] = t;\nSystem.out.println(a[0]);",
    choices: ["9", "14", "30", "53"], answerIndex: 2,
    explain: "It scans for the biggest value (30) and swaps it into slot 0.",
  },
  {
    id: "sel-p2", concept: "selection-sort", kind: "predict", difficulty: 1,
    prompt: "Each pass of selection sort places which value into the next slot?",
    choices: [
      "The first element of the rest",
      "The best (min or max) of the remaining elements",
      "Two neighbours swapped",
      "A random element",
    ], answerIndex: 1,
    explain: "Selection sort scans the unsorted remainder, finds the best one, and puts it in place.",
  },

  // ======================================================= BEGINNER: variables-types
  {
    id: "var-p1", concept: "variables-types", kind: "predict", difficulty: 1,
    prompt: "Two baskets, whole-number division. What does this print?",
    code: "int apples = 5;\nint baskets = 2;\nSystem.out.println(apples / baskets);",
    choices: ["2.5", "2", "3", "1"], answerIndex: 1,
    explain: "int / int throws away the fraction (integer division): 5 / 2 is 2, not 2.5.",
    choiceNotes: ["That's normal (real) division. In Java, int / int drops the fraction, so 5 / 2 is 2.", "", "5 / 2 truncates DOWN to 2, it doesn't round up to 3.", "1 is the remainder (5 % 2). The / operator gives the quotient, 2."],
  },
  {
    id: "var-p2", concept: "variables-types", kind: "predict", difficulty: 2,
    prompt: "One value is a decimal. What does this print?",
    code: "double share = 5.0 / 2;\nSystem.out.println(share);",
    choices: ["2", "2.5", "3", "2.0"], answerIndex: 1,
    explain: "Because 5.0 is a double, Java keeps the decimal: 5.0 / 2 is 2.5.",
  },
  {
    id: "var-p3", concept: "variables-types", kind: "predict", difficulty: 1,
    prompt: "Reassigning a variable. What does this print?",
    code: "int wheat = 7;\nwheat = wheat + 3;\nSystem.out.println(wheat);",
    choices: ["7", "3", "10", "73"], answerIndex: 2,
    explain: "The right side is computed first (7 + 3 = 10), then stored back into wheat. So wheat becomes 10.",
  },
  {
    id: "var-p4", concept: "variables-types", kind: "predict", difficulty: 2,
    prompt: "Copying a value. What does this print?",
    code: "int a = 10;\nint b = a;\na = 20;\nSystem.out.println(b);",
    choices: ["10", "20", "30", "0"], answerIndex: 0,
    explain: "b copied a's value (10). Changing a afterwards does not change b — ints are copied, not linked.",
    choiceNotes: ["", "When b = a ran, a was 10, so b holds 10. Setting a = 20 later does not reach back into b.", "", ""],
  },
  {
    id: "var-p5", concept: "variables-types", kind: "predict", difficulty: 1,
    prompt: "Adding two counts. What does this print?",
    code: "int wheat = 12;\nint corn = 8;\nint total = wheat + corn;\nSystem.out.println(total);",
    choices: ["20", "128", "4", "12"], answerIndex: 0,
    explain: "total holds wheat + corn = 12 + 8 = 20.",
  },
  {
    id: "var-p6", concept: "variables-types", kind: "predict", difficulty: 2,
    prompt: "A boolean flag. What does this print?",
    code: "boolean ripe = false;\nripe = true;\nSystem.out.println(ripe);",
    choices: ["true", "false", "1", "ripe"], answerIndex: 0,
    explain: "ripe starts false, then is reassigned to true. A boolean holds only true or false.",
  },
  {
    id: "var-w1", concept: "variables-types", kind: "write-line", difficulty: 1,
    prompt: "Declare an int named baskets equal to 6 (it should print 6).",
    template: "public void run(Drone drone, Farm farm) {\n    __LINE__\n    System.out.println(baskets);\n}",
    starter: "int baskets = ?;",
    requirePattern: "int\\s+baskets\\s*=", patternHint: "an int declaration like int baskets = ...",
    expectStdout: "6",
    explain: "int baskets = 6; makes a whole-number box named baskets holding 6.",
  },
  {
    id: "var-w2", concept: "variables-types", kind: "write-line", difficulty: 2,
    prompt: "a is 17 and b is 5. Print how many whole times b fits into a (should print 3).",
    template: "public void run(Drone drone, Farm farm) {\n    int a = 17;\n    int b = 5;\n    __LINE__\n}",
    starter: "System.out.println(a ? b);",
    requirePattern: "a\\s*/\\s*b", patternHint: "integer division a / b",
    expectStdout: "3",
    explain: "Integer division a / b is 17 / 5 = 3 (the remainder 2 is dropped).",
  },

  // ======================================================= BEGINNER: modulo-division
  {
    id: "mod-p1", concept: "modulo-division", kind: "predict", difficulty: 1,
    prompt: "Remainder. What does this print?",
    code: "System.out.println(47 % 10);",
    choices: ["4", "7", "47", "0"], answerIndex: 1,
    explain: "% is the remainder after dividing. 47 / 10 is 4 remainder 7, so 47 % 10 is 7 — the last digit.",
    choiceNotes: ["4 is 47 / 10 (the quotient). The % operator gives the remainder, 7.", "", "", ""],
  },
  {
    id: "mod-p2", concept: "modulo-division", kind: "predict", difficulty: 1,
    prompt: "Whole-number divide. What does this print?",
    code: "System.out.println(47 / 10);",
    choices: ["4", "7", "4.7", "5"], answerIndex: 0,
    explain: "47 / 10 with ints is 4 — the whole part only. Dividing by 10 drops the last digit.",
  },
  {
    id: "mod-p3", concept: "modulo-division", kind: "predict", difficulty: 1,
    prompt: "Even or odd? What does this print?",
    code: "int n = 8;\nSystem.out.println(n % 2);",
    choices: ["0", "1", "4", "2"], answerIndex: 0,
    explain: "8 % 2 is 0, so 8 is even. An odd number would give 1.",
  },
  {
    id: "mod-p4", concept: "modulo-division", kind: "predict", difficulty: 2,
    prompt: "Last two digits. What does this print?",
    code: "System.out.println(1234 % 100);",
    choices: ["12", "34", "4", "1234"], answerIndex: 1,
    explain: "% 100 leaves the remainder after dividing by 100 — the last two digits, 34.",
  },
  {
    id: "mod-p5", concept: "modulo-division", kind: "predict", difficulty: 3,
    prompt: "Digit sum. What does this print?",
    code: "int n = 234;\nint sum = 0;\nwhile (n > 0) {\n    sum += n % 10;\n    n = n / 10;\n}\nSystem.out.println(sum);",
    choices: ["6", "9", "234", "8"], answerIndex: 1,
    explain: "Peels digits right to left: 4, then 3, then 2. 4 + 3 + 2 = 9.",
  },
  {
    id: "mod-p6", concept: "modulo-division", kind: "predict", difficulty: 3,
    prompt: "Reverse the number. What does this print?",
    code: "int n = 52;\nint r = 0;\nwhile (n > 0) {\n    r = r * 10 + n % 10;\n    n = n / 10;\n}\nSystem.out.println(r);",
    choices: ["52", "25", "7", "520"], answerIndex: 1,
    explain: "Take last digit 2 -> r = 2, then 5 -> r = 2 * 10 + 5 = 25. The number is reversed.",
  },
  {
    id: "mod-w1", concept: "modulo-division", kind: "write-line", difficulty: 2,
    prompt: "n is 836. Print just its last digit (should print 6).",
    template: "public void run(Drone drone, Farm farm) {\n    int n = 836;\n    __LINE__\n}",
    starter: "System.out.println(n % ?);",
    requirePattern: "n\\s*%\\s*10", patternHint: "n % 10",
    expectStdout: "6",
    explain: "n % 10 gives the remainder after dividing by 10 — the last digit, 6.",
  },
  {
    id: "mod-w2", concept: "modulo-division", kind: "write-line", difficulty: 2,
    prompt: "n is 836. Print n with its last digit removed (should print 83).",
    template: "public void run(Drone drone, Farm farm) {\n    int n = 836;\n    __LINE__\n}",
    starter: "System.out.println(n / ?);",
    requirePattern: "n\\s*/\\s*10", patternHint: "n / 10",
    expectStdout: "83",
    explain: "n / 10 with ints drops the last digit: 836 / 10 = 83.",
  },

  // =================================================== BEGINNER: comparison-operators
  {
    id: "cmp-p1", concept: "comparison-operators", kind: "predict", difficulty: 1,
    prompt: "What does this print?",
    code: "int a = 4;\nint b = 7;\nSystem.out.println(a < b);",
    choices: ["true", "false", "4", "7"], answerIndex: 0,
    explain: "4 < 7 is true. Comparisons answer with a boolean (true / false).",
  },
  {
    id: "cmp-p2", concept: "comparison-operators", kind: "predict", difficulty: 1,
    prompt: "Not equal. What does this print?",
    code: "int a = 5;\nSystem.out.println(a != 5);",
    choices: ["true", "false"], answerIndex: 1,
    explain: "!= means 'not equal'. a is 5, so a != 5 is false.",
  },
  {
    id: "cmp-p3", concept: "comparison-operators", kind: "predict", difficulty: 2,
    prompt: "Both must hold. What does this print?",
    code: "int a = 6;\nSystem.out.println(a >= 4 && a < 10);",
    choices: ["true", "false"], answerIndex: 0,
    explain: "&& is AND: 6 >= 4 (true) AND 6 < 10 (true) -> true. Both sides must be true.",
  },
  {
    id: "cmp-p4", concept: "comparison-operators", kind: "predict", difficulty: 2,
    prompt: "Either one holds. What does this print?",
    code: "int a = 12;\nSystem.out.println(a < 0 || a > 10);",
    choices: ["true", "false"], answerIndex: 0,
    explain: "|| is OR: 12 < 0 (false) OR 12 > 10 (true) -> true. Only one side needs to be true.",
  },
  {
    id: "cmp-p5", concept: "comparison-operators", kind: "predict", difficulty: 2,
    prompt: "NOT flips it. What does this print?",
    code: "boolean r = !(3 > 5);\nSystem.out.println(r);",
    choices: ["true", "false"], answerIndex: 0,
    explain: "3 > 5 is false; ! flips it to true.",
  },
  {
    id: "cmp-p6", concept: "comparison-operators", kind: "predict", difficulty: 3,
    prompt: "Watch the boundary. What does this print?",
    code: "int x = 3;\nSystem.out.println(x > 0 && x < 3);",
    choices: ["true", "false"], answerIndex: 1,
    explain: "x < 3 is false when x is exactly 3 (not strictly less), so the AND is false. < and <= differ at the edge.",
    choiceNotes: ["x < 3 is false when x equals 3 — 3 is not strictly less than itself. Use <= to include the boundary.", ""],
  },
  {
    id: "cmp-p7", concept: "comparison-operators", kind: "predict", difficulty: 2,
    prompt: "Strings need .equals. What does this print?",
    code: "String crop = \"CORN\";\nSystem.out.println(crop.equals(\"CORN\"));",
    choices: ["true", "false"], answerIndex: 0,
    explain: "Compare text with .equals (not ==). The letters match, so it is true.",
  },
  {
    id: "cmp-w1", concept: "comparison-operators", kind: "write-line", difficulty: 2,
    prompt: "a is 10. Print whether a is between 0 and 10 inclusive (should print true).",
    template: "public void run(Drone drone, Farm farm) {\n    int a = 10;\n    __LINE__\n}",
    starter: "System.out.println(a >= 0 && a ? 10);",
    requirePattern: "&&", patternHint: "&& to combine two comparisons",
    expectStdout: "true",
    explain: "a >= 0 && a <= 10 is true AND true -> true. Use <= so 10 counts as inside.",
  },

  // ============================================================== BEGINNER: if-else
  {
    id: "if-p1", concept: "if-else", kind: "predict", difficulty: 1,
    prompt: "Bigger of two. What does this print?",
    code: "int a = 4;\nint b = 9;\nif (a > b) {\n    System.out.println(a);\n} else {\n    System.out.println(b);\n}",
    choices: ["4", "9", "13", "nothing"], answerIndex: 1,
    explain: "a > b is 4 > 9, which is false, so the else runs and prints b (9).",
  },
  {
    id: "if-p2", concept: "if-else", kind: "predict", difficulty: 2,
    prompt: "Moisture bands. What does this print?",
    code: "int m = 55;\nif (m < 30) {\n    System.out.println(\"DRY\");\n} else if (m < 70) {\n    System.out.println(\"OK\");\n} else {\n    System.out.println(\"WET\");\n}",
    choices: ["DRY", "OK", "WET", "DRY OK"], answerIndex: 1,
    explain: "55 < 30 is false; 55 < 70 is true, so it prints OK and skips the rest. else-if stops at the first true branch.",
  },
  {
    id: "if-p3", concept: "if-else", kind: "predict", difficulty: 2,
    prompt: "Sign of a number. What does this print?",
    code: "int n = -4;\nif (n > 0) {\n    System.out.println(\"pos\");\n} else if (n == 0) {\n    System.out.println(\"zero\");\n} else {\n    System.out.println(\"neg\");\n}",
    choices: ["pos", "zero", "neg", "nothing"], answerIndex: 2,
    explain: "-4 is not > 0 and not == 0, so the final else runs: neg.",
  },
  {
    id: "if-p4", concept: "if-else", kind: "predict", difficulty: 2,
    prompt: "Even or odd. What does this print?",
    code: "int n = 7;\nif (n % 2 == 0) {\n    System.out.println(\"even\");\n} else {\n    System.out.println(\"odd\");\n}",
    choices: ["even", "odd"], answerIndex: 1,
    explain: "7 % 2 is 1 (not 0), so the condition is false and it prints odd.",
  },
  {
    id: "if-p5", concept: "if-else", kind: "predict", difficulty: 3,
    prompt: "No braces — which lines does the if guard? What does this print?",
    code: "int x = 5;\nif (x > 0)\n    x = x + 1;\nx = x + 10;\nSystem.out.println(x);",
    choices: ["5", "6", "15", "16"], answerIndex: 3,
    explain: "Without braces only the next single statement (x = x + 1) is inside the if. So x becomes 6, then x = x + 10 always runs -> 16.",
    choiceNotes: ["x > 0 is true, so x = x + 1 runs and x is no longer 5.", "x becomes 6, but the next line (x = x + 10) is NOT inside the if, so it runs too.", "", ""],
  },
  {
    id: "if-p6", concept: "if-else", kind: "predict", difficulty: 3,
    prompt: "Two separate ifs. What does this print?",
    code: "int score = 85;\nString g = \"?\";\nif (score >= 90) g = \"A\";\nif (score >= 80) g = \"B\";\nSystem.out.println(g);",
    choices: ["A", "B", "?", "AB"], answerIndex: 1,
    explain: "score >= 90 is false (g stays ?). score >= 80 is true, so g becomes B. Both separate ifs are checked.",
  },
  {
    id: "if-w1", concept: "if-else", kind: "write-line", difficulty: 2,
    prompt: "n is 120. Print BIG if n > 100, otherwise SMALL (should print BIG).",
    template: "public void run(Drone drone, Farm farm) {\n    int n = 120;\n    __LINE__\n}",
    starter: "if (n ? 100) System.out.println(\"BIG\"); else System.out.println(\"SMALL\");",
    requirePattern: "n\\s*>\\s*100", patternHint: "the test n > 100",
    expectStdout: "BIG",
    explain: "n > 100 is true, so the if branch prints BIG and the else is skipped.",
  },

  // ========================================================== BEGINNER: nested-loops
  {
    id: "nest-p1", concept: "nested-loops", kind: "predict", difficulty: 2,
    prompt: "How many times does the body run? What does this print?",
    code: "int c = 0;\nfor (int i = 0; i < 3; i++) {\n    for (int j = 0; j < 2; j++) {\n        c++;\n    }\n}\nSystem.out.println(c);",
    choices: ["5", "6", "3", "2"], answerIndex: 1,
    explain: "The inner loop (2 times) runs fully for each of the 3 outer passes: 3 x 2 = 6.",
  },
  {
    id: "nest-p2", concept: "nested-loops", kind: "predict", difficulty: 2,
    prompt: "A block of stars. How many * are printed in total?",
    code: "for (int row = 0; row < 2; row++) {\n    for (int col = 0; col < 3; col++) {\n        System.out.print(\"*\");\n    }\n}",
    choices: ["3", "5", "6", "2"], answerIndex: 2,
    explain: "2 rows x 3 columns = 6 stars.",
  },
  {
    id: "nest-p3", concept: "nested-loops", kind: "predict", difficulty: 3,
    prompt: "A growing triangle. How many # are printed in total?",
    code: "for (int i = 1; i <= 3; i++) {\n    for (int j = 0; j < i; j++) {\n        System.out.print(\"#\");\n    }\n}",
    choices: ["3", "6", "9", "5"], answerIndex: 1,
    explain: "The inner loop runs i times: 1 + 2 + 3 = 6. The inner bound depends on the outer counter.",
  },
  {
    id: "nest-p4", concept: "nested-loops", kind: "predict", difficulty: 3,
    prompt: "Products summed. What does this print?",
    code: "int s = 0;\nfor (int i = 1; i <= 2; i++) {\n    for (int j = 1; j <= 2; j++) {\n        s += i * j;\n    }\n}\nSystem.out.println(s);",
    choices: ["6", "9", "4", "12"], answerIndex: 1,
    explain: "Sums 1*1 + 1*2 + 2*1 + 2*2 = 1 + 2 + 2 + 4 = 9.",
  },
  {
    id: "nest-p5", concept: "nested-loops", kind: "predict", difficulty: 2,
    prompt: "Sweeping a field. How many tiles does this visit?",
    code: "int tiles = 0;\nfor (int y = 0; y < 3; y++) {\n    for (int x = 0; x < 4; x++) {\n        tiles++;\n    }\n}\nSystem.out.println(tiles);",
    choices: ["7", "12", "4", "3"], answerIndex: 1,
    explain: "A 3-row by 4-column sweep visits 3 x 4 = 12 tiles — exactly how you walk the whole farm.",
  },
  {
    id: "nest-p6", concept: "nested-loops", kind: "predict", difficulty: 3,
    prompt: "Order of the pairs. What does this print?",
    code: "for (int i = 0; i < 2; i++) {\n    for (int j = 0; j < 2; j++) {\n        System.out.print(i + \"\" + j + \" \");\n    }\n}",
    choices: ["00 01 10 11 ", "00 10 01 11 ", "01 23 ", "00 11 "], answerIndex: 0,
    explain: "For each i the inner j runs fully: i = 0 -> 00 01, then i = 1 -> 10 11.",
  },

  // ========================================================= BEGINNER: string-methods
  {
    id: "str-p1", concept: "string-methods", kind: "predict", difficulty: 1,
    prompt: "Length of text. What does this print?",
    code: "System.out.println(\"PUMPKIN\".length());",
    choices: ["6", "7", "8", "1"], answerIndex: 1,
    explain: "length() counts the characters. P-U-M-P-K-I-N is 7.",
  },
  {
    id: "str-p2", concept: "string-methods", kind: "predict", difficulty: 1,
    prompt: "Character at an index. What does this print?",
    code: "String s = \"CORN\";\nSystem.out.println(s.charAt(0));",
    choices: ["C", "O", "N", "4"], answerIndex: 0,
    explain: "Indexes start at 0, so charAt(0) is the first character, C.",
  },
  {
    id: "str-p3", concept: "string-methods", kind: "predict", difficulty: 2,
    prompt: "Comparing text. What does this print?",
    code: "String a = \"WHEAT\";\nSystem.out.println(a.equals(\"WHEAT\"));",
    choices: ["true", "false"], answerIndex: 0,
    explain: ".equals compares the letters; they match, so true. Always use .equals for Strings, not ==.",
  },
  {
    id: "str-p4", concept: "string-methods", kind: "predict", difficulty: 2,
    prompt: "Case matters. What does this print?",
    code: "System.out.println(\"Wheat\".equals(\"WHEAT\"));",
    choices: ["true", "false"], answerIndex: 1,
    explain: "equals is case-sensitive: 'Wheat' and 'WHEAT' differ, so false.",
  },
  {
    id: "str-p5", concept: "string-methods", kind: "predict", difficulty: 2,
    prompt: "Looping over letters. What does this print?",
    code: "String s = \"ABC\";\nfor (int i = 0; i < s.length(); i++) {\n    System.out.print(s.charAt(i));\n}",
    choices: ["ABC", "CBA", "012", "AABBCC"], answerIndex: 0,
    explain: "It prints each character in order: A, B, C.",
  },
  {
    id: "str-p6", concept: "string-methods", kind: "predict", difficulty: 3,
    prompt: "Counting a letter. What does this print?",
    code: "String s = \"BANANA\";\nint c = 0;\nfor (int i = 0; i < s.length(); i++) {\n    if (s.charAt(i) == 'A') c++;\n}\nSystem.out.println(c);",
    choices: ["2", "3", "6", "1"], answerIndex: 1,
    explain: "B-A-N-A-N-A has three A's, so c ends at 3. Char compares use single quotes and ==.",
  },
  {
    id: "str-w1", concept: "string-methods", kind: "write-line", difficulty: 1,
    prompt: "s is \"CARROT\". Print how many characters it has (should print 6).",
    template: "public void run(Drone drone, Farm farm) {\n    String s = \"CARROT\";\n    __LINE__\n}",
    starter: "System.out.println(s.?);",
    requirePattern: "\\.length\\s*\\(\\s*\\)", patternHint: "the .length() method",
    expectStdout: "6",
    explain: "s.length() returns the number of characters: CARROT is 6.",
  },

  // ============================================================= BEGINNER: 2d-arrays
  {
    id: "2d-p1", concept: "2d-arrays", kind: "predict", difficulty: 2,
    prompt: "Read a cell by [row][col]. What does this print?",
    code: "int[][] g = {{1, 2}, {3, 4}};\nSystem.out.println(g[1][0]);",
    choices: ["1", "2", "3", "4"], answerIndex: 2,
    explain: "g[1] is the second row {3, 4}; [0] takes its first value, 3.",
  },
  {
    id: "2d-p2", concept: "2d-arrays", kind: "predict", difficulty: 2,
    prompt: "Number of rows. What does this print?",
    code: "int[][] g = {{1, 2}, {3, 4}, {5, 6}};\nSystem.out.println(g.length);",
    choices: ["2", "3", "6", "1"], answerIndex: 1,
    explain: "g.length is the number of rows (3). g[0].length would be the columns (2).",
  },
  {
    id: "2d-p3", concept: "2d-arrays", kind: "predict", difficulty: 3,
    prompt: "Sum every cell. What does this print?",
    code: "int[][] g = {{1, 2}, {3, 4}};\nint s = 0;\nfor (int r = 0; r < g.length; r++) {\n    for (int c = 0; c < g[r].length; c++) {\n        s += g[r][c];\n    }\n}\nSystem.out.println(s);",
    choices: ["7", "10", "4", "6"], answerIndex: 1,
    explain: "Nested loops visit every cell: 1 + 2 + 3 + 4 = 10.",
  },
  {
    id: "2d-p4", concept: "2d-arrays", kind: "predict", difficulty: 2,
    prompt: "Columns in a row. What does this print?",
    code: "int[][] g = {{1, 2, 3}, {4, 5, 6}};\nSystem.out.println(g[0].length);",
    choices: ["2", "3", "6", "1"], answerIndex: 1,
    explain: "g[0] is the first row {1, 2, 3}; its length (number of columns) is 3.",
  },
  {
    id: "2d-p5", concept: "2d-arrays", kind: "predict", difficulty: 3,
    prompt: "Diagonal cells. What does this print?",
    code: "int[][] g = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};\nint s = 0;\nfor (int i = 0; i < g.length; i++) {\n    s += g[i][i];\n}\nSystem.out.println(s);",
    choices: ["15", "12", "45", "6"], answerIndex: 0,
    explain: "g[i][i] walks the diagonal: g[0][0]=1, g[1][1]=5, g[2][2]=9 -> 15.",
  },

  // ===================================================== CORE EXPANSION: for-loops
  {
    id: "for-p3", concept: "for-loops", kind: "predict", difficulty: 2,
    prompt: "Counting down. What does this print?",
    code: "for (int i = 3; i > 0; i--) {\n    System.out.print(i);\n}",
    choices: ["321", "123", "3210", "0123"], answerIndex: 0,
    explain: "i-- counts down: 3, 2, 1 (stops when i is 0). print joins them: 321.",
  },
  {
    id: "for-p4", concept: "for-loops", kind: "predict", difficulty: 2,
    prompt: "Stepping by 2. What does this print?",
    code: "for (int i = 0; i <= 8; i += 2) {\n    System.out.print(i + \" \");\n}",
    choices: ["0 2 4 6 8 ", "0 1 2 3 4 ", "2 4 6 8 ", "0 2 4 6 8 10 "], answerIndex: 0,
    explain: "i += 2 jumps by 2: 0, 2, 4, 6, 8. It stops at 8 because i <= 8.",
  },
  {
    id: "for-p5", concept: "for-loops", kind: "predict", difficulty: 2,
    prompt: "A running product. What does this print?",
    code: "int p = 1;\nfor (int i = 1; i <= 4; i++) {\n    p *= i;\n}\nSystem.out.println(p);",
    choices: ["10", "24", "4", "12"], answerIndex: 1,
    explain: "p multiplies in 1*2*3*4 = 24. (Starting p at 1, not 0, matters for products.)",
  },
  {
    id: "for-p6", concept: "for-loops", kind: "predict", difficulty: 3,
    prompt: "Off-by-one. How many times does the body run?",
    code: "int c = 0;\nfor (int i = 0; i <= 3; i++) {\n    c++;\n}\nSystem.out.println(c);",
    choices: ["3", "4", "5", "2"], answerIndex: 1,
    explain: "i goes 0, 1, 2, 3 — four passes — because <= includes 3. With < 3 it would be three.",
    choiceNotes: ["i takes 0, 1, 2, 3 — that's 4 values, because <= includes 3. (< 3 would give 3.)", "", "", ""],
  },
  {
    id: "for-w2", concept: "for-loops", kind: "write-line", difficulty: 2,
    prompt: "Add each i into s so it totals 1+2+3+4+5 = 15 (should print 15).",
    template: "public void run(Drone drone, Farm farm) {\n    int s = 0;\n    for (int i = 1; i <= 5; i++) {\n        __LINE__\n    }\n    System.out.println(s);\n}",
    starter: "s += ?;",
    requirePattern: "s\\s*\\+=|s\\s*=\\s*s\\s*\\+", patternHint: "add i into the total, like s += i",
    expectStdout: "15",
    explain: "s += i adds the current i into the running total each pass: 1+2+3+4+5 = 15.",
  },

  // =================================================== CORE EXPANSION: while-loops
  {
    id: "while-p3", concept: "while-loops", kind: "predict", difficulty: 2,
    prompt: "How many digits? What does this print?",
    code: "int n = 5063;\nint c = 0;\nwhile (n > 0) {\n    c++;\n    n = n / 10;\n}\nSystem.out.println(c);",
    choices: ["3", "4", "5", "5063"], answerIndex: 1,
    explain: "Each pass divides by 10 (drops a digit) and counts: 5063 -> 506 -> 50 -> 5 -> 0. That is 4 digits.",
  },
  {
    id: "while-p4", concept: "while-loops", kind: "predict", difficulty: 3,
    prompt: "Doubling until big. What does this print?",
    code: "int n = 1;\nint c = 0;\nwhile (n < 100) {\n    n *= 2;\n    c++;\n}\nSystem.out.println(c);",
    choices: ["6", "7", "8", "100"], answerIndex: 1,
    explain: "n doubles: 1->2->4->8->16->32->64->128. That is 7 doublings before n reaches/passes 100.",
  },
  {
    id: "while-p5", concept: "while-loops", kind: "predict", difficulty: 2,
    prompt: "Sum until a threshold. What does this print?",
    code: "int n = 1;\nint s = 0;\nwhile (s < 10) {\n    s += n;\n    n++;\n}\nSystem.out.println(s);",
    choices: ["10", "9", "15", "6"], answerIndex: 0,
    explain: "Adds 1, 2, 3, 4 -> s becomes 1, 3, 6, 10. At 10 the test s < 10 is false, so it stops at 10.",
  },
  {
    id: "while-w2", concept: "while-loops", kind: "write-line", difficulty: 2,
    prompt: "Fill the condition so it prints 3, then 2, then 1 (each on its own line).",
    template: "public void run(Drone drone, Farm farm) {\n    int n = 3;\n    while (__LINE__) {\n        System.out.println(n);\n        n--;\n    }\n}",
    starter: "n > ?",
    requirePattern: "n\\s*>\\s*0", patternHint: "the test n > 0",
    expectStdout: "3\n2\n1",
    explain: "n > 0 keeps the loop going while n is 3, 2, 1 and stops at 0. n-- shrinks it each pass.",
  },

  // ====================================================== CORE EXPANSION: arrays
  {
    id: "arrays-p3", concept: "arrays", kind: "predict", difficulty: 2,
    prompt: "Sum the array. What does this print?",
    code: "int[] a = {3, 1, 4};\nint s = 0;\nfor (int i = 0; i < a.length; i++) {\n    s += a[i];\n}\nSystem.out.println(s);",
    choices: ["7", "8", "3", "4"], answerIndex: 1,
    explain: "Add every element: 3 + 1 + 4 = 8. This loop-and-accumulate is the core array pattern.",
  },
  {
    id: "arrays-p4", concept: "arrays", kind: "predict", difficulty: 2,
    prompt: "Find the max. What does this print?",
    code: "int[] a = {4, 9, 2, 7};\nint m = a[0];\nfor (int i = 1; i < a.length; i++) {\n    if (a[i] > m) m = a[i];\n}\nSystem.out.println(m);",
    choices: ["4", "7", "9", "22"], answerIndex: 2,
    explain: "Start m at the first element, then keep the bigger one each time: the max is 9.",
  },
  {
    id: "arrays-p5", concept: "arrays", kind: "predict", difficulty: 2,
    prompt: "Count the matches. What does this print?",
    code: "int[] a = {5, 5, 2, 5};\nint c = 0;\nfor (int i = 0; i < a.length; i++) {\n    if (a[i] == 5) c++;\n}\nSystem.out.println(c);",
    choices: ["2", "3", "4", "5"], answerIndex: 1,
    explain: "Three of the four elements equal 5, so c ends at 3.",
  },
  {
    id: "arrays-p6", concept: "arrays", kind: "predict", difficulty: 3,
    prompt: "Read it backwards. What does this print?",
    code: "int[] a = {1, 2, 3};\nfor (int i = a.length - 1; i >= 0; i--) {\n    System.out.print(a[i]);\n}",
    choices: ["123", "321", "312", "0123"], answerIndex: 1,
    explain: "Start at the last index (length - 1) and step down to 0: 3, 2, 1.",
  },
  {
    id: "arrays-p7", concept: "arrays", kind: "predict", difficulty: 1,
    prompt: "The last element. What does this print?",
    code: "int[] a = {4, 7, 2, 9};\nSystem.out.println(a[a.length - 1]);",
    choices: ["4", "9", "2", "error"], answerIndex: 1,
    explain: "The last valid index is length - 1 = 3, and a[3] is 9. a[a.length] would be out of bounds.",
  },
  {
    id: "arrays-p8", concept: "arrays", kind: "predict", difficulty: 3,
    prompt: "Whole-number average. What does this print?",
    code: "int[] a = {2, 4, 9};\nint s = 0;\nfor (int i = 0; i < a.length; i++) {\n    s += a[i];\n}\nSystem.out.println(s / a.length);",
    choices: ["5", "3", "15", "4"], answerIndex: 0,
    explain: "Sum is 15, length is 3, and 15 / 3 = 5. (int division, so a sum like 16/3 would give 5 too.)",
  },

  // ====================================================== CORE EXPANSION: methods
  {
    id: "methods-p3", concept: "methods", kind: "predict", difficulty: 2,
    prompt: "A max helper. What does this print?",
    code: "int max(int a, int b) {\n    if (a > b) return a;\n    return b;\n}\n// ...\nSystem.out.println(max(3, 8));",
    choices: ["3", "8", "11", "error"], answerIndex: 1,
    explain: "max(3, 8): 3 > 8 is false, so it returns b (8). return hands a value back to the caller.",
  },
  {
    id: "methods-p4", concept: "methods", kind: "predict", difficulty: 2,
    prompt: "A method that returns a boolean. What does this print?",
    code: "boolean even(int n) {\n    return n % 2 == 0;\n}\n// ...\nSystem.out.println(even(10));",
    choices: ["true", "false"], answerIndex: 0,
    explain: "even(10): 10 % 2 == 0 is true, so the method returns true. Methods can return any type.",
  },
  {
    id: "methods-p5", concept: "methods", kind: "predict", difficulty: 3,
    prompt: "Calling a helper inside a loop. What does this print?",
    code: "int sq(int x) {\n    return x * x;\n}\n// ...\nint s = 0;\nfor (int i = 1; i <= 3; i++) {\n    s += sq(i);\n}\nSystem.out.println(s);",
    choices: ["6", "14", "36", "9"], answerIndex: 1,
    explain: "sq(1)+sq(2)+sq(3) = 1 + 4 + 9 = 14. A helper keeps the loop body short and clear.",
  },
  {
    id: "methods-w2", concept: "methods", kind: "write-line", difficulty: 2,
    prompt: "Finish triple so triple(4) returns 12 (it should print 12).",
    template: "public void run(Drone drone, Farm farm) {\n    System.out.println(triple(4));\n}\n\nint triple(int x) {\n    __LINE__\n}",
    starter: "return x * ?;",
    requirePattern: "return", patternHint: "a return statement",
    expectStdout: "12",
    explain: "return x * 3 sends 12 back for triple(4). Without return, the method gives nothing back.",
  },

  // ============================================ CORE EXPANSION: sequential-search
  {
    id: "seq-p3", concept: "sequential-search", kind: "predict", difficulty: 2,
    prompt: "Counting comparisons. What does comparisons print?",
    code: "String[] c = {\"WHEAT\", \"CORN\", \"PUMPKIN\"};\nint comparisons = 0;\nfor (int i = 0; i < c.length; i++) {\n    comparisons++;\n    if (c[i].equals(\"PUMPKIN\")) break;\n}\nSystem.out.println(comparisons);",
    choices: ["1", "2", "3", "-1"], answerIndex: 2,
    explain: "It checks WHEAT, CORN, then PUMPKIN — 3 comparisons before the match is found.",
  },
  {
    id: "seq-p4", concept: "sequential-search", kind: "predict", difficulty: 2,
    prompt: "First match wins. What does idx print?",
    code: "int[] a = {2, 5, 5, 8};\nint idx = -1;\nfor (int i = 0; i < a.length; i++) {\n    if (a[i] == 5) { idx = i; break; }\n}\nSystem.out.println(idx);",
    choices: ["1", "2", "-1", "5"], answerIndex: 0,
    explain: "break stops at the FIRST 5 (index 1). Without break, idx would end at the last 5 (index 2).",
  },
  {
    id: "seq-p5", concept: "sequential-search", kind: "predict", difficulty: 1,
    prompt: "Which is true about sequential (linear) search?",
    choices: [
      "It only works on sorted arrays",
      "It works on any array, sorted or not",
      "It needs the array length to be even",
      "It always finds the answer in one step",
    ], answerIndex: 1,
    explain: "Linear search checks elements one by one, so it works on any array — that's its strength (binary search needs sorting).",
  },

  // ================================================ CORE EXPANSION: binary-search
  {
    id: "bin-p3", concept: "binary-search", kind: "predict", difficulty: 1,
    prompt: "Binary search requires the array to be...",
    choices: ["sorted", "reversed", "all positive", "short"], answerIndex: 0,
    explain: "Binary search only works on a sorted array — that's what lets it throw away half each step.",
  },
  {
    id: "bin-p4", concept: "binary-search", kind: "predict", difficulty: 3,
    prompt: "Searching for 9 in {1,3,5,7,9}. a[mid]=5 was too small so low became 3. What is the NEXT mid index?",
    choices: ["2", "3", "4", "1"], answerIndex: 1,
    explain: "Now low=3, high=4, so mid = (3 + 4) / 2 = 3 (int division). The window keeps halving.",
  },
  {
    id: "bin-p5", concept: "binary-search", kind: "predict", difficulty: 2,
    prompt: "A sorted list of 1000 items — about how many checks does binary search need?",
    choices: ["1000", "500", "about 10", "100"], answerIndex: 2,
    explain: "Halving 1000 takes ~10 steps (2^10 = 1024). That's why binary search beats a 1000-step linear scan.",
  },

  // ================================================== CORE EXPANSION: bubble-sort
  {
    id: "bubble-p3", concept: "bubble-sort", kind: "predict", difficulty: 1,
    prompt: "Swapping a[i] and a[i+1] correctly needs a...",
    choices: ["temp variable", "second array", "sorted array", "return value"], answerIndex: 0,
    explain: "Save one value in a temp first, or the assignment overwrites it and both slots end up equal.",
  },
  {
    id: "bubble-p4", concept: "bubble-sort", kind: "predict", difficulty: 3,
    prompt: "Ascending bubble sort on {4,3,2,1}. After ONE full pass, what is a[0]?",
    code: "int[] a = {4, 3, 2, 1};\nfor (int i = 0; i < a.length - 1; i++) {\n    if (a[i] > a[i + 1]) {\n        int t = a[i]; a[i] = a[i + 1]; a[i + 1] = t;\n    }\n}\nSystem.out.println(a[0]);",
    choices: ["4", "3", "1", "2"], answerIndex: 1,
    explain: "One pass bubbles the LARGEST (4) to the end, not the smallest to the front. a becomes {3,2,1,4}, so a[0] is 3.",
  },

  // =============================================== CORE EXPANSION: selection-sort
  {
    id: "sel-p3", concept: "selection-sort", kind: "predict", difficulty: 2,
    prompt: "Ascending selection sort, first slot. What does this print?",
    code: "int[] a = {5, 2, 8, 1};\nint best = 0;\nfor (int i = 1; i < a.length; i++) {\n    if (a[i] < a[best]) best = i;\n}\nSystem.out.println(a[best]);",
    choices: ["5", "2", "1", "8"], answerIndex: 2,
    explain: "It scans for the SMALLEST value (ascending): 1. That value gets swapped into the first slot.",
  },
  {
    id: "sel-p4", concept: "selection-sort", kind: "predict", difficulty: 2,
    prompt: "Selection-sorting prices that have a parallel crops array — on each swap you must...",
    choices: [
      "swap both arrays together",
      "swap only the prices",
      "sort the crops separately afterwards",
      "ignore the crops array",
    ], answerIndex: 0,
    explain: "Swap crops[slot] and crops[best] alongside the prices, or a name ends up attached to the wrong price.",
  },

  // =========================== FRQ COVERAGE: combined patterns from this year's exams
  {
    id: "mod-p7", concept: "modulo-division", kind: "predict", difficulty: 3,
    prompt: "DivBySum: total the digits of num that are divisible by n. What does this print?",
    code: "int num = 413629;\nint n = 3;\nint sum = 0;\nwhile (num > 0) {\n    int d = num % 10;\n    if (d % n == 0) sum += d;\n    num = num / 10;\n}\nSystem.out.println(sum);",
    choices: ["15", "18", "22", "9"], answerIndex: 1,
    explain: "Peel each digit; keep the ones where d % n == 0 (3, 6, 9). 3 + 6 + 9 = 18.",
  },
  {
    id: "mod-p8", concept: "modulo-division", kind: "predict", difficulty: 3,
    prompt: "Are num's digits strictly increasing left-to-right? What does this print?",
    code: "int num = 1336;\nboolean inc = true;\nint prev = 10;\nwhile (num > 0) {\n    int d = num % 10;\n    if (d >= prev) inc = false;\n    prev = d;\n    num = num / 10;\n}\nSystem.out.println(inc);",
    choices: ["true", "false"], answerIndex: 1,
    explain: "Strictly increasing means each digit is bigger than the previous. 1,3,3,6 has 3 then 3 (not bigger), so false. (1356 would be true.)",
  },
  {
    id: "while-p6", concept: "while-loops", kind: "predict", difficulty: 3,
    prompt: "Longest run of identical digits — what length does this print?",
    code: "int num = 4441;\nint best = 1, run = 1;\nint prev = num % 10;\nnum = num / 10;\nwhile (num > 0) {\n    int d = num % 10;\n    if (d == prev) run++; else run = 1;\n    if (run > best) best = run;\n    prev = d;\n    num = num / 10;\n}\nSystem.out.println(best);",
    choices: ["2", "3", "4", "1"], answerIndex: 1,
    explain: "Track the current run length; reset to 1 when the digit changes, keep the best. The three 4s give a run of 3.",
  },
  {
    id: "if-p7", concept: "if-else", kind: "predict", difficulty: 3,
    prompt: "Most acidic solution: acidic = pH 1 to 6; print the lowest acidic pH, or -1 if none. What prints?",
    code: "int s0 = 7, s1 = 4, s2 = 10;\nint best = -1;\nif (s0 >= 1 && s0 <= 6) best = s0;\nif (s1 >= 1 && s1 <= 6 && (best == -1 || s1 < best)) best = s1;\nif (s2 >= 1 && s2 <= 6 && (best == -1 || s2 < best)) best = s2;\nSystem.out.println(best);",
    choices: ["7", "4", "-1", "10"], answerIndex: 1,
    explain: "Only pH 1-6 counts. 7 and 10 are not acidic; 4 is, so the most acidic is 4. With no acidic solutions it prints -1.",
  },
  {
    id: "if-p8", concept: "if-else", kind: "predict", difficulty: 3,
    prompt: "Valid code: 5 to 8 digits AND must not contain the digit 2. Is 13456 valid?",
    code: "int num = 13456;\nint min = 5, max = 8, bad = 2;\nint len = 0;\nboolean hasBad = false;\nint n = num;\nwhile (n > 0) {\n    if (n % 10 == bad) hasBad = true;\n    len++;\n    n = n / 10;\n}\nboolean valid = len >= min && len <= max && !hasBad;\nSystem.out.println(valid);",
    choices: ["true", "false"], answerIndex: 0,
    explain: "Length 5 is within 5-8 and there is no digit 2, so valid is true. (123456 would be false — it contains a 2.)",
  },
  {
    id: "arrays-p9", concept: "arrays", kind: "predict", difficulty: 3,
    prompt: "Did the scores 'improve' (each value >= the one before it)? What prints?",
    code: "int[] a = {20, 50, 50, 53, 80};\nboolean improved = true;\nfor (int i = 1; i < a.length; i++) {\n    if (a[i] < a[i - 1]) improved = false;\n}\nSystem.out.println(improved);",
    choices: ["true", "false"], answerIndex: 0,
    explain: "Compare each element to the previous one. Nothing drops (50 >= 50 still counts), so improved is true. This is the 'improved' check from the Scores problem.",
  },
  {
    id: "arrays-p10", concept: "arrays", kind: "predict", difficulty: 3,
    prompt: "Clamp to [-2000, 2000]: out-of-range values get pulled in. How many values change?",
    code: "int[] a = {40, 2532, -2300, 1048, -32};\nint limit = 2000;\nint changed = 0;\nfor (int i = 0; i < a.length; i++) {\n    if (a[i] > limit) { a[i] = limit; changed++; }\n    else if (a[i] < -limit) { a[i] = -limit; changed++; }\n}\nSystem.out.println(changed);",
    choices: ["1", "2", "3", "5"], answerIndex: 1,
    explain: "Only values outside [-2000, 2000] change: 2532 and -2300. That's 2. This is the in-place array-modification pattern from the Sound problem.",
  },

  // ===================================================== CORE: static-methods (writing)
  {
    id: "sm-p1", concept: "static-methods", kind: "predict", difficulty: 1,
    prompt: "You wrote this helper. What does it print?",
    code: "int doubleIt(int x) {\n    return x * 2;\n}\n// ...\nSystem.out.println(doubleIt(7));",
    choices: ["7", "14", "2", "9"], answerIndex: 1,
    explain: "doubleIt(7) runs return x * 2 with x = 7, handing back 14.",
    choiceNotes: ["7 is the argument you passed in — the method transforms it before returning.", "", "2 is the multiplier inside the method, not the result.", "x * 2 multiplies (14); it does not add 2."],
  },
  {
    id: "sm-p2", concept: "static-methods", kind: "predict", difficulty: 2,
    prompt: "A helper with two parameters. What does it print?",
    code: "int area(int w, int h) {\n    return w * h;\n}\n// ...\nSystem.out.println(area(3, 5));",
    choices: ["8", "15", "35", "53"], answerIndex: 1,
    explain: "w gets 3 and h gets 5 (in order), so it returns 3 * 5 = 15.",
    choiceNotes: ["8 is 3 + 5 — area multiplies the two sides, not adds them.", "", "", "Arguments fill parameters in order: w = 3, h = 5."],
  },
  {
    id: "sm-p3", concept: "static-methods", kind: "predict", difficulty: 2,
    prompt: "A method can return a boolean. What does it print?",
    code: "boolean isEven(int n) {\n    return n % 2 == 0;\n}\n// ...\nSystem.out.println(isEven(7));",
    choices: ["true", "false"], answerIndex: 1,
    explain: "7 % 2 is 1, and 1 == 0 is false, so isEven(7) returns false.",
    choiceNotes: ["7 % 2 is 1 (odd), and 1 == 0 is false — so it returns false.", ""],
  },
  {
    id: "sm-p4", concept: "static-methods", kind: "predict", difficulty: 3,
    prompt: "The method changes its parameter, then returns. What does it print?",
    code: "int f(int x) {\n    x = x * 2;\n    return x + 1;\n}\n// ...\nSystem.out.println(f(3));",
    choices: ["3", "6", "7", "4"], answerIndex: 2,
    explain: "Inside f, x becomes 3 * 2 = 6, then it returns 6 + 1 = 7.",
    choiceNotes: ["The parameter is a copy f works on; it returns a computed value, not the original 3.", "x becomes 6, but the method returns x + 1, so 7.", "", "It doubles first (6), then adds 1."],
  },
  {
    id: "sm-p5", concept: "static-methods", kind: "predict", difficulty: 3,
    prompt: "One method calling another. What does it print?",
    code: "int sq(int x) { return x * x; }\nint sumSq(int a, int b) {\n    return sq(a) + sq(b);\n}\n// ...\nSystem.out.println(sumSq(2, 3));",
    choices: ["10", "13", "25", "36"], answerIndex: 1,
    explain: "sq(2) is 4 and sq(3) is 9, so sumSq returns 4 + 9 = 13.",
    choiceNotes: ["", "", "25 is (2 + 3) squared — but each is squared first, then added.", "36 is (2*3) squared. Each value is squared on its own."],
  },
  {
    id: "sm-p6", concept: "static-methods", kind: "predict", difficulty: 3,
    prompt: "Calling a helper inside a loop. What does it print?",
    code: "int pts(int lvl) { return lvl * 10 + 5; }\n// ...\nint total = 0;\nfor (int i = 1; i <= 3; i++) {\n    total += pts(i);\n}\nSystem.out.println(total);",
    choices: ["45", "75", "60", "90"], answerIndex: 1,
    explain: "pts(1)=15, pts(2)=25, pts(3)=35; 15 + 25 + 35 = 75.",
    choiceNotes: ["45 forgets the +5 each call (10+20+30). Each call adds 5 too.", "", "", ""],
  },
  {
    id: "sm-w1", concept: "static-methods", kind: "write-line", difficulty: 2,
    prompt: "Finish half so half(10) returns 5 (it should print 5).",
    template: "public void run(Drone drone, Farm farm) {\n    System.out.println(half(10));\n}\n\nint half(int x) {\n    __LINE__\n}",
    starter: "return x / ?;",
    requirePattern: "return", patternHint: "a return statement",
    expectStdout: "5",
    explain: "return x / 2 sends back 5 for half(10). A method needs return to hand a value to the caller.",
  },
  {
    id: "sm-w2", concept: "static-methods", kind: "write-line", difficulty: 2,
    prompt: "Finish isPositive so isPositive(4) returns true (it should print true).",
    template: "public void run(Drone drone, Farm farm) {\n    System.out.println(isPositive(4));\n}\n\nboolean isPositive(int n) {\n    __LINE__\n}",
    starter: "return n > ?;",
    requirePattern: "return", patternHint: "a return statement giving a boolean",
    expectStdout: "true",
    explain: "return n > 0 gives true for 4. A method can return a boolean (true/false) just like an int.",
  },
];

// ----------------------------------------------------------------- selectors
export function allDrillConcepts(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const d of DRILLS) {
    if (!seen.has(d.concept)) {
      seen.add(d.concept);
      out.push(d.concept);
    }
  }
  return out;
}

export function getDrillsForConcept(concept: string): Drill[] {
  return DRILLS.filter((d) => d.concept === concept);
}

export function hasDrills(concept: string): boolean {
  return DRILLS.some((d) => d.concept === concept);
}

/** Look up a single drill by id (across all concepts). */
export function drillById(id: string): Drill | null {
  return DRILLS.find((d) => d.id === id) ?? null;
}

/**
 * Every drill the learner currently has wrong, across all concepts — the pool
 * for "Review my misses". Deduped; only ids that still resolve to a real drill.
 */
export function collectWrongDrills(practice: PracticeState): Drill[] {
  const ids = new Set<string>();
  for (const cp of Object.values(practice)) {
    for (const id of cp?.wrong ?? []) ids.add(id);
  }
  const out: Drill[] = [];
  for (const id of ids) {
    const d = drillById(id);
    if (d) out.push(d);
  }
  return out;
}

/**
 * Adaptive pick: prefer drills the learner got wrong, then unseen, then the
 * least-recently practiced; avoid repeating `excludeId` back-to-back.
 */
export function pickDrill(concept: string, practice: PracticeState, excludeId?: string): Drill | null {
  const pool = getDrillsForConcept(concept).filter((d) => d.id !== excludeId);
  if (pool.length === 0) {
    // only one drill for the concept — allow the repeat
    return getDrillsForConcept(concept)[0] ?? null;
  }
  const cp = practice[concept] ?? emptyConceptPractice();
  const wrong = pool.filter((d) => cp.wrong.includes(d.id));
  if (wrong.length) return wrong[Math.floor(Math.random() * wrong.length)];
  const unseen = pool.filter((d) => !cp.seen.includes(d.id));
  if (unseen.length) return unseen[Math.floor(Math.random() * unseen.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ----------------------------------------------------------------- checking
export function checkPredict(drill: PredictDrill, choiceIndex: number): boolean {
  return choiceIndex === drill.answerIndex;
}

export interface WriteLineRun {
  compiled: boolean;
  runtimeError: string;
  stdout: string;
  patternOk: boolean;
}

/** Compile + run the learner's line via the existing /api/run (throwaway state). */
export async function runWriteLine(drill: WriteLineDrill, line: string): Promise<WriteLineRun> {
  const patternOk = safeMatch(drill.requirePattern, line);
  const body = drill.template.replace("__LINE__", line);
  const code = buildStrategySource(body);
  const response = await fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, farmState: createDefaultFarmState() }),
  });
  const data = (await response.json()) as RunResponse;
  return {
    compiled: Boolean(data.compiled),
    runtimeError: (data.runtimeError ?? "").trim(),
    stdout: (data.stdout ?? "").trim(),
    patternOk,
  };
}

export interface DrillVerdict {
  pass: boolean;
  reason: string;
}

export function evaluateWriteLine(drill: WriteLineDrill, run: WriteLineRun): DrillVerdict {
  if (!run.patternOk) return { pass: false, reason: `Use ${drill.patternHint}.` };
  if (!run.compiled) return { pass: false, reason: "That doesn't compile yet — check the syntax (semicolons, brackets)." };
  if (run.runtimeError) return { pass: false, reason: `It compiled but errored when run: ${run.runtimeError}` };
  if (drill.expectStdout != null && run.stdout !== drill.expectStdout) {
    return { pass: false, reason: `Output didn't match.\nExpected:\n${drill.expectStdout}\nGot:\n${run.stdout || "(nothing)"}` };
  }
  return { pass: true, reason: "Correct!" };
}

function safeMatch(pattern: string, text: string): boolean {
  try {
    return new RegExp(pattern).test(text);
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------- progress
/** Apply a drill result to the practice store, returning a new state. */
export function recordDrillResult(practice: PracticeState, drill: Drill, correct: boolean): PracticeState {
  const prev: ConceptPractice = practice[drill.concept] ?? emptyConceptPractice();
  const seen = prev.seen.includes(drill.id) ? prev.seen : [...prev.seen, drill.id];
  let wrong = prev.wrong;
  let next: ConceptPractice;
  if (correct) {
    wrong = prev.wrong.filter((id) => id !== drill.id);
    const gain = drill.kind === "write-line" ? XP_WRITE : XP_PREDICT;
    next = { ...prev, xp: prev.xp + gain, streak: prev.streak + 1, done: prev.done + 1, seen, wrong, lastTs: Date.now() };
  } else {
    wrong = prev.wrong.includes(drill.id) ? prev.wrong : [...prev.wrong, drill.id];
    next = { ...prev, streak: 0, seen, wrong, lastTs: Date.now() };
  }
  return { ...practice, [drill.concept]: next };
}

/** 0..1 practice mastery for a concept (correct answers toward MASTERY_TARGET). */
export function practiceMastery(practice: PracticeState, concept: string): number {
  const cp = practice[concept];
  if (!cp) return 0;
  return Math.max(0, Math.min(1, cp.done / MASTERY_TARGET));
}

export function totalXp(practice: PracticeState): number {
  return Object.values(practice).reduce((sum, cp) => sum + (cp?.xp ?? 0), 0);
}
