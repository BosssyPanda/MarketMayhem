/**
 * One curriculum objective. Objectives are data-first: the registry owns the
 * lesson, starter, data arrays, unlock, and concept tag; check logic is kept in
 * one switch so adding a new objective remains a single registry edit.
 */
public class Objective {
    public final String id;
    public final String title;
    public final String concept;
    public final String lesson;
    public final String workedExample;
    public final String[] hints;
    public final String starter;
    public final String unlock;
    public final int farmWidth;
    public final int farmHeight;
    public final String targetCrop;
    public final int targetPrice;
    public final int[] prices;
    public final String[] crops;
    public final int[] moisture;

    public Objective(String id, String title, String concept, String lesson, String workedExample,
                     String[] hints, String starter, String unlock, int farmWidth, int farmHeight,
                     String targetCrop, int targetPrice, int[] prices, String[] crops, int[] moisture) {
        this.id = id;
        this.title = title;
        this.concept = concept;
        this.lesson = lesson;
        this.workedExample = workedExample;
        this.hints = hints;
        this.starter = starter;
        this.unlock = unlock;
        this.farmWidth = farmWidth;
        this.farmHeight = farmHeight;
        this.targetCrop = targetCrop;
        this.targetPrice = targetPrice;
        this.prices = prices;
        this.crops = crops;
        this.moisture = moisture;
    }

    public void prepare(Farm farm) {
        farm.setData(prices, crops, moisture);
        // Always-harvestable field: cover every tile with ripe wheat so harvest
        // code always has something to collect on any objective. Each objective
        // below then clears/seeds only the tiles it needs (plant rows go empty).
        for (int y = 0; y < farm.height(); y++) {
            for (int x = 0; x < farm.width(); x++) {
                farm.setTileInternal(x, y, Crop.WHEAT, farm.tick() - Crop.WHEAT.growTicks(), 0);
            }
        }
        if ("first-sprout".equals(id)) {
            for (int x = 1; x <= 3 && x < farm.width(); x++) {
                farm.setTileInternal(x, 0, Crop.NONE, -1, 0);
            }
        }
        if ("the-long-rows".equals(id)) {
            for (int x = 0; x < farm.width(); x++) {
                farm.setTileInternal(x, 0, Crop.NONE, -1, 0);
            }
        }
        if ("harvest-til-done".equals(id) && farm.resourceCount(Crop.WHEAT) == 0) {
            for (int x = 0; x < 4 && x < farm.width(); x++) {
                if (farm.cropAt(x, 1) == Crop.NONE) {
                    farm.setTileInternal(x, 1, Crop.WHEAT, farm.tick() - Crop.WHEAT.growTicks(), 0);
                }
            }
        }
        if ("clamp-the-signal".equals(id)) {
            farm.setSignal(new int[] { 40, 2532, 17, -2300, -17, -4000, 2000, 1048, -420, 33, 15, -32, 2030, 3223 });
        }
        if ("pass-the-tokens".equals(id)) {
            farm.setSignal(new int[] { 1, 2, 3, 4, 5 });
        }
        if ("grid-totals".equals(id)) {
            farm.setGrid(new int[][] { { 3, 8, 2 }, { 5, 1, 9 }, { 4, 7, 6 } });
        }
    }

