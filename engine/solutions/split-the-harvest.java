public class Strategy {
    public void run(Drone drone, Farm farm) {
        int crops = 18;
        int basketSize = 4;
        int fullBaskets = crops / basketSize;
        double exact = 18.0 / basketSize;
        drone.watch("crops", crops);
        drone.watch("fullBaskets", fullBaskets);
        drone.watch("exact", exact);
    }
}
