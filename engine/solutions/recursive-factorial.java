public class Strategy {
    public void run(Drone drone, Farm farm) {
        int result = factorial(5);
        drone.watch("result", result);
    }

    int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }
}
