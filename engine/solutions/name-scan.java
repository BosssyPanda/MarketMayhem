public class Strategy {
    public void run(Drone drone, Farm farm) {
        String[] names = farm.crops();
        int withR = 0;
        int totalLetters = 0;
        for (int i = 0; i < names.length; i++) {
            totalLetters += names[i].length();
            boolean hasR = false;
            for (int j = 0; j < names[i].length(); j++) {
                if (names[i].charAt(j) == 'R') {
                    hasR = true;
                }
            }
            if (hasR) {
                withR++;
            }
        }
        drone.watch("withR", withR);
        drone.watch("totalLetters", totalLetters);
    }
}
