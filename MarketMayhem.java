import java.util.Scanner;

/**
 * Market Mayhem: Java Trading Academy
 *
 * A complete, playable terminal stock-trading game. The student learns Java by
 * PLAYING the game, not by editing source files. Reading never awards XP; only
 * correct answers to active challenges award Java XP and unlock trading tools.
 *
 * Build:  javac MarketMayhem.java
 * Run:    java MarketMayhem
 *
 * Beginner Java only: arrays, for/while loops, static methods, Scanner,
 * Math.random, if/else, String methods, manual sequential search, manual
 * binary search. One Scanner, nextLine() everywhere, integers parsed by hand.
 */
public class MarketMayhem {

    // ===== Core market data (parallel arrays) =====
    static String[] tickers;
    static int[] stockIds;
    static int[] prices;
    static int[] previousPrices;
    static int[] sharesOwned;
    static int[] riskLevels;

    // ===== Game state =====
    static int day = 1;
    static final int MAX_DAYS = 15;
    static final int MIN_STOCK_PRICE = 1;
    static final int STARTING_CASH = 1000;
    static final int WIN_NET_WORTH = 1500;
    static final int LEGENDARY_NET_WORTH = 2200;
    static final int BANKRUPT_NET_WORTH = 200;
    static int cash;
    static boolean gameOver = false;
    static String gameOverReason = "";

    // ===== Learning state =====
    static boolean learningMode = true;
    static int javaXp = 0;
    static int questionsAnswered = 0;
    static int questionsCorrect = 0;

    static String[] topicNames;
    static int[] topicCorrect;
    static int[] topicAttempts;
    static boolean[] topicMastered;
    static boolean[] abilityUnlocked;

    static boolean javaTradingLicenseUnlocked = false;
    static int mixedBossAttempts = 0;
    static int mixedBossBestScore = 0;

    // ===== Topic constants =====
    static final int TOPIC_FOR_LOOPS = 0;
    static final int TOPIC_WHILE_LOOPS = 1;
    static final int TOPIC_ARRAYS = 2;
    static final int TOPIC_METHODS = 3;
    static final int TOPIC_SEQUENTIAL_SEARCH = 4;
    static final int TOPIC_BINARY_SEARCH = 5;

    // ===== Ability constants (index aligned with topics) =====
    static final int ABILITY_MARKET_SCANNER = TOPIC_FOR_LOOPS;
    static final int ABILITY_SIGNAL_DECODER = TOPIC_WHILE_LOOPS;
    static final int ABILITY_INDEX_VISION = TOPIC_ARRAYS;
    static final int ABILITY_TRADE_CALCULATOR = TOPIC_METHODS;
    static final int ABILITY_TICKER_FINDER = TOPIC_SEQUENTIAL_SEARCH;
    static final int ABILITY_FAST_BROKER = TOPIC_BINARY_SEARCH;

    // ===== Input sentinels =====
    static final int PARSE_INVALID = Integer.MIN_VALUE;
    static final int INPUT_CANCEL = Integer.MIN_VALUE;

