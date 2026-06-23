public class Strategy {
    public void run(Drone drone, Farm farm) {
        int[] scores = farm.prices();
        int total = 0;
        int max = scores[0];
        int maxIndex = 0;
        for (int i = 0; i < scores.length; i++) {
            total += scores[i];
            if (scores[i] > max) {
                max = scores[i];
                maxIndex = i;
            }
        }
        int average = total / scores.length;
        drone.watch("total", total);
        drone.watch("average", average);
        drone.watch("max", max);
        drone.watch("maxIndex", maxIndex);
    }
}
