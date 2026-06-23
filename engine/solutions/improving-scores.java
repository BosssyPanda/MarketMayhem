public class Strategy {
    public void run(Drone drone, Farm farm) {
        int[] scores = farm.prices();
        boolean improved = true;
        for (int i = 1; i < scores.length; i++) {
            if (scores[i] < scores[i - 1]) {
                improved = false;
            }
        }
        int start;
        if (improved) {
            start = scores.length / 2;
        } else {
            start = 0;
        }
        int sum = 0;
        for (int i = start; i < scores.length; i++) {
            sum += scores[i];
        }
        int finalAverage = sum / (scores.length - start);
        drone.watch("improved", improved);
        drone.watch("finalAverage", finalAverage);
    }
}
