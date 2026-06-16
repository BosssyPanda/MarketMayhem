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
            "public class Strategy {\n    public void run(Drone drone, Farm farm) {\n        // move to row 1, harvest across it, then decode farm.moisture()[0]\n    }\n}\n",
            "irrigation",
            8, 5, "", 0, new int[0], new String[0], new int[] { 314 }
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
