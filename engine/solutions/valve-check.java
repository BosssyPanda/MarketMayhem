public class Strategy {
    public void run(Drone drone, Farm farm) {
        int tick = 17;
        int remainder = tick % 5;
        int cycles = tick / 5;
        boolean even = tick % 2 == 0;
        drone.watch("remainder", remainder);
        drone.watch("cycles", cycles);
        drone.watch("even", even);
    }
}
