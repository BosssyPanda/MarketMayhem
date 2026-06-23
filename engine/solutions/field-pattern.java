public class Strategy {
    public void run(Drone drone, Farm farm) {
        int rows = farm.height();
        int seedlings = 0;
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j <= i; j++) {
                seedlings++;
                drone.watch("seed", seedlings);
            }
        }
        drone.watch("seedlings", seedlings);
    }
}
