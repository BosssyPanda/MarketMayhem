import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The actor the player controls. Every action is blocking and costs ticks
 * (sensors are free), records a frame into the frame stream, and is bounded by a
 * tick budget + a hard step cap. The recorded frames are the single source of
 * truth the browser uses to animate the farm and drive the live inspector.
 */
public class Drone {
    static final int MOVE_COST = 1;
    static final int PLANT_COST = 2;
    static final int HARVEST_COST = 2;

    private final Farm farm;
    private int x;
    private int y;
    private Crop carrying = Crop.NONE;
    private int moveCount = 0;
    private int plantCount = 0;
    private int harvestCount = 0;

    private final List<String> frames = new ArrayList<String>();
    private final LinkedHashMap<String, String> watches = new LinkedHashMap<String, String>();
    private final LinkedHashMap<String, List<String>> watchHistory = new LinkedHashMap<String, List<String>>();

    private final int tickBudget;
    private int ticksUsed = 0;
    private final int stepCap;
    private int steps = 0;

    public Drone(Farm farm, int startX, int startY, int tickBudget, int stepCap) {
        this.farm = farm;
        this.x = startX;
        this.y = startY;
        this.tickBudget = tickBudget;
        this.stepCap = stepCap;
    }

    // ===== Player API =====

    public void move(Direction d) {
        countStep();
        int nx = x + d.dx();
        int ny = y + d.dy();
        if (!farm.isInside(nx, ny)) {
            throw new RuntimeException(
                "Illegal move: cannot move " + d + " from (" + x + ", " + y + ") off the field.");
        }
        spendTicks(MOVE_COST);
        x = nx;
        y = ny;
        moveCount++;
        emit("{\"type\":\"move\",\"dir\":" + Json.str(d.name()) + ",\"to\":[" + x + "," + y + "]}");
    }

    public void moveNorth() { move(Direction.NORTH); }
    public void moveSouth() { move(Direction.SOUTH); }
    public void moveEast()  { move(Direction.EAST); }
    public void moveWest()  { move(Direction.WEST); }

    public int x() {
        countStep();
        return x;
    }

    public int y() {
        countStep();
        return y;
    }

    public void plant(Crop c) {
        countStep();
        spendTicks(PLANT_COST);
        farm.plantInternal(x, y, c);
        plantCount++;
        emit("{\"type\":\"plant\",\"at\":[" + x + "," + y + "],\"crop\":" + Json.str(c.name()) + "}");
    }

    public Crop harvest() {
        countStep();
        spendTicks(HARVEST_COST);
        Crop got = farm.harvestInternal(x, y);
        carrying = got;
        if (got != Crop.NONE) harvestCount++;
        emit("{\"type\":\"harvest\",\"at\":[" + x + "," + y + "],\"crop\":" + Json.str(got.name()) + "}");
        return got;
    }

    public Tile scan() {
        countStep();
        return farm.tileAt(x, y);
    }

    public void watch(String name, int value) {
        countStep();
        rememberWatch(name, Integer.toString(value));
    }

    public void watch(String name, double value) {
        countStep();
        if (Double.isNaN(value) || Double.isInfinite(value)) {
            rememberWatch(name, Json.str(Double.toString(value)));
            return;
        }
        rememberWatch(name, Double.toString(value));
    }

    public void watch(String name, boolean value) {
        countStep();
        rememberWatch(name, Boolean.toString(value));
    }

    public void watch(String name, String value)  {
        countStep();
        rememberWatch(name, Json.str(value));
    }

    // ===== Engine-internal =====

    private void countStep() {
        if (++steps > stepCap) {
            throw new BudgetReachedException("step cap reached (" + stepCap + ")");
        }
    }

    private void spendTicks(int cost) {
        if (ticksUsed + cost > tickBudget) {
            throw new BudgetReachedException("tick budget reached (" + tickBudget + ")");
        }
        ticksUsed += cost;
        farm.advanceTick(cost);
    }

    // Find the line in the player's Strategy.java that triggered this action, so
    // the editor can highlight the code currently running. Additive: omitted when
    // no Strategy frame is on the stack.
    private int strategyLine() {
        StackTraceElement[] st = Thread.currentThread().getStackTrace();
        for (int i = 0; i < st.length; i++) {
            if ("Strategy".equals(st[i].getClassName())) return st[i].getLineNumber();
        }
        return -1;
    }

    private void emit(String actionJson) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"tick\":").append(farm.tick());
        sb.append(",\"action\":").append(actionJson);
        int line = strategyLine();
        if (line > 0) sb.append(",\"line\":").append(line);
        sb.append(",\"drone\":{\"x\":").append(x)
          .append(",\"y\":").append(y)
          .append(",\"carrying\":").append(Json.str(carrying.name())).append("}");
        if (!watches.isEmpty()) {
            sb.append(",\"watch\":{");
            boolean first = true;
            for (Map.Entry<String, String> e : watches.entrySet()) {
                if (!first) sb.append(",");
                sb.append(Json.str(e.getKey())).append(":").append(e.getValue());
                first = false;
            }
            sb.append("}");
        }
        sb.append(",\"resources\":").append(farm.resourcesJson());
        sb.append("}");
        frames.add(sb.toString());
    }

    private void rememberWatch(String name, String value) {
        if (name == null || name.length() == 0) return;
        watches.put(name, value);
        List<String> values = watchHistory.get(name);
        if (values == null) {
            values = new ArrayList<String>();
            watchHistory.put(name, values);
        }
        if (values.size() < 256) {
            values.add(value);
        }
    }

    public void emitInspectorFrame(String reason) {
        emit("{\"type\":\"inspect\",\"reason\":" + Json.str(reason) + ",\"at\":[" + x + "," + y + "]}");
    }

    public List<String> frames() { return frames; }
    public int ticksUsed() { return ticksUsed; }
    public int tickBudget() { return tickBudget; }
    public int moveCount() { return moveCount; }
    public int plantCount() { return plantCount; }
    public int harvestCount() { return harvestCount; }

    public String watchJson(String name) {
        return watches.get(name);
    }

    public int watchInt(String name, int fallback) {
        String value = watches.get(name);
        if (value == null) return fallback;
        try {
            if (value.length() >= 2 && value.charAt(0) == '"' && value.charAt(value.length() - 1) == '"') {
                value = value.substring(1, value.length() - 1);
            }
            return Integer.parseInt(value);
        } catch (RuntimeException e) {
            return fallback;
        }
    }

    public String watchText(String name) {
        String value = watches.get(name);
        if (value == null) return "";
        if (value.length() >= 2 && value.charAt(0) == '"' && value.charAt(value.length() - 1) == '"') {
            return Json.unquote(value);
        }
        return value;
    }

    public int watchCount(String name) {
        List<String> values = watchHistory.get(name);
        return values == null ? 0 : values.size();
    }

    public boolean watchHistoryIntContainsSequence(String name, int[] expected) {
        List<String> values = watchHistory.get(name);
        if (values == null) return false;
        int next = 0;
        for (int i = 0; i < values.size() && next < expected.length; i++) {
            Integer value = parseWatchInt(values.get(i));
            if (value != null && value.intValue() == expected[next]) {
                next++;
            }
        }
        return next == expected.length;
    }

    private Integer parseWatchInt(String raw) {
        if (raw == null) return null;
        try {
            if (raw.length() >= 2 && raw.charAt(0) == '"' && raw.charAt(raw.length() - 1) == '"') {
                raw = raw.substring(1, raw.length() - 1);
            }
            return Integer.valueOf(Integer.parseInt(raw));
        } catch (RuntimeException e) {
            return null;
        }
    }
}
