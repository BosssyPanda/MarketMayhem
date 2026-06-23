public class Strategy {
    public void run(Drone drone, Farm farm) {
        int code = farm.moisture()[0];
        int ones = code % 10;
        int tens = (code / 10) % 10;
        int thousands = code / 1000;
        drone.watch("ones", ones);
        drone.watch("tens", tens);
        drone.watch("thousands", thousands);
    }
}
