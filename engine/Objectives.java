/**
 * Ordered curriculum registry. This is the source of truth for objective
 * metadata shown in the UI and objective checks run after Strategy finishes.
 */
public class Objectives {
    private static final Objective[] ALL = new Objective[] {
        new Objective(
            "first-sprout",
            "First Sprout",
            "methods",
            "Call drone methods in a clear sequence to move along the top row and plant wheat. Each method call is one instruction the drone performs.",
            "drone.moveEast();\ndrone.plant(Crop.WHEAT);\ndrone.watch(\"planted\", 1);",
            new String[] {
                "The drone starts at (0, 0). Move east before planting the first target tile.",
                "A method call has parentheses: drone.moveEast();",
                "Plant tiles (1,0), (2,0), and (3,0)."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        for (int i = 0; i < 3; i++) {\n            drone.moveEast();\n            drone.plant(Crop.WHEAT);\n            drone.watch(\"planted\", i + 1);\n        }\n    }\n}\n",
            "basic-planting",
            6, 4, "", 0, new int[0], new String[0], new int[0]
        ),
        new Objective(
            "store-the-reading",
            "Store the Reading",
            "variables-types",
            "Variables are named boxes for values. The drone scanned two fields today: 12 wheat plants and 8 corn. Declare int variables, do the arithmetic, and watch each result so it lights up the live Inspector. Compute the total, the gap between the two fields, and the total doubled.",
            "int a = 10;\nint b = 4;\nint sum = a + b;     // 14\ndrone.watch(\"sum\", sum);",
            new String[] {
                "Declare two ints: int wheat = 12; int corn = 8;",
                "total is wheat + corn; gap is wheat - corn.",
                "doubled is total * 2. Watch each: drone.watch(\"total\", total);"
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int wheat = 12;\n        int corn = 8;\n        // TODO: compute total (sum), gap (difference), and doubled (total * 2),\n        // then watch each one so it shows in the Inspector.\n    }\n}\n",
            "sensor-readout",
            6, 4, "", 0, new int[0], new String[0], new int[0]
        ),
        new Objective(
            "split-the-harvest",
            "Split the Harvest",
            "variables-types",
            "int division throws away the remainder, but a double keeps the decimal. You harvested 18 crops to pack into baskets of 4. Compute fullBaskets with int division (18 / 4), then the exact average per basket as a double (18.0 / 4). Watch how the two differ.",
            "int items = 9;\nint per = 2;\nint whole = items / per;   // 4   (int division)\ndouble exact = 9.0 / per;  // 4.5 (double keeps the .5)",
            new String[] {
                "fullBaskets uses int division: crops / basketSize.",
                "For the exact value, make one side a double: 18.0 / basketSize.",
                "Watch crops = 18, fullBaskets, and exact."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int crops = 18;\n        int basketSize = 4;\n        // TODO: fullBaskets = crops / basketSize  (int division)\n        //       exact = the same division but as a double (hint: 18.0)\n        //       watch crops, fullBaskets, and exact\n    }\n}\n",
            "basket-packer",
            6, 4, "", 0, new int[0], new String[0], new int[0]
        ),
        new Objective(
            "valve-check",
            "Valve Check",
            "modulo-division",
            "% gives the remainder; / gives the whole quotient. The irrigation valve cycles every 5 ticks. At tick 17, compute the remainder (17 % 5) to see where in the cycle it sits, the completed cycles (17 / 5), and whether 17 is even (17 % 2 == 0).",
            "int n = 23;\nint rem = n % 5;            // 3\nint cycles = n / 5;         // 4\nboolean even = n % 2 == 0;  // false",
            new String[] {
                "remainder is tick % 5.",
                "cycles (completed) is tick / 5.",
                "even is tick % 2 == 0 — watch it as a boolean."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int tick = 17;\n        // TODO: remainder = tick % 5, cycles = tick / 5, even = (tick % 2 == 0)\n        // watch remainder, cycles, and even\n    }\n}\n",
            "valve-cycle",
            6, 4, "", 0, new int[0], new String[0], new int[0]
        ),
        new Objective(
            "decode-the-code",
            "Decode the Code",
            "modulo-division",
            "Peel a number apart with % and /. The controller shows a 4-digit code in farm.moisture()[0]. Read the ones digit (% 10), the tens digit ((code / 10) % 10), and the thousands digit (code / 1000).",
            "int code = farm.moisture()[0]; // e.g. 5238\nint ones = code % 10;          // 8\nint tens = (code / 10) % 10;   // 3\nint thousands = code / 1000;   // 5",
            new String[] {
                "Read the code: int code = farm.moisture()[0];",
                "ones = code % 10; tens = (code / 10) % 10;",
                "thousands = code / 1000; watch each digit."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int code = farm.moisture()[0];\n        // TODO: extract ones, tens, and thousands digits with % and /\n        // watch ones, tens, and thousands\n    }\n}\n",
            "code-decoder",
            6, 4, "", 0, new int[0], new String[0], new int[] { 5238 }
        ),
        new Objective(
            "ripeness-check",
            "Ripeness Check",
            "comparison-operators",
            "Comparisons answer true/false. The drone scans a tile: farm.moisture()[0] is its moisture (42) and farm.moisture()[1] is its growth stage (8). A tile is dryEnough when moisture < 50, mature when growth >= 5, and ready when BOTH hold (&&).",
            "int m = farm.moisture()[0];       // 42\nboolean dry = m < 50;             // true\nboolean both = dry && (8 >= 5);   // true",
            new String[] {
                "Read both: int moisture = farm.moisture()[0]; int growth = farm.moisture()[1];",
                "dryEnough = moisture < 50; mature = growth >= 5;",
                "ready = dryEnough && mature; watch all three booleans."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int moisture = farm.moisture()[0];\n        int growth = farm.moisture()[1];\n        // TODO: dryEnough = moisture < 50; mature = growth >= 5; ready = both\n        // watch dryEnough, mature, and ready\n    }\n}\n",
            "ripeness-scanner",
            6, 4, "", 0, new int[0], new String[0], new int[] { 42, 8 }
        ),
        new Objective(
            "threshold-flag",
            "Threshold Flag",
            "comparison-operators",
            "Combine conditions with && (and), || (or), ! (not). farm.moisture()[0] is moisture (25), [1] is temperature (40). A tile needsWater if moisture < 30 OR temp > 35. It is inRange if moisture is between 30 and 60 inclusive. notHot is the opposite of temp > 35.",
            "boolean needs = (m < 30) || (t > 35);\nboolean inRange = (m >= 30) && (m <= 60);\nboolean notHot = !(t > 35);",
            new String[] {
                "needsWater = moisture < 30 || temp > 35;",
                "inRange = moisture >= 30 && moisture <= 60;",
                "notHot = !(temp > 35); watch all three."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int moisture = farm.moisture()[0];\n        int temp = farm.moisture()[1];\n        // TODO: needsWater (||), inRange (&&), notHot (!)\n        // watch needsWater, inRange, and notHot\n    }\n}\n",
            "smart-irrigation",
            6, 4, "", 0, new int[0], new String[0], new int[] { 25, 40 }
        ),
        new Objective(
            "classify-moisture",
            "Classify the Moisture",
            "if-else",
            "if / else if / else picks exactly one branch. Classify three tile readings in farm.moisture(): below 30 is DRY, below 70 is OK, otherwise WET. Watch the label for each reading.",
            "int m = 55;\nString s;\nif (m < 30) s = \"DRY\";\nelse if (m < 70) s = \"OK\";\nelse s = \"WET\";   // 55 -> \"OK\"",
            new String[] {
                "Read the three readings: int[] m = farm.moisture();",
                "For each: if (m[i] < 30) DRY; else if (m[i] < 70) OK; else WET.",
                "Watch status0, status1, status2 as Strings."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int[] m = farm.moisture();\n        // TODO: classify m[0], m[1], m[2] into \"DRY\" / \"OK\" / \"WET\"\n        // watch status0, status1, and status2\n    }\n}\n",
            "moisture-classifier",
            6, 4, "", 0, new int[0], new String[0], new int[] { 55, 18, 90 }
        ),
        new Objective(
            "field-grader",
            "The Field Grader",
            "if-else",
            "Chain decisions: first grade a field's score, then decide an action from that grade. score is farm.moisture()[0]. Grade: >=90 A, >=80 B, >=70 C, else F. Then if the grade is A or B the action is HARVEST, otherwise WAIT.",
            "String grade;\nif (score >= 90) grade = \"A\";\nelse if (score >= 80) grade = \"B\";\nelse if (score >= 70) grade = \"C\";\nelse grade = \"F\";",
            new String[] {
                "Read the score: int score = farm.moisture()[0];",
                "Grade with an else-if ladder: >=90 A, >=80 B, >=70 C, else F.",
                "action is HARVEST when grade.equals(\"A\") || grade.equals(\"B\"), else WAIT."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int score = farm.moisture()[0];\n        // TODO: grade the score into \"A\" / \"B\" / \"C\" / \"F\"\n        //       action = \"HARVEST\" if grade is A or B, else \"WAIT\"\n        // watch grade and action\n    }\n}\n",
            "auto-grader",
            6, 4, "", 0, new int[0], new String[0], new int[] { 85 }
        ),
        new Objective(
            "the-long-rows",
            "The Long Rows",
            "for-loops",
            "Use a for loop to repeat the same move and plant pattern across an entire row. The field is wider now, so repeated code is harder to maintain.",
            "for (int x = 0; x < farm.width(); x++) {\n    drone.plant(Crop.WHEAT);\n    drone.watch(\"tiles\", x + 1);\n    if (x < farm.width() - 1) drone.moveEast();\n}",
            new String[] {
                "farm.width() tells you how many columns are in the row.",
                "The loop counter should start at 0 and continue while it is less than farm.width().",
                "Only move east between tiles, not after the last tile."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        for (int x = 0; x < farm.width(); x++) {\n            // plant, watch, and move between tiles\n        }\n    }\n}\n",
            "bigger-field",
            8, 5, "", 0, new int[0], new String[0], new int[0]
        ),
        new Objective(
            "sum-the-row",
            "Sum the Row",
            "for-loops",
            "Use a for loop to sweep the moisture sensors along the row. Read each farm.moisture()[i], add it to a running total, and count how many readings are above 5. Watch the loop index i each pass so you can watch it climb in the Inspector.",
            "int[] r = farm.moisture();\nint total = 0;\nfor (int i = 0; i < r.length; i++) {\n    total += r[i];\n    drone.watch(\"i\", i);\n}",
            new String[] {
                "Read the sensors once: int[] readings = farm.moisture();",
                "Loop i from 0 to readings.length - 1; total += readings[i]; drone.watch(\"i\", i) each pass.",
                "aboveFive counts readings[i] > 5. Watch total and aboveFive at the end."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int[] readings = farm.moisture();\n        int total = 0;\n        int aboveFive = 0;\n        // TODO: for loop over readings — add each to total, count readings > 5,\n        // and drone.watch(\"i\", i) each pass. Then watch total and aboveFive.\n    }\n}\n",
            "sensor-sweep",
            8, 5, "", 0, new int[0], new String[0], new int[] { 4, 7, 2, 9, 5 }
        ),
        new Objective(
            "sweep-the-field",
            "Sweep the Field",
            "nested-loops",
            "A loop inside a loop visits a whole grid. The outer loop walks the rows (y), the inner loop the columns (x). Sweep every cell of the field, count how many you visit, and watch the row counter y and the column counter x as you go.",
            "for (int y = 0; y < farm.height(); y++) {\n    drone.watch(\"y\", y);\n    for (int x = 0; x < farm.width(); x++) {\n        cells++;\n        drone.watch(\"x\", x);\n    }\n}",
            new String[] {
                "Outer loop over rows: for (int y = 0; y < farm.height(); y++).",
                "Inner loop over columns: for (int x = 0; x < farm.width(); x++).",
                "Count cells in the inner loop; watch y (outer) and x (inner). Watch cells at the end."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int cells = 0;\n        // TODO: nested loops — outer y over farm.height(), inner x over farm.width().\n        // count each cell, drone.watch(\"y\", y) and drone.watch(\"x\", x). Watch cells.\n    }\n}\n",
            "field-map",
            8, 5, "", 0, new int[0], new String[0], new int[0]
        ),
        new Objective(
            "field-pattern",
            "Triangular Nursery",
            "nested-loops",
            "Nested loops where the inner loop depends on the outer one. Plant a triangular nursery: row 0 gets 1 seedling, row 1 gets 2, and so on for farm.height() rows. Use nested loops to count the TOTAL seedlings, watching each one as it is planted.",
            "for (int i = 0; i < rows; i++) {\n    for (int j = 0; j <= i; j++) {\n        seedlings++;\n        drone.watch(\"seed\", seedlings);\n    }\n}",
            new String[] {
                "rows = farm.height(); start seedlings at 0.",
                "Outer i from 0 to rows - 1; inner j from 0 to i (inclusive: j <= i).",
                "Each inner pass plants one seedling: seedlings++ and watch seed. Watch seedlings at the end."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int rows = farm.height();\n        int seedlings = 0;\n        // TODO: nested loops — for i in 0..rows-1, for j in 0..i, seedlings++ and\n        // drone.watch(\"seed\", seedlings). Watch seedlings at the end.\n    }\n}\n",
            "nursery-grid",
            8, 5, "", 0, new int[0], new String[0], new int[0]
        ),
        new Objective(
            "harvest-til-done",
            "Harvest til Done",
            "while-loops",
            "Use while loops when you do not know the exact number of repetitions up front. Harvest ripe wheat until the row is empty, then decode an irrigation code with % and /.",
            "while (n > 0) {\n    int digit = n % 10;\n    n = n / 10;\n}",
            new String[] {
                "Four ripe wheat tiles are waiting in row 1.",
                "A while loop should stop when the drone reaches the end of the row.",
                "Decode farm.moisture()[0], which is 314. Its digit sum is 8."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        // Start at the corner: harvest the current tile FIRST, then move on.\n        while (drone.x() < farm.width()) {\n            drone.harvest();\n            if (drone.x() == farm.width() - 1) break;\n            drone.moveEast();\n        }\n        // TODO: decode farm.moisture()[0] with % and / and watch(\"digitSum\", ...)\n    }\n}\n",
            "irrigation",
            8, 5, "", 0, new int[0], new String[0], new int[] { 314 }
        ),
        new Objective(
            "count-the-digits",
            "Count the Digits",
            "while-loops",
            "A while loop repeats while a condition holds — perfect when you do not know the count up front. Read the code in farm.moisture()[0] and peel it apart: while the number is above 0, add its last digit (% 10) to a sum, drop that digit (/ 10), and count it. Watch the digit count and the digit sum.",
            "int n = 472;\nint count = 0;\nwhile (n > 0) {\n    count++;       // one more digit\n    n = n / 10;    // drop the last digit\n}",
            new String[] {
                "Read the code: int n = farm.moisture()[0];",
                "while (n > 0): digitSum += n % 10; n = n / 10; digitCount++;",
                "Watch digitCount and digitSum after the loop."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int n = farm.moisture()[0];\n        int digitCount = 0;\n        int digitSum = 0;\n        // TODO: while (n > 0) { add n % 10 to digitSum; n = n / 10; count it; }\n        // watch digitCount and digitSum\n    }\n}\n",
            "digit-counter",
            8, 5, "", 0, new int[0], new String[0], new int[] { 80435 }
        ),
        new Objective(
            "stock-the-stall",
            "Stock the Stall",
            "arrays",
            "Read parallel arrays from farm.crops() and farm.prices(). Use indexes to total the prices, count crops, and find the minimum and maximum price.",
            "int[] prices = farm.prices();\nString[] crops = farm.crops();\nfor (int i = 0; i < prices.length; i++) {\n    // prices[i] and crops[i] describe the same stall\n}",
            new String[] {
                "Use prices.length as the loop limit.",
                "Start min and max from prices[0], then compare every price.",
                "Watch total, minPrice, maxPrice, and count."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int[] prices = farm.prices();\n        String[] crops = farm.crops();\n        int total = 0;\n        int minPrice = prices[0];\n        int maxPrice = prices[0];\n        // loop over the arrays\n    }\n}\n",
            "market-stall",
            8, 5, "", 0,
            new int[] { 4, 7, 9, 10, 12, 13 },
            new String[] { "WHEAT", "CORN", "PUMPKIN", "CARROT", "WHEAT", "CORN" },
            new int[0]
        ),
        new Objective(
            "field-stats",
            "Field Stats",
            "arrays",
            "Read farm.prices() (this season's harvest scores). In one pass compute the total, the integer average (total / length), the maximum score, and the INDEX where that maximum sits.",
            "int[] a = farm.prices();\nint total = 0, max = a[0], maxIndex = 0;\nfor (int i = 0; i < a.length; i++) {\n    total += a[i];\n    if (a[i] > max) { max = a[i]; maxIndex = i; }\n}\nint average = total / a.length;",
            new String[] {
                "Read once: int[] scores = farm.prices();",
                "Accumulate total in the loop; average = total / scores.length (int division).",
                "Start max at scores[0]; when you find a bigger value, update max AND maxIndex. Watch total, average, max, maxIndex."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int[] scores = farm.prices();\n        int total = 0;\n        int max = scores[0];\n        int maxIndex = 0;\n        // TODO: loop — add to total, update max and maxIndex when a bigger score appears.\n        // average = total / scores.length. Watch total, average, max, maxIndex.\n    }\n}\n",
            "harvest-report",
            8, 5, "", 0,
            new int[] { 85, 92, 78, 90, 88 },
            new String[0], new int[0]
        ),
        new Objective(
            "threshold-count",
            "Threshold Count",
            "arrays",
            "Read farm.prices() (battery levels). Count how many are below 50 (they need charging), and total the levels of those at or above 50. Then flag whether everything is charged.",
            "int[] a = farm.prices();\nint low = 0, sum = 0;\nfor (int i = 0; i < a.length; i++) {\n    if (a[i] < 50) low++;\n    else sum += a[i];\n}\nboolean allCharged = low == 0;",
            new String[] {
                "Read once: int[] levels = farm.prices();",
                "In the loop: if (levels[i] < 50) needCharge++; else chargedTotal += levels[i];",
                "allCharged = needCharge == 0. Watch needCharge, chargedTotal, allCharged."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int[] levels = farm.prices();\n        int needCharge = 0;\n        int chargedTotal = 0;\n        // TODO: loop — count levels below 50, sum levels at or above 50.\n        // allCharged = needCharge == 0. Watch needCharge, chargedTotal, allCharged.\n    }\n}\n",
            "charge-monitor",
            8, 5, "", 0,
            new int[] { 30, 80, 45, 95, 60, 20 },
            new String[0], new int[0]
        ),
        new Objective(
            "improving-scores",
            "Improving Scores",
            "arrays",
            "Scores have 'improved' if each value is at least the one before it (never drops). Read farm.prices() and decide: did they improve? Compare each element to the one before it (scores[i] vs scores[i-1]). Then average the BACK HALF if they improved (indexes >= length/2), otherwise average the whole array.",
            "boolean improved = true;\nfor (int i = 1; i < a.length; i++) {\n    if (a[i] < a[i - 1]) improved = false;\n}",
            new String[] {
                "Start improved = true; loop i from 1: if (scores[i] < scores[i - 1]) improved = false.",
                "If improved, start averaging at scores.length / 2; otherwise start at 0.",
                "finalAverage = sum of that range / number of elements in it. Watch improved and finalAverage."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int[] scores = farm.prices();\n        boolean improved = true;\n        // TODO: loop from i = 1 — if scores[i] < scores[i - 1], improved = false.\n        // Then average the back half (indexes >= length/2) if improved, else the whole array.\n        // Watch improved and finalAverage.\n    }\n}\n",
            "improvement-tracker",
            8, 5, "", 0,
            new int[] { 20, 50, 50, 53, 80 },
            new String[0], new int[0]
        ),
        new Objective(
            "clamp-the-signal",
            "Clamp the Signal",
            "arrays",
            "Some array problems CHANGE the array in place. farm.signal() hands you a sound recording you can EDIT (writing signal[i] = x changes it for real). Pull every value into range: anything above 2000 becomes 2000, anything below -2000 becomes -2000. Count how many you changed.",
            "int[] a = farm.signal();   // editable!\nif (a[i] > 2000) { a[i] = 2000; changed++; }\nelse if (a[i] < -2000) { a[i] = -2000; changed++; }",
            new String[] {
                "Get the editable array: int[] signal = farm.signal();",
                "Loop every index. If signal[i] > 2000 set signal[i] = 2000; else if signal[i] < -2000 set signal[i] = -2000; count each change.",
                "Writing signal[i] = ... edits the array in place. Watch changed."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int[] signal = farm.signal();\n        int limit = 2000;\n        int changed = 0;\n        // TODO: loop — if signal[i] > limit set signal[i] = limit (count it);\n        // else if signal[i] < -limit set signal[i] = -limit (count it). Watch changed.\n    }\n}\n",
            "signal-limiter",
            8, 5, "", 0, new int[0], new String[0], new int[0]
        ),
        new Objective(
            "pass-the-tokens",
            "Pass the Tokens",
            "arrays",
            "Each tile passes its tokens one step to the right, and the last tile's tokens wrap around to the front (a rotation). Edit farm.signal() in place so {1, 2, 3, 4, 5} becomes {5, 1, 2, 3, 4}. Shifting elements is a key in-place array skill.",
            "int last = a[a.length - 1];\nfor (int i = a.length - 1; i > 0; i--) {\n    a[i] = a[i - 1];   // copy left neighbour right\n}\na[0] = last;            // wrap the last value to the front",
            new String[] {
                "Save the last value first: int last = tokens[tokens.length - 1];",
                "Loop i from the end down to 1: tokens[i] = tokens[i - 1] (shift right).",
                "Put last into tokens[0]. Watch first = tokens[0]."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int[] tokens = farm.signal();\n        // TODO: save the last value; shift every value one step right (loop from the end down to 1);\n        // then put the saved value into tokens[0]. Watch first = tokens[0].\n    }\n}\n",
            "token-conveyor",
            8, 5, "", 0, new int[0], new String[0], new int[0]
        ),
        new Objective(
            "write-a-helper",
            "Write a Helper",
            "static-methods",
            "Now you write your OWN method. Add a helper int packs(int crops) that returns how many full packs of 6 fit in crops (crops / 6). Call it on 20 and 45, and watch the two results.",
            "int doubleIt(int x) {\n    return x * 2;   // hand a value back\n}\n// ...\nint y = doubleIt(5);   // 10",
            new String[] {
                "Below run(), write: int packs(int crops) { return crops / 6; }",
                "Call it: int packsTwenty = packs(20);",
                "Watch packsTwenty and packsFortyFive."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int packsTwenty = packs(20);\n        int packsFortyFive = packs(45);\n        drone.watch(\"packsTwenty\", packsTwenty);\n        drone.watch(\"packsFortyFive\", packsFortyFive);\n    }\n\n    // TODO: return how many full packs of 6 fit in crops\n    int packs(int crops) {\n        return 0;\n    }\n}\n",
            "pack-helper",
            6, 4, "", 0, new int[0], new String[0], new int[0]
        ),
        new Objective(
            "boolean-helper",
            "Boolean Helper",
            "static-methods",
            "A method can hand back a true/false answer. Write boolean isRipe(int growth) that returns true when growth is at least 5. Use it to classify three tiles (growth 3, 5, and 8) and watch each result.",
            "boolean even(int n) {\n    return n % 2 == 0;\n}\n// ...\nboolean b = even(10);   // true",
            new String[] {
                "Write: boolean isRipe(int growth) { return growth >= 5; }",
                "Call it on 3, 5, and 8.",
                "Watch ripe3, ripe5, ripe8."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        drone.watch(\"ripe3\", isRipe(3));\n        drone.watch(\"ripe5\", isRipe(5));\n        drone.watch(\"ripe8\", isRipe(8));\n    }\n\n    // TODO: return true when growth is at least 5\n    boolean isRipe(int growth) {\n        return false;\n    }\n}\n",
            "ripeness-helper",
            6, 4, "", 0, new int[0], new String[0], new int[0]
        ),
        new Objective(
            "compose-helpers",
            "Compose Helpers",
            "static-methods",
            "Combine a method with a loop. Write int yield(int water) that returns water * 2 + 1. Call it for water levels 0 through 4 in a for loop, summing the yields. Watch the loop counter w and the running totalYield.",
            "int sq(int x) { return x * x; }\n// ...\nint s = 0;\nfor (int i = 1; i <= 3; i++) s += sq(i);   // 1 + 4 + 9 = 14",
            new String[] {
                "Write: int yield(int water) { return water * 2 + 1; }",
                "Loop w from 0 to 4: totalYield += yield(w); drone.watch(\"w\", w).",
                "Watch totalYield at the end."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int totalYield = 0;\n        // TODO: loop w from 0 to 4, add yield(w) to totalYield, watch(\"w\", w).\n        // Watch totalYield at the end.\n    }\n\n    // TODO: return water * 2 + 1\n    int yield(int water) {\n        return 0;\n    }\n}\n",
            "yield-engine",
            6, 4, "", 0, new int[0], new String[0], new int[0]
        ),
        new Objective(
            "find-the-crop",
            "Find the Crop",
            "sequential-search",
            "Search farm.crops() from left to right for PUMPKIN. Sequential search checks each element until it finds the target or reaches the end.",
            "int foundIndex = -1;\nfor (int i = 0; i < crops.length; i++) {\n    comparisons++;\n    if (crops[i].equals(\"PUMPKIN\")) {\n        foundIndex = i;\n        break;\n    }\n}",
            new String[] {
                "Use String.equals for crop names.",
                "Initialize foundIndex to -1 before the loop.",
                "Watch foundIndex and comparisons."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        String[] crops = farm.crops();\n        int foundIndex = -1;\n        int comparisons = 0;\n        // search for PUMPKIN\n    }\n}\n",
            "crop-locator",
            8, 5, "PUMPKIN", 0,
            new int[] { 5, 8, 13, 21, 34, 55 },
            new String[] { "WHEAT", "CORN", "PUMPKIN", "CARROT", "WHEAT", "CORN" },
            new int[0]
        ),
        new Objective(
            "fast-market",
            "Fast Market",
            "binary-search",
            "Use binary search on sorted prices. Track low, high, and mid so each comparison cuts the search range roughly in half.",
            "while (low <= high) {\n    int mid = (low + high) / 2;\n    if (prices[mid] == target) { foundIndex = mid; break; }\n    if (prices[mid] < target) low = mid + 1;\n    else high = mid - 1;\n}",
            new String[] {
                "The prices are sorted ascending.",
                "The target price is 21.",
                "A linear scan will use too many comparisons for this objective."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int[] prices = farm.prices();\n        int target = 21;\n        int low = 0;\n        int high = prices.length - 1;\n        int foundIndex = -1;\n        int comparisons = 0;\n        // binary search\n    }\n}\n",
            "fast-lookup",
            8, 5, "", 21,
            new int[] { 3, 5, 8, 13, 21, 34, 55 },
            new String[] { "WHEAT", "CORN", "PUMPKIN", "CARROT", "WHEAT", "CORN", "CARROT" },
            new int[0]
        ),
        new Objective(
            "tidy-the-stalls",
            "Tidy the Stalls",
            "bubble-sort",
            "Use bubble sort to repeatedly compare neighbors and swap them when they are out of order. This lighter core focuses on seeing adjacent swaps.",
            "for (int pass = 0; pass < prices.length - 1; pass++) {\n    for (int i = 0; i < prices.length - 1 - pass; i++) {\n        if (prices[i] > prices[i + 1]) { /* swap */ }\n    }\n}",
            new String[] {
                "Work on a copy of farm.prices(), not the farm array directly.",
                "Bubble sort compares neighboring indexes i and i + 1.",
                "Watch sortedPrices exactly as 3,5,7,12,19 and watch swaps."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int[] prices = farm.prices();\n        int swaps = 0;\n        // bubble sort ascending\n    }\n}\n",
            "sorted-market-view",
            8, 5, "", 0,
            new int[] { 12, 5, 19, 7, 3 },
            new String[] { "WHEAT", "CORN", "PUMPKIN", "CARROT", "WHEAT" },
            new int[0]
        ),
        new Objective(
            "pick-the-best",
            "Pick the Best",
            "selection-sort",
            "Use selection sort to choose the best remaining price and place it in the next ranked slot. This ranks crops by value without library sorting.",
            "for (int slot = 0; slot < prices.length - 1; slot++) {\n    int best = slot;\n    for (int i = slot + 1; i < prices.length; i++) {\n        if (prices[i] > prices[best]) best = i;\n    }\n    // swap slot with best\n}",
            new String[] {
                "Sort descending so the highest value is first.",
                "Swap crop names together with their prices.",
                "Watch rankedPrices exactly as 30,22,14,9,6 and bestCrop as CORN."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int[] prices = farm.prices();\n        String[] crops = farm.crops();\n        // selection sort descending, keeping arrays parallel\n    }\n}\n",
            "auto-prioritize",
            8, 5, "", 0,
            new int[] { 9, 30, 14, 22, 6 },
            new String[] { "WHEAT", "CORN", "PUMPKIN", "CARROT", "WHEAT" },
            new int[0]
        ),
        new Objective(
            "mastery-garden",
            "Mastery Garden",
            "recursion-puzzles",
            "All eight core concepts are mastered. Use a small recursive helper to solve the first open-ended puzzle: sum 1 through 10.",
            "int sumTo(int n) {\n    if (n == 0) return 0;\n    return n + sumTo(n - 1);\n}",
            new String[] {
                "A recursive method needs a base case.",
                "sumTo(10) should return 55.",
                "Watch recursiveSum so the inspector can show your answer."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int result = sumTo(10);\n        drone.watch(\"recursiveSum\", result);\n    }\n\n    int sumTo(int n) {\n        return 0;\n    }\n}\n",
            "recursion-puzzles",
            10, 6, "", 0, new int[0], new String[0], new int[0]
        ),
        new Objective(
            "recursive-factorial",
            "Recursive Factorial",
            "recursion-puzzles",
            "Recursion: a method that calls itself on a smaller problem. Write factorial(n): factorial(0) and factorial(1) are 1; otherwise n * factorial(n - 1). Compute factorial(5) = 120 and watch the result.",
            "int factorial(int n) {\n    if (n <= 1) return 1;        // base case\n    return n * factorial(n - 1); // smaller subproblem\n}",
            new String[] {
                "Base case first: if (n <= 1) return 1.",
                "Recursive step: return n * factorial(n - 1).",
                "Call factorial(5) and watch(\"result\", ...). It should be 120."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int result = factorial(5);\n        drone.watch(\"result\", result);\n    }\n\n    int factorial(int n) {\n        // TODO: base case (n <= 1) returns 1; otherwise n * factorial(n - 1)\n        return 0;\n    }\n}\n",
            "factorial-engine",
            10, 6, "", 0, new int[0], new String[0], new int[0]
        ),
        new Objective(
            "recursive-power",
            "Recursive Power",
            "recursion-puzzles",
            "Another recursion: raise a number to a power. power(base, 0) is 1; otherwise base * power(base, exp - 1). Compute power(2, 6) = 64 and watch the result.",
            "int power(int base, int exp) {\n    if (exp == 0) return 1;            // base case\n    return base * power(base, exp - 1); // multiply one more time\n}",
            new String[] {
                "Base case: if (exp == 0) return 1.",
                "Recursive step: return base * power(base, exp - 1).",
                "Call power(2, 6) and watch(\"result\", ...). It should be 64."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int result = power(2, 6);\n        drone.watch(\"result\", result);\n    }\n\n    int power(int base, int exp) {\n        // TODO: base case (exp == 0) returns 1; otherwise base * power(base, exp - 1)\n        return 0;\n    }\n}\n",
            "power-engine",
            10, 6, "", 0, new int[0], new String[0], new int[0]
        ),
        new Objective(
            "grid-totals",
            "Grid Totals",
            "2d-arrays",
            "A 2D array is a grid: farm.grid() gives you int[][] you read with grid[row][col]. Use nested loops (rows then columns) to add every cell into a total and track the largest. grid.length is the number of rows; grid[r].length the columns.",
            "int[][] g = farm.grid();\nfor (int r = 0; r < g.length; r++) {\n    for (int c = 0; c < g[r].length; c++) {\n        sum += g[r][c];\n    }\n}",
            new String[] {
                "Read it: int[][] g = farm.grid();",
                "Outer loop r over g.length (rows), inner loop c over g[r].length (columns).",
                "Add g[r][c] to gridSum; track gridMax (start at g[0][0]). Watch gridSum and gridMax."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        int[][] g = farm.grid();\n        int gridSum = 0;\n        int gridMax = g[0][0];\n        // TODO: nested loops over g[r][c] — add to gridSum, update gridMax.\n        // Watch gridSum and gridMax.\n    }\n}\n",
            "grid-reader",
            10, 6, "", 0, new int[0], new String[0], new int[0]
        ),
        new Objective(
            "name-scan",
            "Scan the Names",
            "string-methods",
            "Strings are text you scan character by character. Read the crop names with farm.crops() (a String[]). Count how many names CONTAIN the letter 'R' (check each charAt), and total the lengths of all names with .length().",
            "String[] names = farm.crops();\nfor (int i = 0; i < names.length; i++) {\n    for (int j = 0; j < names[i].length(); j++) {\n        if (names[i].charAt(j) == 'R') { /* found */ }\n    }\n}",
            new String[] {
                "Outer loop over names; add names[i].length() to totalLetters.",
                "Inner loop over characters: if (names[i].charAt(j) == 'R') mark this name.",
                "Count names that contain 'R' into withR. Watch withR and totalLetters."
            },
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        String[] names = farm.crops();\n        int withR = 0;\n        int totalLetters = 0;\n        // TODO: for each name — add its length to totalLetters; if any char is 'R', withR++.\n        // Watch withR and totalLetters.\n    }\n}\n",
            "name-scanner",
            10, 6, "", 0, new int[0],
            new String[] { "WHEAT", "CORN", "PUMPKIN", "CARROT" },
            new int[0]
        )
    };

    public static Objective first() {
        return ALL[0];
    }

    public static Objective byId(String id) {
        if (id != null) {
            for (int i = 0; i < ALL.length; i++) {
                if (ALL[i].id.equals(id)) return ALL[i];
            }
        }
        return first();
    }

    public static boolean hasId(String id) {
        if (id == null) return false;
        for (int i = 0; i < ALL.length; i++) {
            if (ALL[i].id.equals(id)) return true;
        }
        return false;
    }

    public static Objective byConcept(String concept) {
        if (concept != null) {
            for (int i = 0; i < ALL.length; i++) {
                if (ALL[i].concept.equals(concept)) return ALL[i];
            }
        }
        return first();
    }

    public static boolean hasUnlock(String unlock) {
        if (unlock == null || unlock.length() == 0) return false;
        for (int i = 0; i < ALL.length; i++) {
            if (ALL[i].unlock.equals(unlock)) return true;
        }
        return false;
    }

    public static Objective nextAfter(String id, Progress progress) {
        int index = 0;
        for (int i = 0; i < ALL.length; i++) {
            if (ALL[i].id.equals(id)) {
                index = i;
                break;
            }
        }
        if (index >= ALL.length - 1) return ALL[ALL.length - 1];
        Objective next = ALL[index + 1];
        if ("mastery-garden".equals(next.id) && !progress.allCoreMastered()) {
            return ALL[index];
        }
        return next;
    }

    public static String catalogJson() {
        StringBuilder sb = new StringBuilder("{\"objectives\":[");
        for (int i = 0; i < ALL.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(ALL[i].metadataJson());
        }
        sb.append("],\"conceptOrder\":").append(Json.stringArray(Progress.CORE_CONCEPTS)).append("}");
        return sb.toString();
    }
}
