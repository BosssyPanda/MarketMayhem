import java.util.LinkedHashMap;
import java.util.Map;

/** Persistent per-concept mastery. A concept is mastered after three clean correct uses. */
public class Progress {
    public static final String[] CORE_CONCEPTS = new String[] {
        "methods",
        "variables-types",
        "modulo-division",
        "comparison-operators",
        "if-else",
        "for-loops",
        "nested-loops",
        "while-loops",
        "arrays",
        "static-methods",
        "sequential-search",
        "binary-search",
        "bubble-sort",
        "selection-sort"
    };

    private final LinkedHashMap<String, ConceptStatus> concepts = new LinkedHashMap<String, ConceptStatus>();

    public Progress() {
        for (int i = 0; i < CORE_CONCEPTS.length; i++) {
            concepts.put(CORE_CONCEPTS[i], new ConceptStatus());
        }
    }

    public ConceptStatus status(String concept) {
        ConceptStatus status = concepts.get(concept);
        if (status == null) {
            status = new ConceptStatus();
            concepts.put(concept, status);
        }
        return status;
    }

    public void record(String concept, boolean passed) {
        if (concept == null || concept.length() == 0 || "recursion-puzzles".equals(concept)) return;
        ConceptStatus status = status(concept);
        if (passed) {
            if (status.correctStreak < 3) status.correctStreak++;
            status.failCount = 0;
            status.recapDue = false;
            status.mastered = status.correctStreak >= 3;
        } else {
            status.correctStreak = 0;
            if (status.failCount < 3) status.failCount++;
            status.mastered = false;
            status.recapDue = status.failCount >= 3;
        }
    }

    public String firstRecapDue() {
        for (int i = 0; i < CORE_CONCEPTS.length; i++) {
            ConceptStatus status = status(CORE_CONCEPTS[i]);
            if (status.recapDue) return CORE_CONCEPTS[i];
        }
        return "";
    }

    public boolean allCoreMastered() {
        for (int i = 0; i < CORE_CONCEPTS.length; i++) {
            if (!status(CORE_CONCEPTS[i]).mastered) return false;
        }
        return true;
    }

    public String conceptsJson() {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, ConceptStatus> e : concepts.entrySet()) {
            if (!first) sb.append(",");
            first = false;
            ConceptStatus c = e.getValue();
            sb.append(Json.str(e.getKey())).append(":{")
                .append("\"correctStreak\":").append(c.correctStreak)
                .append(",\"mastered\":").append(c.mastered)
                .append(",\"failCount\":").append(c.failCount)
                .append(",\"recapDue\":").append(c.recapDue)
                .append("}");
        }
        sb.append("}");
        return sb.toString();
    }

    public String stateString() {
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (Map.Entry<String, ConceptStatus> e : concepts.entrySet()) {
            if (!first) sb.append(",");
            first = false;
            ConceptStatus c = e.getValue();
            sb.append(e.getKey()).append(":")
                .append(c.correctStreak).append(":")
                .append(c.failCount).append(":")
                .append(c.mastered).append(":")
                .append(c.recapDue);
        }
        return sb.toString();
    }

    public void loadStateString(String encoded) {
        if (encoded == null || encoded.length() == 0) return;
        String[] parts = encoded.split(",");
        for (int i = 0; i < parts.length; i++) {
            String[] fields = parts[i].split(":");
            if (fields.length < 5) continue;
            ConceptStatus c = status(fields[0]);
            c.correctStreak = clamp(parseInt(fields[1], 0), 0, 3);
            c.failCount = clamp(parseInt(fields[2], 0), 0, 3);
            c.mastered = c.correctStreak >= 3 && c.failCount == 0;
            c.recapDue = c.failCount >= 3;
        }
    }

    private static int parseInt(String raw, int fallback) {
        try {
            return Integer.parseInt(raw);
        } catch (RuntimeException e) {
            return fallback;
        }
    }

    private static int clamp(int value, int min, int max) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    public static class ConceptStatus {
        public int correctStreak = 0;
        public int failCount = 0;
        public boolean mastered = false;
        public boolean recapDue = false;
    }
}
