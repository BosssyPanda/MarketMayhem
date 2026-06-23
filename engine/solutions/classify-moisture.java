public class Strategy {
    public void run(Drone drone, Farm farm) {
        int[] m = farm.moisture();
        String status0;
        if (m[0] < 30) status0 = "DRY";
        else if (m[0] < 70) status0 = "OK";
        else status0 = "WET";
        String status1;
        if (m[1] < 30) status1 = "DRY";
        else if (m[1] < 70) status1 = "OK";
        else status1 = "WET";
        String status2;
        if (m[2] < 30) status2 = "DRY";
        else if (m[2] < 70) status2 = "OK";
        else status2 = "WET";
        drone.watch("status0", status0);
        drone.watch("status1", status1);
        drone.watch("status2", status2);
    }
}
