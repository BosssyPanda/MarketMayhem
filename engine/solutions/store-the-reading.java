public class Strategy {
    public void run(Drone drone, Farm farm) {
        int wheat = 12;
        int corn = 8;
        int total = wheat + corn;
        int gap = wheat - corn;
        int doubled = total * 2;
        drone.watch("total", total);
        drone.watch("gap", gap);
        drone.watch("doubled", doubled);
    }
}
