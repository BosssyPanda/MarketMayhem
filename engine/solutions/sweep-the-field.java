public class Strategy {
    public void run(Drone drone, Farm farm) {
        int cells = 0;
        for (int y = 0; y < farm.height(); y++) {
            drone.watch("y", y);
            for (int x = 0; x < farm.width(); x++) {
                cells++;
                drone.watch("x", x);
            }
        }
        drone.watch("cells", cells);
    }
}
