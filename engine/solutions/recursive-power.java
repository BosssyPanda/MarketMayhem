public class Strategy {
    public void run(Drone drone, Farm farm) {
        int result = power(2, 6);
        drone.watch("result", result);
    }

    int power(int base, int exp) {
        if (exp == 0) return 1;
        return base * power(base, exp - 1);
    }
}
