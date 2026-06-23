public class Strategy {
    public void run(Drone drone, Farm farm) {
        int[] readings = farm.moisture();
        int total = 0;
        int aboveFive = 0;
        for (int i = 0; i < readings.length; i++) {
            total += readings[i];
            if (readings[i] > 5) aboveFive++;
            drone.watch("i", i);
        }
        drone.watch("total", total);
        drone.watch("aboveFive", aboveFive);
    }
}