    // ============================================================
    // Entry point and main loop
    // ============================================================
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);

        printWelcome();
        initializeMarket();
        initializePlayer();
        initializeLearningSystem();

        boolean running = true;
        while (running && !gameOver) {
            printMenu();
            int choice = getMenuChoice(input);
            running = processMenuChoice(choice, input);
            if (running && !gameOver) {
                pauseBriefly();
            }
        }

        input.close();
        if (!gameOver) {
            System.out.println("Goodbye from Market Mayhem. Keep practicing your Java!");
        }
    }

    public static void printWelcome() {
        System.out.println("=====================================");
        System.out.println("MARKET MAYHEM: JAVA TRADING ACADEMY");
        System.out.println("=====================================");
        System.out.println("You learn Java by PLAYING this terminal game.");
        System.out.println("Correct answers earn Java XP and unlock trading tools.");
        System.out.println("Reading alone never awards XP.");
        System.out.println("Reach $" + WIN_NET_WORTH + " net worth by Day " + MAX_DAYS + " to win.");
        System.out.println("$" + LEGENDARY_NET_WORTH + " earns a legendary rating.");
        System.out.println("Falling to $" + BANKRUPT_NET_WORTH + " net worth or below ends the game early.");
        System.out.println();
    }

    public static void initializeMarket() {
        tickers = new String[] {"APEX", "NOVA", "BYTE", "IRON", "FUEL", "VRTX", "ZETA", "OMNI"};
        stockIds = new int[] {101, 102, 103, 104, 105, 106, 107, 108};
        prices = new int[] {45, 80, 62, 38, 55, 97, 24, 70};
        previousPrices = new int[prices.length];
        for (int i = 0; i < prices.length; i++) {
            previousPrices[i] = prices[i];
        }
        sharesOwned = new int[prices.length];
        riskLevels = new int[] {4, 6, 5, 7, 8, 9, 3, 5};
    }

    public static void initializePlayer() {
        cash = STARTING_CASH;
        day = 1;
        gameOver = false;
        gameOverReason = "";
    }

    public static void initializeLearningSystem() {
        topicNames = new String[] {
            "For Loops",
            "While Loops",
            "Arrays",
            "Methods",
            "Sequential Search",
            "Binary Search"
        };
        topicCorrect = new int[topicNames.length];
        topicAttempts = new int[topicNames.length];
        topicMastered = new boolean[topicNames.length];
        abilityUnlocked = new boolean[topicNames.length];
    }

    // ============================================================
    // Main menu
    // ============================================================
    public static void printMenu() {
        System.out.println("=====================================");
        System.out.println("MARKET MAYHEM: JAVA TRADING ACADEMY");
        System.out.println("=====================================");
        System.out.println("Day: " + day + " / " + MAX_DAYS);
        System.out.println("Cash: $" + cash);
        System.out.println("Portfolio Value: $" + getPortfolioValue());
        System.out.println("Net Worth: $" + getNetWorth());
        System.out.println("Java XP: " + javaXp);
        System.out.println("Questions Correct / Answered: " + questionsCorrect + " / " + questionsAnswered);
        System.out.println("Learning Mode: " + getLearningModeText());
        System.out.println("Java Trading License: " + getLicenseStatusText());
        System.out.println();
        System.out.println("0. Exit");
        System.out.println("1. View Market");
        System.out.println("2. Advance Day");
        System.out.println("3. View Portfolio");
        System.out.println("4. Buy Stock");
        System.out.println("5. Sell Stock");
        System.out.println("6. Java Trading Academy");
        System.out.println("7. Mastery Report");
        System.out.println("8. Toggle Learning Mode");
        System.out.println("99. Run Developer Tests");
        System.out.println();
        System.out.print("Choose an option: ");
    }

    public static int getMenuChoice(Scanner input) {
        String line = readLine(input);
        if (line == null) {
            return 0; // End of input is treated as a clean exit.
        }
        return parseIntManually(line);
    }

    public static boolean processMenuChoice(int choice, Scanner input) {
        if (choice == 0) {
            return false;
        } else if (choice == 1) {
            printMarket();
        } else if (choice == 2) {
            advanceDay();
        } else if (choice == 3) {
            printPortfolio();
        } else if (choice == 4) {
            buyStock(input);
        } else if (choice == 5) {
            sellStock(input);
        } else if (choice == 6) {
            runJavaTradingAcademy(input);
        } else if (choice == 7) {
            printMasteryReport();
        } else if (choice == 8) {
            toggleLearningMode();
        } else if (choice == 99) {
            runDeveloperTests();
        } else {
            System.out.println("Invalid option. Please choose a listed menu option.");
        }
        return true;
    }

    public static void toggleLearningMode() {
        learningMode = !learningMode;
        System.out.println("Learning Mode is now " + getLearningModeText() + ".");
    }

    public static String getLearningModeText() {
        if (learningMode) {
            return "ON";
        }
        return "OFF";
    }

    public static String getLicenseStatusText() {
        if (javaTradingLicenseUnlocked) {
            return "UNLOCKED";
        }
        return "LOCKED";
    }

    public static void pauseBriefly() {
        // Intentionally reads no input so piped smoke tests stay in sync.
        System.out.println();
    }

    // ============================================================
    // Input helpers (nextLine only, integers parsed by hand)
    // ============================================================
    public static String readLine(Scanner input) {
        if (input.hasNextLine()) {
            return input.nextLine();
        }
        return null; // End of input.
    }

    public static int parseIntManually(String text) {
        if (text == null) {
            return PARSE_INVALID;
        }
        String s = text.trim();
        if (s.length() == 0) {
            return PARSE_INVALID;
        }
        int start = 0;
        boolean negative = false;
        if (s.charAt(0) == '-') {
            negative = true;
            start = 1;
            if (s.length() == 1) {
                return PARSE_INVALID;
            }
        }
        int value = 0;
        for (int i = start; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c < '0' || c > '9') {
                return PARSE_INVALID;
            }
            value = value * 10 + (c - '0');
        }
        if (negative) {
            value = -value;
        }
        return value;
    }

    public static int readIntInRange(Scanner input, String prompt, int min, int max) {
        while (true) {
            System.out.print(prompt);
            String line = readLine(input);
            if (line == null) {
                return INPUT_CANCEL; // End of input cancels the action.
            }
            int value = parseIntManually(line);
            if (value == PARSE_INVALID) {
                System.out.println("Please enter a whole number.");
            } else if (value < min || value > max) {
                System.out.println("Please enter a number between " + min + " and " + max + ".");
            } else {
                return value;
            }
        }
    }

    public static String normalizeAnswer(String answer) {
        if (answer == null) {
            return "";
        }
        return answer.trim().toUpperCase();
    }

    // ============================================================
    // Reusable teaching engine
    // ============================================================
    public static boolean askMultipleChoice(
            Scanner input,
            int topicIndex,
            String question,
            String optionA,
            String optionB,
            String optionC,
            String optionD,
            String correctAnswer,
            String explanation) {

        System.out.println();
        System.out.println(question);
        System.out.println("  A. " + optionA);
        System.out.println("  B. " + optionB);
        System.out.println("  C. " + optionC);
        System.out.println("  D. " + optionD);

        String answer = readChoiceLetter(input);
        if (answer == null) {
            // End of input: do not count or reveal; let the caller wind down.
            return false;
        }

        boolean correct = answer.equals(normalizeAnswer(correctAnswer));
        questionsAnswered++;
        if (correct) {
            questionsCorrect++;
            System.out.println("Correct!");
        } else {
            System.out.println("Incorrect. The correct answer is " + normalizeAnswer(correctAnswer) + ".");
        }
        System.out.println("Why: " + explanation);

        recordTopicResult(topicIndex, correct);
        awardXpIfCorrect(correct, 10, topicNames[topicIndex]);
        updateTopicMastery(topicIndex);
        unlockAbilityIfMastered(topicIndex);
        return correct;
    }

    public static boolean askShortAnswer(
            Scanner input,
            int topicIndex,
            String question,
            String correctAnswer,
            String explanation) {

        System.out.println();
        System.out.println(question);
        System.out.print("Your answer: ");

        String line = readLine(input);
        if (line == null) {
            return false;
        }

        boolean correct = normalizeAnswer(line).equals(normalizeAnswer(correctAnswer));
        questionsAnswered++;
        if (correct) {
            questionsCorrect++;
            System.out.println("Correct!");
        } else {
            System.out.println("Incorrect. The correct answer is " + correctAnswer + ".");
        }
        System.out.println("Why: " + explanation);

        recordTopicResult(topicIndex, correct);
        awardXpIfCorrect(correct, 10, topicNames[topicIndex]);
        updateTopicMastery(topicIndex);
        unlockAbilityIfMastered(topicIndex);
        return correct;
    }

    public static String readChoiceLetter(Scanner input) {
        while (true) {
            System.out.print("Your answer (A/B/C/D): ");
            String line = readLine(input);
            if (line == null) {
                return null; // End of input.
            }
            String norm = normalizeAnswer(line);
            if (norm.equals("A") || norm.equals("B") || norm.equals("C") || norm.equals("D")) {
                return norm;
            }
            System.out.println("Please enter A, B, C, or D.");
        }
    }

    public static void recordTopicResult(int topicIndex, boolean correct) {
        topicAttempts[topicIndex]++;
        if (correct) {
            topicCorrect[topicIndex]++;
        }
    }

    public static void awardXpIfCorrect(boolean correct, int amount, String reason) {
        if (correct) {
            javaXp += amount;
            System.out.println("+" + amount + " Java XP (" + reason + ")");
        }
    }

    public static void updateTopicMastery(int topicIndex) {
        if (topicCorrect[topicIndex] >= 3) {
            topicMastered[topicIndex] = true;
        }
    }

    public static void unlockAbilityIfMastered(int topicIndex) {
        if (topicMastered[topicIndex] && !abilityUnlocked[topicIndex]) {
            abilityUnlocked[topicIndex] = true;
            System.out.println(">>> ABILITY UNLOCKED: " + getAbilityName(topicIndex) + " <<<");
        }
    }

    public static boolean topicMastered(int topicIndex) {
        return topicMastered[topicIndex];
    }

    public static String getAbilityName(int topicIndex) {
        if (topicIndex == TOPIC_FOR_LOOPS) {
            return "Market Scanner";
        } else if (topicIndex == TOPIC_WHILE_LOOPS) {
            return "Signal Decoder";
        } else if (topicIndex == TOPIC_ARRAYS) {
            return "Index Vision";
        } else if (topicIndex == TOPIC_METHODS) {
            return "Trade Calculator";
        } else if (topicIndex == TOPIC_SEQUENTIAL_SEARCH) {
            return "Ticker Finder";
        } else if (topicIndex == TOPIC_BINARY_SEARCH) {
            return "Fast Broker";
        }
        return "Unknown Ability";
    }

    public static int countMasteredTopics() {
        int count = 0;
        for (int i = 0; i < topicMastered.length; i++) {
            if (topicMastered[i]) {
                count++;
            }
        }
        return count;
    }

    public static boolean allTopicsMastered() {
        return countMasteredTopics() == topicNames.length;
    }

    public static void printMasteryReport() {
        System.out.println();
        System.out.println("============ MASTERY REPORT ============");
        System.out.println("Java XP: " + javaXp);
        System.out.println("Questions Correct / Answered: " + questionsCorrect + " / " + questionsAnswered);
        System.out.println("Mastered Topics: " + countMasteredTopics() + " / " + topicNames.length);
        System.out.println();
        for (int i = 0; i < topicNames.length; i++) {
            String topicStatus;
            if (topicMastered[i]) {
                topicStatus = "MASTERED";
            } else {
                topicStatus = "OPEN";
            }
            String abilityStatus;
            if (abilityUnlocked[i]) {
                abilityStatus = "UNLOCKED";
            } else {
                abilityStatus = "LOCKED";
            }
            System.out.println(padRight(topicNames[i], 20) + topicStatus
                    + " (" + topicCorrect[i] + "/" + topicAttempts[i] + " correct)"
                    + "  ->  " + padRight(getAbilityName(i), 16) + abilityStatus);
        }
        System.out.println();
        System.out.println("Java Trading License: " + getLicenseStatusText());
        System.out.println("Mixed Boss Best Score: " + mixedBossBestScore + " / 10 (attempts: " + mixedBossAttempts + ")");
        printUnlockSummary();
    }

    public static void printUnlockSummary() {
        System.out.println();
        System.out.println("Unlocked Trading Tools:");
        boolean any = false;
        for (int i = 0; i < abilityUnlocked.length; i++) {
            if (abilityUnlocked[i]) {
                System.out.println("  - " + getAbilityName(i) + " (from " + topicNames[i] + ")");
                any = true;
            }
        }
        if (!any) {
            System.out.println("  (none yet - master a topic with 3 correct answers to unlock its tool)");
        }
    }

    // ============================================================
    // Java Trading Academy hub
    // ============================================================
    public static void runJavaTradingAcademy(Scanner input) {
        boolean inAcademy = true;
        while (inAcademy) {
            printAcademyHub();
            System.out.print("Choose a floor: ");
            String line = readLine(input);
            if (line == null) {
                return; // End of input leaves the academy.
            }
            int choice = parseIntManually(line);
            if (choice == 0) {
                inAcademy = false;
            } else if (choice == 1) {
                runForLoopFloor(input);
            } else if (choice == 2) {
                runWhileLoopFloor(input);
            } else if (choice == 3) {
                runArraysFloor(input);
            } else if (choice == 4) {
                runMethodsFloor(input);
            } else if (choice == 5) {
                runSequentialSearchFloor(input);
            } else if (choice == 6) {
                runBinarySearchFloor(input);
            } else if (choice == 7) {
                runMixedReviewBoss(input);
            } else {
                System.out.println("Invalid choice. Choose 0-7.");
            }
            if (inAcademy) {
                pauseBriefly();
            }
        }
    }

    public static void printAcademyHub() {
        System.out.println("=====================================");
        System.out.println("JAVA TRADING ACADEMY");
        System.out.println("=====================================");
        System.out.println("Java XP: " + javaXp);
        System.out.println("Questions Correct / Answered: " + questionsCorrect + " / " + questionsAnswered);
        System.out.println("Mastered Topics: " + countMasteredTopics() + " / " + topicNames.length);
        System.out.println();
        System.out.println("0. Return to Market");
        printFloorLine(1, "For Loop Floor", TOPIC_FOR_LOOPS);
        printFloorLine(2, "While Loop Floor", TOPIC_WHILE_LOOPS);
        printFloorLine(3, "Arrays Floor", TOPIC_ARRAYS);
        printFloorLine(4, "Methods Floor", TOPIC_METHODS);
        printFloorLine(5, "Sequential Search Floor", TOPIC_SEQUENTIAL_SEARCH);
        printFloorLine(6, "Binary Search Floor", TOPIC_BINARY_SEARCH);
        System.out.println("7. Mixed Review Boss      [" + bossStatus() + "]");
        System.out.println();
    }

    public static void printFloorLine(int option, String name, int topicIndex) {
        String floorStatus;
        if (topicMastered[topicIndex]) {
            floorStatus = "MASTERED";
        } else {
            floorStatus = "OPEN";
        }
        String abilityStatus;
        if (abilityUnlocked[topicIndex]) {
            abilityStatus = "UNLOCKED";
        } else {
            abilityStatus = "LOCKED";
        }
        System.out.println(option + ". " + padRight(name, 24)
                + "[" + padRight(floorStatus, 8) + "]  "
                + padRight(getAbilityName(topicIndex), 16) + abilityStatus);
    }

    public static String bossStatus() {
        if (javaTradingLicenseUnlocked) {
            return "PASSED";
        }
        if (allTopicsMastered()) {
            return "OPEN";
        }
        return "LOCKED";
    }

    public static void printFloorHeader(String title, int topicIndex) {
        System.out.println();
        System.out.println("-------------------------------------");
        System.out.println(title);
        System.out.println("Master with 3 correct answers to unlock: " + getAbilityName(topicIndex));
        System.out.println("-------------------------------------");
    }

    public static void printFloorFooter(int topicIndex) {
        System.out.println();
        if (topicMastered[topicIndex]) {
            System.out.println(topicNames[topicIndex] + ": MASTERED. " + getAbilityName(topicIndex) + " is UNLOCKED.");
        } else {
            System.out.println(topicNames[topicIndex] + ": " + topicCorrect[topicIndex]
                    + "/3 correct. Keep practicing to unlock " + getAbilityName(topicIndex) + ".");
        }
    }

    // ============================================================
    // Floor 1 - For Loops  (unlocks Market Scanner)
    // ============================================================
    public static void runForLoopFloor(Scanner input) {
        printFloorHeader("FOR LOOP FLOOR", TOPIC_FOR_LOOPS);

        System.out.println();
        System.out.println("Challenge 1 of 5 - Predict Output");
        System.out.println("  for (int i = 0; i < 3; i++) {");
        System.out.println("      System.out.print(i + \" \");");
        System.out.println("  }");
        askMultipleChoice(input, TOPIC_FOR_LOOPS,
                "What does this print?",
                "1 2 3", "0 1 2", "0 1 2 3", "3 2 1",
                "B",
                "The loop starts at 0, runs while i < 3, and stops before 3.");

        System.out.println();
        System.out.println("Challenge 2 of 5 - Trace Variable");
        askMultipleChoice(input, TOPIC_FOR_LOOPS,
                "If prices.length is 8, what is the final valid value of i in a loop using i < prices.length?",
                "8", "7", "9", "0",
                "B",
                "Indexes go from 0 to length - 1.");

        System.out.println();
        System.out.println("Challenge 3 of 5 - Fix Bug");
        System.out.println("  for (int i = 0; i <= prices.length; i++) {");
        System.out.println("      System.out.println(prices[i]);");
        System.out.println("  }");
        askMultipleChoice(input, TOPIC_FOR_LOOPS,
                "Which fix prevents the off-by-one error?",
                "Change i = 0 to i = 1",
                "Change i <= prices.length to i < prices.length",
                "Change i++ to i--",
                "Change prices[i] to prices[prices.length]",
                "B",
                "prices[prices.length] is outside the array.");

        System.out.println();
        System.out.println("Challenge 4 of 5 - Fill Blank");
        System.out.println("  for (int i = 0; i < ______; i++) {");
        System.out.println("      System.out.println(tickers[i]);");
        System.out.println("  }");
        askMultipleChoice(input, TOPIC_FOR_LOOPS,
                "What fills the blank?",
                "tickers.length", "tickers.length - 1", "tickers[0]", "i.length",
                "A",
                "i < tickers.length safely visits every valid index.");

        System.out.println();
        System.out.println("Challenge 5 of 5 - Stock Application");
        printMarket();
        askMultipleChoice(input, TOPIC_FOR_LOOPS,
                "Which loop safely visits every stock?",
                "for (int i = 0; i <= prices.length; i++)",
                "for (int i = 1; i < prices.length; i++)",
                "for (int i = 0; i < prices.length; i++)",
                "for (int i = prices.length; i > 0; i++)",
                "C",
                "It starts at 0 and stops before prices.length.");

        printFloorFooter(TOPIC_FOR_LOOPS);
    }

    // ============================================================
    // Floor 2 - While Loops  (unlocks Signal Decoder)
    // ============================================================
    public static void runWhileLoopFloor(Scanner input) {
        printFloorHeader("WHILE LOOP FLOOR", TOPIC_WHILE_LOOPS);

        System.out.println();
        System.out.println("Challenge 1 of 5 - Predict Output");
        System.out.println("  int x = 3;");
        System.out.println("  while (x > 0) {");
        System.out.println("      System.out.print(x + \" \");");
        System.out.println("      x--;");
        System.out.println("  }");
        askMultipleChoice(input, TOPIC_WHILE_LOOPS,
                "What does this print?",
                "0 1 2", "3 2 1", "3 2 1 0", "It prints forever",
                "B",
                "x starts at 3 and decreases, printing 3 2 1 before x reaches 0.");

        System.out.println();
        System.out.println("Challenge 2 of 5 - Trace Variable");
        System.out.println("  int x = 3;");
        System.out.println("  while (x > 0) {");
        System.out.println("      x--;");
        System.out.println("  }");
        askMultipleChoice(input, TOPIC_WHILE_LOOPS,
                "What is x after the loop finishes?",
                "3", "2", "1", "0",
                "D",
                "The loop keeps subtracting until x reaches 0.");

        System.out.println();
        System.out.println("Challenge 3 of 5 - Fix Infinite Loop");
        System.out.println("  int x = 3;");
        System.out.println("  while (x > 0) {");
        System.out.println("      System.out.println(x);");
        System.out.println("  }");
        askMultipleChoice(input, TOPIC_WHILE_LOOPS,
                "What prevents this from running forever?",
                "Change x > 0 to x < 0",
                "Add x--; inside the loop",
                "Remove while",
                "Change x to a String",
                "B",
                "Without x--, the condition never becomes false.");

        System.out.println();
        System.out.println("Challenge 4 of 5 - Fill Digit Expression");
        System.out.println("  int num = 123;");
        System.out.println("  int digit = num ______ 10;");
        askMultipleChoice(input, TOPIC_WHILE_LOOPS,
                "What fills the blank to get the last digit?",
                "%", "/", "*", "+",
                "A",
                "num % 10 yields the last digit.");

        System.out.println();
        System.out.println("Challenge 5 of 5 - Stock Signal Application");
        System.out.println("Market signal: 133444");
        askMultipleChoice(input, TOPIC_WHILE_LOOPS,
                "Which digit has the longest repeated run?",
                "1", "3", "4", "No digit repeats",
                "C",
                "The digit 4 repeats three times in a row, the longest run.");

        printFloorFooter(TOPIC_WHILE_LOOPS);
    }

    // ============================================================
    // Floor 3 - Arrays  (unlocks Index Vision)
    // ============================================================
    public static void runArraysFloor(Scanner input) {
        printFloorHeader("ARRAYS FLOOR", TOPIC_ARRAYS);

        System.out.println();
        System.out.println("Challenge 1 of 5 - Predict Array Access");
        System.out.println("  String[] tickers = {\"APEX\", \"NOVA\", \"BYTE\"};");
        askMultipleChoice(input, TOPIC_ARRAYS,
                "What is tickers[2]?",
                "APEX", "NOVA", "BYTE", "index error",
                "C",
                "Index 2 is the third element, BYTE.");

        System.out.println();
        System.out.println("Challenge 2 of 5 - Trace Last Index");
        askMultipleChoice(input, TOPIC_ARRAYS,
                "If prices.length is 8, what is the last valid index?",
                "8", "7", "9", "0",
                "B",
                "Indexes run from 0 to length - 1.");

        System.out.println();
        System.out.println("Challenge 3 of 5 - Fix Invalid Index");
        System.out.println("  System.out.println(prices[prices.length]);");
        askMultipleChoice(input, TOPIC_ARRAYS,
                "Which replacement safely prints the last price?",
                "prices[0]",
                "prices[prices.length - 1]",
                "prices[prices.length + 1]",
                "prices[-1]",
                "B",
                "The last valid index is length - 1.");

        System.out.println();
        System.out.println("Challenge 4 of 5 - Fill Array Length Blank");
        System.out.println("  sharesOwned = new int[______];");
        askMultipleChoice(input, TOPIC_ARRAYS,
                "What fills the blank so sharesOwned has one slot for every stock?",
                "prices.length", "prices[0]", "tickers[0]", "day",
                "A",
                "Matching prices.length keeps the parallel arrays aligned.");

        System.out.println();
        System.out.println("Challenge 5 of 5 - Stock Application");
        printMarket();
        askShortAnswer(input, TOPIC_ARRAYS,
                "In the default market, what index belongs to BYTE?",
                "2",
                "BYTE is tickers[2], so prices[2], stockIds[2], sharesOwned[2], and riskLevels[2] all describe BYTE.");

        printFloorFooter(TOPIC_ARRAYS);
    }

    // ============================================================
    // Floor 4 - Methods  (unlocks Trade Calculator)
    // ============================================================
    public static void runMethodsFloor(Scanner input) {
        printFloorHeader("METHODS FLOOR", TOPIC_METHODS);

        System.out.println();
        System.out.println("Challenge 1 of 5 - Predict Return Value");
        System.out.println("  public static int calculateTradeValue(int price, int shares) {");
        System.out.println("      return price * shares;");
        System.out.println("  }");
        askMultipleChoice(input, TOPIC_METHODS,
                "What does calculateTradeValue(45, 3) return?",
                "48", "135", "453", "nothing, because it is void",
                "B",
                "45 * 3 = 135.");

        System.out.println();
        System.out.println("Challenge 2 of 5 - Trace Parameters");
        System.out.println("  public static int calculateTradeValue(int index, int shares)");
        askMultipleChoice(input, TOPIC_METHODS,
                "How many parameters are there?",
                "0", "1", "2", "3",
                "C",
                "index and shares are the two parameters.");

        System.out.println();
        System.out.println("Challenge 3 of 5 - Fix Method Call");
        System.out.println("  int value = calculateTradeValue();");
        askMultipleChoice(input, TOPIC_METHODS,
                "The method needs index and shares. Which call is correct?",
                "calculateTradeValue",
                "calculateTradeValue(0, 3)",
                "calculateTradeValue(int index, int shares)",
                "calculateTradeValue = 0, 3",
                "B",
                "Arguments are passed as values, like (0, 3).");

        System.out.println();
        System.out.println("Challenge 4 of 5 - Fill Header Blank");
        System.out.println("  public static ______ getNetWorth() {");
        System.out.println("      return cash + getPortfolioValue();");
        System.out.println("  }");
        askMultipleChoice(input, TOPIC_METHODS,
                "What fills the blank?",
                "void", "int", "boolean", "String[]",
                "B",
                "It returns an int total, so the return type is int.");

        System.out.println();
        System.out.println("Challenge 5 of 5 - Stock Application");
        askMultipleChoice(input, TOPIC_METHODS,
                "Which method should calculate the value of buying/selling shares?",
                "printMarket()",
                "calculateTradeValue(index, shares)",
                "pauseBriefly()",
                "initializePlayer()",
                "B",
                "calculateTradeValue computes price times shares.");

        printFloorFooter(TOPIC_METHODS);
    }

    // ============================================================
    // Floor 5 - Sequential Search  (unlocks Ticker Finder)
    // ============================================================
    public static void runSequentialSearchFloor(Scanner input) {
        printFloorHeader("SEQUENTIAL SEARCH FLOOR", TOPIC_SEQUENTIAL_SEARCH);

        System.out.println();
        System.out.println("Challenge 1 of 5 - Trace Checked Indexes");
        System.out.println("  String[] tickers = {\"APEX\", \"NOVA\", \"BYTE\", \"IRON\"};");
        System.out.println("  target = \"BYTE\";");
        askMultipleChoice(input, TOPIC_SEQUENTIAL_SEARCH,
                "Which indexes are checked before BYTE is found?",
                "2 only", "0, 1, 2", "0, 1, 2, 3", "3, 2",
                "B",
                "Sequential search checks index 0, then 1, then 2 where BYTE is found.");

        System.out.println();
        System.out.println("Challenge 2 of 5 - Predict Found Index");
        askMultipleChoice(input, TOPIC_SEQUENTIAL_SEARCH,
                "What index should sequential search return for BYTE?",
                "0", "1", "2", "-1",
                "C",
                "BYTE is at index 2.");

        System.out.println();
        System.out.println("Challenge 3 of 5 - Not Found Return");
        System.out.println("  int[] ids = {101, 102, 103};");
        System.out.println("  target = 999;");
        askMultipleChoice(input, TOPIC_SEQUENTIAL_SEARCH,
                "If not found, what should an index-returning search return?",
                "0", "-1", "ids.length", "true",
                "B",
                "-1 signals not found.");

        System.out.println();
        System.out.println("Challenge 4 of 5 - Fill Return Blank");
        System.out.println("  for (int i = 0; i < tickers.length; i++) {");
        System.out.println("      if (tickers[i].equals(target)) {");
        System.out.println("          return ______;");
        System.out.println("      }");
        System.out.println("  }");
        System.out.println("  return -1;");
        askMultipleChoice(input, TOPIC_SEQUENTIAL_SEARCH,
                "What fills the blank?",
                "i", "target", "tickers[i]", "tickers.length",
                "A",
                "Return the index i where the match was found.");

        System.out.println();
        System.out.println("Challenge 5 of 5 - Stock Ticker Application");
        printMarket();
        askShortAnswer(input, TOPIC_SEQUENTIAL_SEARCH,
                "How many comparisons are needed to find OMNI using sequential search in the current market?",
                "8",
                "OMNI is at index 7, so sequential search checks 8 elements (indexes 0 through 7).");

        printFloorFooter(TOPIC_SEQUENTIAL_SEARCH);
    }

    // ============================================================
    // Floor 6 - Binary Search  (unlocks Fast Broker)
    // ============================================================
    public static void runBinarySearchFloor(Scanner input) {
        printFloorHeader("BINARY SEARCH FLOOR", TOPIC_BINARY_SEARCH);

        System.out.println();
        System.out.println("Challenge 1 of 5 - Sorted Requirement");
        askMultipleChoice(input, TOPIC_BINARY_SEARCH,
                "What must be true before binary search can correctly search stockIds?",
                "stockIds must be sorted",
                "stockIds must be random",
                "stockIds must be empty",
                "stockIds must contain only negative numbers",
                "A",
                "Binary search requires sorted data.");

        System.out.println();
        System.out.println("Challenge 2 of 5 - Trace Midpoint");
        System.out.println("  int low = 0;");
        System.out.println("  int high = 7;");
        System.out.println("  int mid = (low + high) / 2;");
        askMultipleChoice(input, TOPIC_BINARY_SEARCH,
                "What is mid?",
                "2", "3", "4", "7",
                "B",
                "(0 + 7) / 2 = 3 using integer division.");

        System.out.println();
        System.out.println("Challenge 3 of 5 - Update Search Range");
        System.out.println("  sorted stockIds: 101 102 103 104 105 106 107 108");
        System.out.println("  target = 107, low = 0, high = 7, mid = 3, stockIds[mid] = 104");
        askMultipleChoice(input, TOPIC_BINARY_SEARCH,
                "Target is larger than stockIds[mid]. What happens?",
                "high = mid - 1",
                "low = mid + 1",
                "return -1 immediately",
                "stop because 104 is close enough",
                "B",
                "When the target is larger, search the upper half by setting low = mid + 1.");

        System.out.println();
        System.out.println("Challenge 4 of 5 - Fill While Condition");
        System.out.println("  int low = 0;");
        System.out.println("  int high = stockIds.length - 1;");
        System.out.println("  while (__________) {");
        System.out.println("      int mid = (low + high) / 2;");
        System.out.println("  }");
        askMultipleChoice(input, TOPIC_BINARY_SEARCH,
                "What condition fills the blank?",
                "low <= high", "low > high", "mid < high", "stockIds.length == 0",
                "A",
                "Keep searching while low <= high.");

        System.out.println();
        System.out.println("Challenge 5 of 5 - Stock ID Application");
        System.out.println("  target = 107");
        System.out.println("  low = 0, high = 7, mid = 3, stockIds[mid] = 104");
        System.out.println("  low = 4, high = 7, mid = 5, stockIds[mid] = 106");
        System.out.println("  low = 6, high = 7, mid = 6, stockIds[mid] = 107");
        askMultipleChoice(input, TOPIC_BINARY_SEARCH,
                "Which indexes are checked?",
                "0, 1, 2, 3, 4, 5, 6", "3, 5, 6", "7 only", "4, 5, 6",
                "B",
                "Binary search only checks the midpoints: indexes 3, 5, and 6.");

        printFloorFooter(TOPIC_BINARY_SEARCH);
    }

    // ============================================================
    // Mixed Review Boss
    // ============================================================
    public static void runMixedReviewBoss(Scanner input) {
        System.out.println();
        System.out.println("========== MIXED REVIEW BOSS ==========");
        if (!allTopicsMastered()) {
            System.out.println("The Mixed Review Boss is LOCKED.");
            System.out.println("Master all six topics first. Still needed:");
            for (int i = 0; i < topicNames.length; i++) {
                if (!topicMastered[i]) {
                    System.out.println("  - " + topicNames[i] + " (" + topicCorrect[i] + "/3 correct)");
                }
            }
            return; // No XP, no recorded attempt.
        }

        System.out.println("All six topics mastered. Answer 10 questions. You need 8/10 to pass.");
        int correctCount = 0;

        if (askMultipleChoice(input, TOPIC_FOR_LOOPS,
                "for (int i = 0; i < 4; i++) { System.out.print(i + \" \"); } prints what?",
                "1 2 3 4", "0 1 2 3", "0 1 2 3 4", "4 3 2 1",
                "B",
                "It starts at 0 and stops before 4.")) {
            correctCount++;
        }

        if (askMultipleChoice(input, TOPIC_ARRAYS,
                "If prices.length is 8, which index is outside the array?",
                "0", "7", "prices.length", "prices.length - 1",
                "C",
                "Valid indexes are 0 to 7; prices.length (8) is one past the end.")) {
            correctCount++;
        }

        if (askMultipleChoice(input, TOPIC_METHODS,
                "What is the return type of public static int getNetWorth()?",
                "int", "void", "boolean", "String",
                "A",
                "The return type appears right before the method name.")) {
            correctCount++;
        }

        if (askMultipleChoice(input, TOPIC_WHILE_LOOPS,
                "int num = 123; int digit = num % 10; What is digit?",
                "1", "12", "3", "123",
                "C",
                "% 10 gives the last digit, 3.")) {
            correctCount++;
        }

        if (askMultipleChoice(input, TOPIC_SEQUENTIAL_SEARCH,
                "IRON is last in {APEX, NOVA, BYTE, IRON}. How many sequential comparisons to find it?",
                "1", "2", "3", "4",
                "D",
                "Sequential search checks every element up to and including the last: 4 comparisons.")) {
            correctCount++;
        }

        if (askMultipleChoice(input, TOPIC_BINARY_SEARCH,
                "Binary search: target 107 is larger than mid value 104. What happens?",
                "high = mid - 1", "low = mid + 1", "return -1", "stop, close enough",
                "B",
                "A larger target means search the upper half.")) {
            correctCount++;
        }

        if (askMultipleChoice(input, TOPIC_FOR_LOOPS,
                "A loop with i <= prices.length eventually tries to read what?",
                "prices[0]", "prices[prices.length - 1]", "prices[prices.length]", "prices[1]",
                "C",
                "i reaches prices.length and reads one past the last index.")) {
            correctCount++;
        }

        if (askMultipleChoice(input, TOPIC_METHODS,
                "Correct method call for buying 3 shares of stock index 0?",
                "calculateTradeValue(0, 3)",
                "calculateTradeValue()",
                "calculateTradeValue(int index, int shares)",
                "calculateTradeValue = 0, 3",
                "A",
                "Pass index 0 and shares 3 as argument values.")) {
            correctCount++;
        }

        if (askMultipleChoice(input, TOPIC_BINARY_SEARCH,
                "Which search usually uses fewer comparisons on sorted data?",
                "sequential search", "binary search", "they are always equal", "neither works",
                "B",
                "Binary search halves the range each step.")) {
            correctCount++;
        }

        if (askMultipleChoice(input, TOPIC_FOR_LOOPS,
                "Which loop safely scans every stock?",
                "for (int i = 0; i <= prices.length; i++)",
                "for (int i = 0; i < prices.length; i++)",
                "for (int i = 1; i < prices.length; i++)",
                "for (int i = prices.length; i > 0; i++)",
                "B",
                "Start at 0 and stop before prices.length.")) {
            correctCount++;
        }

        mixedBossAttempts++;
        if (correctCount > mixedBossBestScore) {
            mixedBossBestScore = correctCount;
        }

        System.out.println();
        System.out.println("Boss Score: " + correctCount + " / 10");
        if (correctCount >= 8) {
            System.out.println("YOU PASSED THE MIXED REVIEW BOSS!");
            unlockJavaTradingLicense();
        } else {
            System.out.println("Not quite - you need 8/10. Review the floors and try again.");
        }
    }

    // ============================================================
    // Java Trading License
    // ============================================================
    public static boolean javaTradingLicenseUnlocked() {
        return javaTradingLicenseUnlocked;
    }

    public static void unlockJavaTradingLicense() {
        if (!javaTradingLicenseUnlocked) {
            javaTradingLicenseUnlocked = true;
            System.out.println(">>> JAVA TRADING LICENSE UNLOCKED! 20% final score bonus earned. <<<");
        }
    }

    public static int getFinalScoreBonusPercent() {
        if (javaTradingLicenseUnlocked) {
            return 20;
        }
        return 0;
    }

    public static int getLicensedFinalNetWorth() {
        int base = getNetWorth();
        int bonus = base * getFinalScoreBonusPercent() / 100;
        return base + bonus;
    }

    // ============================================================
    // While-loop digit helpers (used by Signal Decoder)
    // ============================================================
    public static int countDigitsWithWhile(int number) {
        int n = number;
        if (n < 0) {
            n = -n;
        }
        if (n == 0) {
            return 1;
        }
        int count = 0;
        while (n > 0) {
            count++;
            n = n / 10;
        }
        return count;
    }

    public static int getLastDigit(int number) {
        int n = number;
        if (n < 0) {
            n = -n;
        }
        return n % 10;
    }

    public static int dropLastDigit(int number) {
        return number / 10;
    }

    public static void printWhileDigitSnippet() {
        System.out.println("  int n = signal;");
        System.out.println("  while (n > 0) {");
        System.out.println("      int digit = n % 10;  // last digit");
        System.out.println("      n = n / 10;           // drop last digit");
        System.out.println("  }");
    }

    // ============================================================
    // Search helpers (manual, with comparison counts)
    // ============================================================
    public static int[] sequentialSearchTickerWithCount(String target) {
        int comparisons = 0;
        for (int i = 0; i < tickers.length; i++) {
            comparisons++;
            if (tickers[i].equalsIgnoreCase(target)) {
                return new int[] {i, comparisons};
            }
        }
        return new int[] {-1, comparisons};
    }

    public static int[] sequentialSearchIdWithCount(int target) {
        int comparisons = 0;
        for (int i = 0; i < stockIds.length; i++) {
            comparisons++;
            if (stockIds[i] == target) {
                return new int[] {i, comparisons};
            }
        }
        return new int[] {-1, comparisons};
    }

    public static void printSequentialSearchCodeSnippet() {
        System.out.println("  for (int i = 0; i < tickers.length; i++) {");
        System.out.println("      if (tickers[i].equalsIgnoreCase(target)) {");
        System.out.println("          return i;   // found");
        System.out.println("      }");
        System.out.println("  }");
        System.out.println("  return -1;          // not found");
    }

    public static boolean stockIdsAreSortedAscending() {
        for (int i = 1; i < stockIds.length; i++) {
            if (stockIds[i] < stockIds[i - 1]) {
                return false;
            }
        }
        return true;
    }

    public static int[] binarySearchIdWithCount(int target) {
        int low = 0;
        int high = stockIds.length - 1;
        int comparisons = 0;
        while (low <= high) {
            int mid = (low + high) / 2;
            comparisons++;
            if (stockIds[mid] == target) {
                return new int[] {mid, comparisons};
            } else if (stockIds[mid] < target) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return new int[] {-1, comparisons};
    }

    public static void printBinarySearchCodeSnippet() {
        System.out.println("  int low = 0;");
        System.out.println("  int high = stockIds.length - 1;");
        System.out.println("  while (low <= high) {");
        System.out.println("      int mid = (low + high) / 2;");
        System.out.println("      if (stockIds[mid] == target) return mid;");
        System.out.println("      else if (stockIds[mid] < target) low = mid + 1;");
        System.out.println("      else high = mid - 1;");
        System.out.println("  }");
        System.out.println("  return -1;");
    }

    public static void printBinarySearchTrace(int target) {
        int low = 0;
        int high = stockIds.length - 1;
        while (low <= high) {
            int mid = (low + high) / 2;
            System.out.println("    low=" + low + " high=" + high + " mid=" + mid
                    + " stockIds[mid]=" + stockIds[mid]);
            if (stockIds[mid] == target) {
                return;
            } else if (stockIds[mid] < target) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
    }

    // ============================================================
    // Trading gameplay
    // ============================================================
    public static boolean isValidStockIndex(int index) {
        return index >= 0 && index < prices.length;
    }

    public static int getPortfolioValue() {
        int total = 0;
        for (int i = 0; i < prices.length; i++) {
            total += prices[i] * sharesOwned[i];
        }
        return total;
    }

    public static int getNetWorth() {
        return cash + getPortfolioValue();
    }

    public static int calculateTradeValue(int index, int shares) {
        return prices[index] * shares;
    }

    public static int getTotalSharesOwned() {
        int total = 0;
        for (int i = 0; i < sharesOwned.length; i++) {
            total += sharesOwned[i];
        }
        return total;
    }

    public static void printMarket() {
        System.out.println();
        System.out.println("=== MARKET (Day " + day + " / " + MAX_DAYS + ") ===");
        System.out.println(padRight("Idx", 5) + padRight("Ticker", 8) + padRight("ID", 6)
                + padRight("Price", 8) + padRight("Prev", 8) + padRight("Change", 9)
                + padRight("Owned", 7) + "Risk");
        for (int i = 0; i < prices.length; i++) {
            int change = prices[i] - previousPrices[i];
            String changeText;
            if (change > 0) {
                changeText = "+" + change;
            } else {
                changeText = "" + change;
            }
            System.out.println(padRight("" + i, 5)
                    + padRight(tickers[i], 8)
                    + padRight("" + stockIds[i], 6)
                    + padRight("$" + prices[i], 8)
                    + padRight("$" + previousPrices[i], 8)
                    + padRight(changeText, 9)
                    + padRight("" + sharesOwned[i], 7)
                    + riskLevels[i]);
        }
        if (abilityUnlocked[ABILITY_MARKET_SCANNER]) {
            printMarketScanner();
        }
    }

    public static void printMarketScanner() {
        System.out.println();
        System.out.println("MARKET SCANNER ACTIVE");
        System.out.println("  Code: for (int i = 0; i < prices.length; i++)");
        System.out.println("  First valid index: 0");
        System.out.println("  Last valid index: " + (prices.length - 1));
        System.out.println("  Stocks scanned: " + prices.length);
        if (learningMode) {
            for (int i = 0; i < prices.length; i++) {
                System.out.println("    i = " + i + "  ->  " + tickers[i]);
            }
        }
    }

    public static void advanceDay() {
        if (gameOver) {
            return;
        }

        if (abilityUnlocked[ABILITY_SIGNAL_DECODER]) {
            printSignalDecoder();
        }

        // Save current prices into previousPrices before they change.
        for (int i = 0; i < prices.length; i++) {
            previousPrices[i] = prices[i];
        }

        updatePricesForNewDay();
        day++;

        System.out.println();
        System.out.println("Advanced to Day " + day + " of " + MAX_DAYS + ".");
        printDailyMarketSummary();
        checkGameEnd();
    }

    public static void updatePricesForNewDay() {
        for (int i = 0; i < prices.length; i++) {
            int maxChange = riskLevels[i] + 2;
            int change = randomIntInRange(-maxChange, maxChange);
            int newPrice = prices[i] + change;
            if (newPrice < MIN_STOCK_PRICE) {
                newPrice = MIN_STOCK_PRICE;
            }
            prices[i] = newPrice;
        }
    }

    public static void printDailyMarketSummary() {
        System.out.println("Daily price changes:");
        for (int i = 0; i < prices.length; i++) {
            int change = prices[i] - previousPrices[i];
            String changeText;
            if (change > 0) {
                changeText = "+" + change;
            } else {
                changeText = "" + change;
            }
            System.out.println("  " + padRight(tickers[i], 6) + "$" + previousPrices[i]
                    + " -> $" + prices[i] + " (" + changeText + ")");
        }
    }

    public static void printSignalDecoder() {
        System.out.println();
        System.out.println("SIGNAL DECODER ACTIVE");
        int signal = randomIntInRange(100, 999);
        System.out.println("  Market signal: " + signal);
        System.out.println("  Digit count (while loop): " + countDigitsWithWhile(signal));
        System.out.println("  Last digit (% 10): " + getLastDigit(signal));
        System.out.println("  Reduced signal (/ 10): " + dropLastDigit(signal));
        if (learningMode) {
            printWhileDigitSnippet();
        }
        int lastDigit = getLastDigit(signal);
        if (lastDigit >= 7) {
            System.out.println("  Hint: a high last digit suggests a volatile session ahead.");
        } else if (lastDigit >= 4) {
            System.out.println("  Hint: moderate volatility expected.");
        } else {
            System.out.println("  Hint: calmer trading expected.");
        }
        System.out.println("  (Signal Decoder is a hint only; it does not change prices and awards no XP.)");
    }

    public static int randomIntInRange(int min, int max) {
        int span = max - min + 1;
        return min + (int) (Math.random() * span);
    }

    public static void checkGameEnd() {
        int netWorth = getNetWorth();
        if (netWorth <= BANKRUPT_NET_WORTH) {
            gameOver = true;
            gameOverReason = "Bankrupt! Net worth fell to $" + netWorth + ".";
            printFinalSummary();
            return;
        }
        if (day > MAX_DAYS) {
            gameOver = true;
            gameOverReason = "You reached the end of Day " + MAX_DAYS + ".";
            printFinalSummary();
        }
    }

    public static void printPortfolio() {
        System.out.println();
        System.out.println("=== PORTFOLIO ===");
        System.out.println("Cash: $" + cash);
        System.out.println("Portfolio Value: $" + getPortfolioValue());
        System.out.println("Net Worth: $" + getNetWorth());
        System.out.println("Total Shares Owned: " + getTotalSharesOwned());
        boolean any = false;
        for (int i = 0; i < sharesOwned.length; i++) {
            if (sharesOwned[i] > 0) {
                if (!any) {
                    System.out.println("Positions:");
                    any = true;
                }
                System.out.println("  [" + i + "] " + padRight(tickers[i], 6) + sharesOwned[i]
                        + " share(s) @ $" + prices[i] + " = $" + (prices[i] * sharesOwned[i]));
            }
        }
        if (!any) {
            System.out.println("You own no shares yet.");
        }
    }

    public static void buyStock(Scanner input) {
        System.out.println();
        System.out.println("=== BUY STOCK ===");

        int index = -1;

        if (abilityUnlocked[ABILITY_TICKER_FINDER]) {
            index = offerTickerFinder(input);
        }
        if (index < 0 && abilityUnlocked[ABILITY_FAST_BROKER]) {
            index = offerFastBroker(input);
        }

        if (index < 0) {
            if (abilityUnlocked[ABILITY_INDEX_VISION]) {
                printIndexVision();
            }
            index = readIntInRange(input,
                    "Enter stock index (0-" + (prices.length - 1) + "): ",
                    0, prices.length - 1);
            if (index == INPUT_CANCEL) {
                System.out.println("Buy cancelled.");
                return;
            }
        }

        int maxShares = cash / prices[index];
        if (maxShares < 1) {
            System.out.println("You cannot afford even one share of " + tickers[index]
                    + " ($" + prices[index] + "). Cash: $" + cash + ".");
            return;
        }

        int shares = readIntInRange(input,
                "How many shares of " + tickers[index] + " to buy (1-" + maxShares + "): ",
                1, maxShares);
        if (shares == INPUT_CANCEL) {
            System.out.println("Buy cancelled.");
            return;
        }

        if (abilityUnlocked[ABILITY_TRADE_CALCULATOR]) {
            printTradeCalculator(index, shares);
        }

        int cost = calculateTradeValue(index, shares);
        cash -= cost;
        sharesOwned[index] += shares;
        System.out.println("Bought " + shares + " share(s) of " + tickers[index] + " for $" + cost + ".");
        System.out.println("Cash remaining: $" + cash);
    }

    public static void sellStock(Scanner input) {
        System.out.println();
        System.out.println("=== SELL STOCK ===");

        if (getTotalSharesOwned() == 0) {
            System.out.println("You own no shares to sell.");
            return;
        }

        if (abilityUnlocked[ABILITY_INDEX_VISION]) {
            printIndexVision();
        }

        int index = readIntInRange(input,
                "Enter stock index (0-" + (prices.length - 1) + "): ",
                0, prices.length - 1);
        if (index == INPUT_CANCEL) {
            System.out.println("Sell cancelled.");
            return;
        }

        if (sharesOwned[index] == 0) {
            System.out.println("You own no shares of " + tickers[index] + ".");
            return;
        }

        int shares = readIntInRange(input,
                "How many shares of " + tickers[index] + " to sell (1-" + sharesOwned[index] + "): ",
                1, sharesOwned[index]);
        if (shares == INPUT_CANCEL) {
            System.out.println("Sell cancelled.");
            return;
        }

        if (abilityUnlocked[ABILITY_TRADE_CALCULATOR]) {
            printTradeCalculator(index, shares);
        }

        int proceeds = calculateTradeValue(index, shares);
        cash += proceeds;
        sharesOwned[index] -= shares;
        System.out.println("Sold " + shares + " share(s) of " + tickers[index] + " for $" + proceeds + ".");
        System.out.println("Cash: $" + cash);
    }

    public static void printIndexVision() {
        System.out.println("INDEX VISION ACTIVE");
        System.out.println("  Valid index range: 0 to " + (prices.length - 1));
        System.out.println("  prices[prices.length] is INVALID (one past the end).");
        if (learningMode) {
            System.out.println("  Parallel arrays: index i describes tickers[i], stockIds[i],");
            System.out.println("  prices[i], sharesOwned[i], and riskLevels[i] together.");
        }
    }

    public static void printTradeCalculator(int index, int shares) {
        System.out.println("TRADE CALCULATOR");
        System.out.println("  Call: calculateTradeValue(" + index + ", " + shares + ")");
        System.out.println("  Formula: prices[" + index + "] * " + shares);
        System.out.println("  Price: $" + prices[index] + ", Shares: " + shares
                + ", Trade Value: $" + calculateTradeValue(index, shares));
    }

    public static int offerTickerFinder(Scanner input) {
        System.out.print("Use Ticker Finder to search by ticker symbol? (y/n): ");
        String line = readLine(input);
        if (line == null) {
            return -1;
        }
        String norm = normalizeAnswer(line);
        if (!norm.equals("Y") && !norm.equals("YES")) {
            return -1;
        }

        System.out.print("Enter ticker symbol: ");
        String target = readLine(input);
        if (target == null) {
            return -1;
        }
        target = target.trim();

        System.out.println("Running sequential search:");
        printSequentialSearchCodeSnippet();
        if (learningMode) {
            for (int i = 0; i < tickers.length; i++) {
                System.out.println("    checking index " + i + ": " + tickers[i]);
                if (tickers[i].equalsIgnoreCase(target)) {
                    break;
                }
            }
        }
        int[] result = sequentialSearchTickerWithCount(target);
        if (result[0] >= 0) {
            System.out.println("Found " + tickers[result[0]] + " at index " + result[0]
                    + " after " + result[1] + " comparison(s).");
            return result[0];
        }
        System.out.println("Ticker not found after " + result[1] + " comparison(s). Falling back to manual entry.");
        return -1;
    }

    public static int offerFastBroker(Scanner input) {
        System.out.print("Use Fast Broker to search by stock ID? (y/n): ");
        String line = readLine(input);
        if (line == null) {
            return -1;
        }
        String norm = normalizeAnswer(line);
        if (!norm.equals("Y") && !norm.equals("YES")) {
            return -1;
        }

        int id = readIntInRange(input, "Enter stock ID (101-108): ", 1, 100000);
        if (id == INPUT_CANCEL) {
            return -1;
        }

        if (!stockIdsAreSortedAscending()) {
            System.out.println("Stock IDs are not sorted; binary search is unsafe. Falling back to manual entry.");
            return -1;
        }

        System.out.println("Running binary search:");
        printBinarySearchCodeSnippet();
        if (learningMode) {
            printBinarySearchTrace(id);
        }
        int[] result = binarySearchIdWithCount(id);
        if (result[0] >= 0) {
            System.out.println("Found ID " + id + " (" + tickers[result[0]] + ") at index "
                    + result[0] + " after " + result[1] + " comparison(s).");
            return result[0];
        }
        System.out.println("Stock ID not found after " + result[1] + " comparison(s). Falling back to manual entry.");
        return -1;
    }

    public static void printFinalSummary() {
        System.out.println();
        System.out.println("===================================");
        System.out.println("FINAL SUMMARY");
        System.out.println("===================================");
        System.out.println(gameOverReason);
        System.out.println("Net Worth: $" + getNetWorth());
        System.out.println("Licensed Final Net Worth: $" + getLicensedFinalNetWorth()
                + " (bonus " + getFinalScoreBonusPercent() + "%)");
        System.out.println("Java XP: " + javaXp);
        System.out.println("Questions Correct / Answered: " + questionsCorrect + " / " + questionsAnswered);
        System.out.println("Mastered Topics: " + countMasteredTopics() + " / " + topicNames.length);
        System.out.println("Java Trading License: " + getLicenseStatusText());
        System.out.println("Mixed Boss Best Score: " + mixedBossBestScore + " / 10");
        System.out.println("Final Rating: " + getFinalRating());
        System.out.println("===================================");
    }

    public static String getFinalRating() {
        int net = getLicensedFinalNetWorth();
        if (net <= BANKRUPT_NET_WORTH) {
            return "BANKRUPT";
        }
        if (net >= LEGENDARY_NET_WORTH) {
            return "LEGENDARY TRADER";
        }
        if (net >= WIN_NET_WORTH) {
            return "PROFITABLE TRADER";
        }
        return "ROOKIE TRADER";
    }

    public static String padRight(String text, int width) {
        String result = text;
        while (result.length() < width) {
            result = result + " ";
        }
        return result;
    }

    // ============================================================
    // Developer tests (option 99) - preserve all game state
    // ============================================================
    public static int[] copyIntArray(int[] source) {
        int[] copy = new int[source.length];
        for (int i = 0; i < source.length; i++) {
            copy[i] = source[i];
        }
        return copy;
    }

    public static boolean[] copyBooleanArray(boolean[] source) {
        boolean[] copy = new boolean[source.length];
        for (int i = 0; i < source.length; i++) {
            copy[i] = source[i];
        }
        return copy;
    }

    public static void runDeveloperTests() {
        System.out.println();
        System.out.println("========== DEVELOPER TESTS ==========");

        // Snapshot every piece of state listed in the spec.
        int savedDay = day;
        int savedCash = cash;
        boolean savedGameOver = gameOver;
        String savedReason = gameOverReason;
        boolean savedLearning = learningMode;
        int savedXp = javaXp;
        int savedAnswered = questionsAnswered;
        int savedCorrect = questionsCorrect;
        int[] savedPrices = copyIntArray(prices);
        int[] savedPrev = copyIntArray(previousPrices);
        int[] savedShares = copyIntArray(sharesOwned);
        int[] savedRisk = copyIntArray(riskLevels);
        int[] savedIds = copyIntArray(stockIds);
        int[] savedTopicCorrect = copyIntArray(topicCorrect);
        int[] savedTopicAttempts = copyIntArray(topicAttempts);
        boolean[] savedTopicMastered = copyBooleanArray(topicMastered);
        boolean[] savedAbility = copyBooleanArray(abilityUnlocked);
        boolean savedLicense = javaTradingLicenseUnlocked;
        int savedBossAttempts = mixedBossAttempts;
        int savedBossBest = mixedBossBestScore;

        int total = 0;
        int passed = 0;

        // --- Index validation ---
        total++;
        if (isValidStockIndex(0) && isValidStockIndex(7)) {
            passed++; printPass("valid indexes 0 and 7 accepted");
        } else { printFail("valid indexes 0 and 7 accepted"); }

        total++;
        if (!isValidStockIndex(-1) && !isValidStockIndex(8)) {
            passed++; printPass("invalid indexes -1 and 8 rejected");
        } else { printFail("invalid indexes -1 and 8 rejected"); }

        // --- Portfolio value math ---
        for (int i = 0; i < sharesOwned.length; i++) {
            sharesOwned[i] = 0;
        }
        prices[0] = 10;
        prices[1] = 20;
        sharesOwned[0] = 2;
        sharesOwned[1] = 3;
        total++;
        if (getPortfolioValue() == (2 * 10 + 3 * 20)) {
            passed++; printPass("portfolio value math (expected 80)");
        } else { printFail("portfolio value math (expected 80, got " + getPortfolioValue() + ")"); }

        // --- Net worth math ---
        cash = 500;
        total++;
        if (getNetWorth() == 500 + 80) {
            passed++; printPass("net worth math (expected 580)");
        } else { printFail("net worth math (expected 580, got " + getNetWorth() + ")"); }

        // --- Trade value math ---
        total++;
        if (calculateTradeValue(0, 3) == 30) {
            passed++; printPass("trade value math (10 * 3 = 30)");
        } else { printFail("trade value math (got " + calculateTradeValue(0, 3) + ")"); }

        // --- Total shares owned ---
        total++;
        if (getTotalSharesOwned() == 5) {
            passed++; printPass("total shares owned (expected 5)");
        } else { printFail("total shares owned (got " + getTotalSharesOwned() + ")"); }

        // --- Sequential search (ticker) found ---
        int[] seqFound = sequentialSearchTickerWithCount("BYTE");
        total++;
        if (seqFound[0] == 2 && seqFound[1] == 3) {
            passed++; printPass("sequential ticker found BYTE at 2 in 3 comparisons");
        } else { printFail("sequential ticker found (got index " + seqFound[0] + ", comps " + seqFound[1] + ")"); }

        // --- Sequential search (ticker) not found ---
        int[] seqMiss = sequentialSearchTickerWithCount("ZZZ");
        total++;
        if (seqMiss[0] == -1 && seqMiss[1] == tickers.length) {
            passed++; printPass("sequential ticker not found returns -1 with full scan");
        } else { printFail("sequential ticker not found (got index " + seqMiss[0] + ", comps " + seqMiss[1] + ")"); }

        // --- Sequential search (id) found ---
        int[] seqId = sequentialSearchIdWithCount(105);
        total++;
        if (seqId[0] == 4 && seqId[1] == 5) {
            passed++; printPass("sequential id found 105 at 4 in 5 comparisons");
        } else { printFail("sequential id found (got index " + seqId[0] + ", comps " + seqId[1] + ")"); }

        // --- Binary search found ---
        int[] binFound = binarySearchIdWithCount(107);
        total++;
        if (binFound[0] == 6 && binFound[1] == 3) {
            passed++; printPass("binary search found 107 at 6 in 3 comparisons");
        } else { printFail("binary search found (got index " + binFound[0] + ", comps " + binFound[1] + ")"); }

        // --- Binary search not found ---
        int[] binMiss = binarySearchIdWithCount(999);
        total++;
        if (binMiss[0] == -1) {
            passed++; printPass("binary search not found returns -1");
        } else { printFail("binary search not found (got index " + binMiss[0] + ")"); }

        // --- Sorted check ---
        total++;
        if (stockIdsAreSortedAscending()) {
            passed++; printPass("stockIds sorted ascending");
        } else { printFail("stockIds sorted ascending"); }

        // --- Topic mastery unlock ---
        topicCorrect[TOPIC_FOR_LOOPS] = 0;
        topicAttempts[TOPIC_FOR_LOOPS] = 0;
        topicMastered[TOPIC_FOR_LOOPS] = false;
        abilityUnlocked[TOPIC_FOR_LOOPS] = false;
        recordTopicResult(TOPIC_FOR_LOOPS, true);
        recordTopicResult(TOPIC_FOR_LOOPS, true);
        recordTopicResult(TOPIC_FOR_LOOPS, true);
        updateTopicMastery(TOPIC_FOR_LOOPS);
        boolean wasUnlocked = abilityUnlocked[TOPIC_FOR_LOOPS];
        unlockAbilityIfMastered(TOPIC_FOR_LOOPS);
        total++;
        if (topicMastered[TOPIC_FOR_LOOPS] && !wasUnlocked && abilityUnlocked[TOPIC_FOR_LOOPS]) {
            passed++; printPass("3 correct answers master a topic and unlock its ability");
        } else { printFail("topic mastery unlock"); }

        // --- Mastery threshold not reached ---
        topicCorrect[TOPIC_WHILE_LOOPS] = 0;
        topicMastered[TOPIC_WHILE_LOOPS] = false;
        recordTopicResult(TOPIC_WHILE_LOOPS, true);
        recordTopicResult(TOPIC_WHILE_LOOPS, false);
        updateTopicMastery(TOPIC_WHILE_LOOPS);
        total++;
        if (!topicMastered[TOPIC_WHILE_LOOPS]) {
            passed++; printPass("topic with fewer than 3 correct is not mastered");
        } else { printFail("topic with fewer than 3 correct is not mastered"); }

        // --- Ability names ---
        total++;
        if (getAbilityName(TOPIC_FOR_LOOPS).equals("Market Scanner")
                && getAbilityName(TOPIC_BINARY_SEARCH).equals("Fast Broker")
                && getAbilityName(TOPIC_METHODS).equals("Trade Calculator")) {
            passed++; printPass("ability names map correctly");
        } else { printFail("ability names map correctly"); }

        // --- License bonus ---
        for (int i = 0; i < sharesOwned.length; i++) {
            sharesOwned[i] = 0;
        }
        cash = 1000;
        javaTradingLicenseUnlocked = true;
        total++;
        if (getFinalScoreBonusPercent() == 20 && getLicensedFinalNetWorth() == 1200) {
            passed++; printPass("license grants 20% bonus (1000 -> 1200)");
        } else { printFail("license bonus (percent " + getFinalScoreBonusPercent()
                + ", net " + getLicensedFinalNetWorth() + ")"); }

        javaTradingLicenseUnlocked = false;
        total++;
        if (getFinalScoreBonusPercent() == 0 && getLicensedFinalNetWorth() == 1000) {
            passed++; printPass("no license means no bonus (1000 -> 1000)");
        } else { printFail("no license means no bonus"); }

        // --- While digit helpers ---
        total++;
        if (countDigitsWithWhile(123) == 3 && countDigitsWithWhile(0) == 1
                && getLastDigit(123) == 3 && dropLastDigit(123) == 12) {
            passed++; printPass("while digit helpers (count, last, drop)");
        } else { printFail("while digit helpers"); }

        // --- copyIntArray independence ---
        int[] original = {1, 2, 3};
        int[] copy = copyIntArray(original);
        copy[0] = 99;
        total++;
        if (original[0] == 1 && copy[0] == 99 && copy.length == 3) {
            passed++; printPass("copyIntArray makes an independent copy");
        } else { printFail("copyIntArray makes an independent copy"); }

        // --- copyBooleanArray independence ---
        boolean[] originalB = {true, false};
        boolean[] copyB = copyBooleanArray(originalB);
        copyB[1] = true;
        total++;
        if (originalB[1] == false && copyB[1] == true && copyB.length == 2) {
            passed++; printPass("copyBooleanArray makes an independent copy");
        } else { printFail("copyBooleanArray makes an independent copy"); }

        // Restore every piece of state.
        day = savedDay;
        cash = savedCash;
        gameOver = savedGameOver;
        gameOverReason = savedReason;
        learningMode = savedLearning;
        javaXp = savedXp;
        questionsAnswered = savedAnswered;
        questionsCorrect = savedCorrect;
        prices = savedPrices;
        previousPrices = savedPrev;
        sharesOwned = savedShares;
        riskLevels = savedRisk;
        stockIds = savedIds;
        topicCorrect = savedTopicCorrect;
        topicAttempts = savedTopicAttempts;
        topicMastered = savedTopicMastered;
        abilityUnlocked = savedAbility;
        javaTradingLicenseUnlocked = savedLicense;
        mixedBossAttempts = savedBossAttempts;
        mixedBossBestScore = savedBossBest;

        System.out.println();
        System.out.println("Developer Tests Passed: " + passed + " / " + total);
        if (passed == total) {
            System.out.println("ALL DEVELOPER TESTS PASSED.");
        } else {
            System.out.println("SOME DEVELOPER TESTS FAILED.");
        }
        System.out.println("Game state restored.");
    }

    public static void printPass(String name) {
        System.out.println("PASS: " + name);
    }

    public static void printFail(String name) {
        System.out.println("FAIL: " + name);
    }
}
