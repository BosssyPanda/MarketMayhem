public class Strategy {
    public void run(Drone drone, Farm farm) {
        drone.watch("ripe3", isRipe(3));
        drone.watch("ripe5", isRipe(5));
        drone.watch("ripe8", isRipe(8));
    }

    boolean isRipe(int growth) {
        return growth >= 5;
    }
}
