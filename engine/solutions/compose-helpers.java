public class Strategy {
    public void run(Drone drone, Farm farm) {
        int totalYield = 0;
        for (int w = 0; w < 5; w++) {
            totalYield += yield(w);
            drone.watch("w", w);
        }
        drone.watch("totalYield", totalYield);
    }

    int yield(int water) {
        return water * 2 + 1;
    }
}
