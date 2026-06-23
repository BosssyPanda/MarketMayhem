public class Strategy {
    public void run(Drone drone, Farm farm) {
        int[] levels = farm.prices();
        int needCharge = 0;
        int chargedTotal = 0;
        for (int i = 0; i < levels.length; i++) {
            if (levels[i] < 50) {
                needCharge++;
            } else {
                chargedTotal += levels[i];
            }
        }
        boolean allCharged = needCharge == 0;
        drone.watch("needCharge", needCharge);
        drone.watch("chargedTotal", chargedTotal);
        drone.watch("allCharged", allCharged);
    }
}
