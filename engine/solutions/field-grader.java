public class Strategy {
    public void run(Drone drone, Farm farm) {
        int score = farm.moisture()[0];
        String grade;
        if (score >= 90) grade = "A";
        else if (score >= 80) grade = "B";
        else if (score >= 70) grade = "C";
        else grade = "F";
        String action;
        if (grade.equals("A") || grade.equals("B")) action = "HARVEST";
        else action = "WAIT";
        drone.watch("grade", grade);
        drone.watch("action", action);
    }
}
