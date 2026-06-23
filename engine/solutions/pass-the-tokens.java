public class Strategy {
    public void run(Drone drone, Farm farm) {
        int[] tokens = farm.signal();
        int last = tokens[tokens.length - 1];
        for (int i = tokens.length - 1; i > 0; i--) {
            tokens[i] = tokens[i - 1];
        }
        tokens[0] = last;
        drone.watch("first", tokens[0]);
    }
}
