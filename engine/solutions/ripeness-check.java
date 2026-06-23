public class Strategy {
    public void run(Drone drone, Farm farm) {
        int moisture = farm.moisture()[0];
        int growth = farm.moisture()[1];
        boolean dryEnough = moisture < 50;
        boolean mature = growth >= 5;
        boolean ready = dryEnough && mature;
        drone.watch("dryEnough", dryEnough);
        drone.watch("mature", mature);
        drone.watch("ready", ready);
    }
}
