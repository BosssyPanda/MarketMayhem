public class Strategy {
    public void run(Drone drone, Farm farm) {
        int[] signal = farm.signal();
        int limit = 2000;
        int changed = 0;
        for (int i = 0; i < signal.length; i++) {
            if (signal[i] > limit) {
                signal[i] = limit;
                changed++;
            } else if (signal[i] < -limit) {
                signal[i] = -limit;
                changed++;
            }
        }
        drone.watch("changed", changed);
    }
}
