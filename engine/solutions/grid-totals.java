public class Strategy {
    public void run(Drone drone, Farm farm) {
        int[][] g = farm.grid();
        int gridSum = 0;
        int gridMax = g[0][0];
        for (int r = 0; r < g.length; r++) {
            for (int c = 0; c < g[r].length; c++) {
                gridSum += g[r][c];
                if (g[r][c] > gridMax) {
                    gridMax = g[r][c];
                }
            }
        }
        drone.watch("gridSum", gridSum);
        drone.watch("gridMax", gridMax);
    }
}
