public class Strategy {
    public void run(Drone drone, Farm farm) {
        int packsTwenty = packs(20);
        int packsFortyFive = packs(45);
        drone.watch("packsTwenty", packsTwenty);
        drone.watch("packsFortyFive", packsFortyFive);
    }

    int packs(int crops) {
        return crops / 6;
    }
}
