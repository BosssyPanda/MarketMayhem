public class Strategy {
    public void run(Drone drone, Farm farm) {
        int moisture = farm.moisture()[0];
        int temp = farm.moisture()[1];
        boolean needsWater = moisture < 30 || temp > 35;
        boolean inRange = moisture >= 30 && moisture <= 60;
        boolean notHot = !(temp > 35);
        drone.watch("needsWater", needsWater);
        drone.watch("inRange", inRange);
        drone.watch("notHot", notHot);
    }
}
