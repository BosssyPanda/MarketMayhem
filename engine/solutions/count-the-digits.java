public class Strategy {
    public void run(Drone drone, Farm farm) {
        int n = farm.moisture()[0];
        int digitCount = 0;
        int digitSum = 0;
        while (n > 0) {
            digitSum += n % 10;
            n = n / 10;
            digitCount++;
        }
        drone.watch("digitCount", digitCount);
        drone.watch("digitSum", digitSum);
    }
}