    public ObjectiveResult evaluate(Farm farm, Drone drone) {
        ObjectiveResult result = new ObjectiveResult();
        if ("first-sprout".equals(id)) {
            result.add("three-method-actions", "Call the drone methods to plant three target tiles", planted(farm, 1, 0) && planted(farm, 2, 0) && planted(farm, 3, 0));
            result.add("method-sequence", "Use at least three moves and three plant actions", drone.moveCount() >= 3 && drone.plantCount() >= 3);
        } else if ("the-long-rows".equals(id)) {
            int planted = 0;
            for (int x = 0; x < farm.width(); x++) if (planted(farm, x, 0)) planted++;
            result.add("row-planted", "Plant every tile in row 0 (" + planted + "/" + farm.width() + ")", planted == farm.width());
            result.add("loop-counter-watch", "Watch a loop counter named tiles with the row width", drone.watchInt("tiles", -1) >= farm.width());
        } else if ("stock-the-stall".equals(id)) {
            result.add("array-data-read", "Read both farm.prices() and farm.crops()", farm.pricesReadCount() > 0 && farm.cropsReadCount() > 0);
            result.add("array-total", "Use the prices array to watch total = 55", drone.watchInt("total", -1) == 55);
            result.add("array-min-max", "Watch minPrice = 4 and maxPrice = 13", drone.watchInt("minPrice", -1) == 4 && drone.watchInt("maxPrice", -1) == 13);
            result.add("parallel-count", "Watch count = 6 from the parallel crop array", drone.watchInt("count", -1) == 6);
        } else if ("harvest-til-done".equals(id)) {
            result.add("while-harvest", "Harvest four ripe wheat tiles", farm.resourceCount(Crop.WHEAT) >= 4);
            result.add("digit-decoder", "Decode irrigation code 314 and watch digitSum = 8", farm.moistureReadCount() > 0 && drone.watchInt("digitSum", -1) == 8);
        } else if ("find-the-crop".equals(id)) {
            result.add("sequential-probe", "Read crops and probe indexes 0, 1, then 2", farm.cropsReadCount() > 0 && drone.watchHistoryIntContainsSequence("i", new int[] { 0, 1, 2 }));
            result.add("sequential-index", "Sequentially find PUMPKIN at index 2", drone.watchInt("foundIndex", -1) == 2);
            result.add("comparison-count", "Watch exactly 3 comparisons for the left-to-right search", drone.watchInt("comparisons", 999) == 3);
        } else if ("fast-market".equals(id)) {
            result.add("binary-probe", "Read prices and watch mid indexes 3, 5, then 4", farm.pricesReadCount() > 0 && drone.watchHistoryIntContainsSequence("mid", new int[] { 3, 5, 4 }));
            result.add("binary-index", "Binary search sorted prices to find 21 at index 4", drone.watchInt("foundIndex", -1) == 4);
            result.add("binary-budget", "Use low/high/mid with exactly 3 comparisons", drone.watchInt("comparisons", 999) == 3);
        } else if ("tidy-the-stalls".equals(id)) {
            result.add("bubble-comparisons", "Read prices and compare adjacent stalls through the bubble passes", farm.pricesReadCount() > 0 && drone.watchCount("i") >= 10);
            result.add("bubble-sorted", "Bubble sort prices ascending and watch sortedPrices", "3,5,7,12,19".equals(drone.watchText("sortedPrices")));
            result.add("bubble-swaps", "Watch at least one swap", drone.watchInt("swaps", 0) > 0);
        } else if ("pick-the-best".equals(id)) {
            result.add("selection-comparisons", "Read prices/crops and scan candidates for each ranked slot", farm.pricesReadCount() > 0 && farm.cropsReadCount() > 0 && drone.watchCount("i") >= 10);
            result.add("selection-sorted", "Selection sort prices descending and watch rankedPrices", "30,22,14,9,6".equals(drone.watchText("rankedPrices")));
            result.add("best-crop", "Watch bestCrop = CORN", "CORN".equals(drone.watchText("bestCrop")));
        } else if ("mastery-garden".equals(id)) {
            result.add("recursive-sum", "Use recursion to watch recursiveSum = 55", drone.watchInt("recursiveSum", -1) == 55);
        } else if ("recursive-factorial".equals(id)) {
            result.add("factorial-result", "Use recursion to watch result = 120 (factorial of 5)", drone.watchInt("result", -1) == 120);
        } else if ("recursive-power".equals(id)) {
            result.add("power-result", "Use recursion to watch result = 64 (2 to the power 6)", drone.watchInt("result", -1) == 64);
        } else if ("grid-totals".equals(id)) {
            result.add("grid-read", "Read the grid from farm.grid()", farm.gridReadCount() > 0);
            result.add("grid-sum", "Watch gridSum = 45 (every cell added)", drone.watchInt("gridSum", -1) == 45);
            result.add("grid-max", "Watch gridMax = 9 (largest cell)", drone.watchInt("gridMax", -1) == 9);
        } else if ("name-scan".equals(id)) {
            result.add("name-read", "Read the crop names from farm.crops()", farm.cropsReadCount() > 0);
            result.add("name-withR", "Watch withR = 2 (names containing 'R': CORN, CARROT)", drone.watchInt("withR", -1) == 2);
            result.add("name-letters", "Watch totalLetters = 22 (5 + 4 + 7 + 6)", drone.watchInt("totalLetters", -1) == 22);
        } else if ("store-the-reading".equals(id)) {
            result.add("vars-total", "Watch total = 20 (12 + 8)", drone.watchInt("total", -1) == 20);
            result.add("vars-gap", "Watch gap = 4 (12 - 8)", drone.watchInt("gap", -1) == 4);
            result.add("vars-doubled", "Watch doubled = 40 (total * 2)", drone.watchInt("doubled", -1) == 40);
        } else if ("split-the-harvest".equals(id)) {
            result.add("split-declared", "Watch crops = 18", drone.watchInt("crops", -1) == 18);
            result.add("split-int-div", "Watch fullBaskets = 4 using int division (18 / 4)", drone.watchInt("fullBaskets", -1) == 4);
            result.add("split-double-div", "Watch exact = 4.5 using double division (18.0 / 4)", "4.5".equals(drone.watchText("exact")));
        } else if ("valve-check".equals(id)) {
            result.add("valve-remainder", "Watch remainder = 2 (17 % 5)", drone.watchInt("remainder", -1) == 2);
            result.add("valve-cycles", "Watch cycles = 3 (17 / 5)", drone.watchInt("cycles", -1) == 3);
            result.add("valve-even", "Watch even = false (17 % 2 == 0)", "false".equals(drone.watchText("even")));
        } else if ("decode-the-code".equals(id)) {
            result.add("decode-read", "Read the code from farm.moisture()", farm.moistureReadCount() > 0);
            result.add("decode-ones", "Watch ones = 8 (code % 10)", drone.watchInt("ones", -1) == 8);
            result.add("decode-tens", "Watch tens = 3 ((code / 10) % 10)", drone.watchInt("tens", -1) == 3);
            result.add("decode-thousands", "Watch thousands = 5 (code / 1000)", drone.watchInt("thousands", -1) == 5);
        } else if ("ripeness-check".equals(id)) {
            result.add("ripe-read", "Read the scan from farm.moisture()", farm.moistureReadCount() > 0);
            result.add("ripe-dry", "Watch dryEnough = true (moisture < 50)", "true".equals(drone.watchText("dryEnough")));
            result.add("ripe-mature", "Watch mature = true (growth >= 5)", "true".equals(drone.watchText("mature")));
            result.add("ripe-ready", "Watch ready = true (dryEnough && mature)", "true".equals(drone.watchText("ready")));
        } else if ("threshold-flag".equals(id)) {
            result.add("threshold-read", "Read moisture and temperature from farm.moisture()", farm.moistureReadCount() > 0);
            result.add("threshold-needs", "Watch needsWater = true (moisture < 30 || temp > 35)", "true".equals(drone.watchText("needsWater")));
            result.add("threshold-range", "Watch inRange = false (moisture between 30 and 60)", "false".equals(drone.watchText("inRange")));
            result.add("threshold-nothot", "Watch notHot = false (!(temp > 35))", "false".equals(drone.watchText("notHot")));
        } else if ("classify-moisture".equals(id)) {
            result.add("classify-read", "Read the readings from farm.moisture()", farm.moistureReadCount() > 0);
            result.add("classify-ok", "Watch status0 = OK (reading 55)", "OK".equals(drone.watchText("status0")));
            result.add("classify-dry", "Watch status1 = DRY (reading 18)", "DRY".equals(drone.watchText("status1")));
            result.add("classify-wet", "Watch status2 = WET (reading 90)", "WET".equals(drone.watchText("status2")));
        } else if ("field-grader".equals(id)) {
            result.add("grader-read", "Read the score from farm.moisture()", farm.moistureReadCount() > 0);
            result.add("grader-grade", "Watch grade = B (score 85)", "B".equals(drone.watchText("grade")));
            result.add("grader-action", "Watch action = HARVEST (grade A or B)", "HARVEST".equals(drone.watchText("action")));
        } else if ("sum-the-row".equals(id)) {
            result.add("sum-loop", "Loop the index i across every reading (0..4)", drone.watchHistoryIntContainsSequence("i", new int[] { 0, 1, 2, 3, 4 }));
            result.add("sum-read", "Read the sensors from farm.moisture()", farm.moistureReadCount() > 0);
            result.add("sum-total", "Watch total = 27 (4 + 7 + 2 + 9 + 5)", drone.watchInt("total", -1) == 27);
            result.add("sum-above", "Watch aboveFive = 2 (readings 7 and 9)", drone.watchInt("aboveFive", -1) == 2);
        } else if ("sweep-the-field".equals(id)) {
            int allCells = farm.width() * farm.height();
            result.add("sweep-cells", "Visit every cell: cells = width x height (" + allCells + ")", drone.watchInt("cells", -1) == allCells);
            result.add("sweep-outer", "Run the outer row loop (watch y go 0, 1, 2, ...)", drone.watchHistoryIntContainsSequence("y", new int[] { 0, 1, 2 }));
            result.add("sweep-inner", "Run the inner column loop for every cell (watch x each time)", drone.watchCount("x") >= allCells);
        } else if ("field-pattern".equals(id)) {
            int rows = farm.height();
            int triangle = rows * (rows + 1) / 2;
            result.add("pattern-total", "Watch seedlings = " + triangle + " (1 + 2 + ... + " + rows + ")", drone.watchInt("seedlings", -1) == triangle);
            result.add("pattern-nested", "Plant each seedling in a nested loop (watch seed every time)", drone.watchCount("seed") >= triangle);
        } else if ("count-the-digits".equals(id)) {
            result.add("digits-read", "Read the code from farm.moisture()", farm.moistureReadCount() > 0);
            result.add("digits-count", "Watch digitCount = 5 (80435 has 5 digits)", drone.watchInt("digitCount", -1) == 5);
            result.add("digits-sum", "Watch digitSum = 20 (8 + 0 + 4 + 3 + 5)", drone.watchInt("digitSum", -1) == 20);
        } else if ("field-stats".equals(id)) {
            result.add("stats-read", "Read the scores from farm.prices()", farm.pricesReadCount() > 0);
            result.add("stats-total", "Watch total = 433", drone.watchInt("total", -1) == 433);
            result.add("stats-average", "Watch average = 86 (433 / 5, int division)", drone.watchInt("average", -1) == 86);
            result.add("stats-max", "Watch max = 92", drone.watchInt("max", -1) == 92);
            result.add("stats-maxindex", "Watch maxIndex = 1 (where 92 sits)", drone.watchInt("maxIndex", -1) == 1);
        } else if ("threshold-count".equals(id)) {
            result.add("thresh-read", "Read the levels from farm.prices()", farm.pricesReadCount() > 0);
            result.add("thresh-count", "Watch needCharge = 3 (levels below 50)", drone.watchInt("needCharge", -1) == 3);
            result.add("thresh-sum", "Watch chargedTotal = 235 (sum of levels >= 50)", drone.watchInt("chargedTotal", -1) == 235);
            result.add("thresh-flag", "Watch allCharged = false", "false".equals(drone.watchText("allCharged")));
        } else if ("improving-scores".equals(id)) {
            result.add("improving-read", "Read the scores from farm.prices()", farm.pricesReadCount() > 0);
            result.add("improving-flag", "Watch improved = true (each score >= the previous)", "true".equals(drone.watchText("improved")));
            result.add("improving-average", "Watch finalAverage = 61 (back half: (50 + 53 + 80) / 3)", drone.watchInt("finalAverage", -1) == 61);
        } else if ("clamp-the-signal".equals(id)) {
            int[] sig = farm.signalArray();
            boolean inRange = true;
            for (int i = 0; i < sig.length; i++) {
                if (sig[i] > 2000 || sig[i] < -2000) inRange = false;
            }
            result.add("clamp-changed", "Watch changed = 5 (values pulled into range)", drone.watchInt("changed", -1) == 5);
            result.add("clamp-applied", "Edit the array in place: 2532 -> 2000 and -2300 -> -2000", sig.length >= 4 && sig[1] == 2000 && sig[3] == -2000);
            result.add("clamp-in-range", "Every value now sits within [-2000, 2000]", inRange);
        } else if ("pass-the-tokens".equals(id)) {
            int[] sig = farm.signalArray();
            boolean shifted = sig.length == 5 && sig[0] == 5 && sig[1] == 1 && sig[2] == 2 && sig[3] == 3 && sig[4] == 4;
            result.add("tokens-wrapped", "The last value wraps to the front (signal[0] = 5)", sig.length >= 1 && sig[0] == 5);
            result.add("tokens-shifted", "Every value moves one step right in place: 5, 1, 2, 3, 4", shifted);
        } else if ("write-a-helper".equals(id)) {
            result.add("helper-twenty", "Watch packsTwenty = 3 (packs(20) = 20 / 6)", drone.watchInt("packsTwenty", -1) == 3);
            result.add("helper-fortyfive", "Watch packsFortyFive = 7 (packs(45) = 45 / 6)", drone.watchInt("packsFortyFive", -1) == 7);
        } else if ("boolean-helper".equals(id)) {
            result.add("bool-three", "Watch ripe3 = false (isRipe(3))", "false".equals(drone.watchText("ripe3")));
            result.add("bool-five", "Watch ripe5 = true (isRipe(5))", "true".equals(drone.watchText("ripe5")));
            result.add("bool-eight", "Watch ripe8 = true (isRipe(8))", "true".equals(drone.watchText("ripe8")));
        } else if ("compose-helpers".equals(id)) {
            result.add("compose-loop", "Call yield(w) for w = 0..4 in a for loop", drone.watchHistoryIntContainsSequence("w", new int[] { 0, 1, 2, 3, 4 }));
            result.add("compose-total", "Watch totalYield = 25 (1 + 3 + 5 + 7 + 9)", drone.watchInt("totalYield", -1) == 25);
        }
        return result;
    }

    private boolean planted(Farm farm, int x, int y) {
        return farm.isInside(x, y) && farm.cropAt(x, y) != Crop.NONE;
    }

    public String metadataJson() {
        return "{"
            + "\"id\":" + Json.str(id)
            + ",\"title\":" + Json.str(title)
            + ",\"concept\":" + Json.str(concept)
            + ",\"lesson\":" + Json.str(lesson)
            + ",\"workedExample\":" + Json.str(workedExample)
            + ",\"hints\":" + Json.stringArray(hints)
            + ",\"starter\":" + Json.str(starter)
            + ",\"unlock\":" + Json.str(unlock)
            + ",\"farmWidth\":" + farmWidth
            + ",\"farmHeight\":" + farmHeight
            + ",\"targetCrop\":" + Json.str(targetCrop)
            + ",\"targetPrice\":" + targetPrice
            + ",\"prices\":" + Json.intArray(prices)
            + ",\"crops\":" + Json.stringArray(crops)
            + ",\"moisture\":" + Json.intArray(moisture)
            + "}";
    }

    public static class ObjectiveResult {
        private final StringBuilder checks = new StringBuilder("[");
        private boolean first = true;
        public boolean passed = true;

        public void add(String id, String label, boolean ok) {
            if (!first) checks.append(",");
            first = false;
            checks.append("{\"id\":").append(Json.str(id))
                .append(",\"label\":").append(Json.str(label))
                .append(",\"passed\":").append(ok)
                .append("}");
            if (!ok) passed = false;
        }

        public String checksJson() {
            return checks.toString() + "]";
        }
    }
}
