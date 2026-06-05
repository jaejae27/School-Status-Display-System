import { SchoolType, ScheduleItem } from "../types";

export function calculateSchedule(
  schoolType: SchoolType,
  startTime: string,
  includeAssembly: boolean,
  assemblyTime: string
): ScheduleItem[] {
  const schedule: ScheduleItem[] = [];
  const duration = schoolType === "elementary" ? 40 : schoolType === "middle" ? 45 : 50;
  const breakDuration = 10;

  let current = startTime;

  function addMinutes(time: string, mins: number): string {
    const [h, m] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, 0);
    date.setMinutes(date.getMinutes() + mins);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  // 조회 (Assembly)
  if (includeAssembly) {
    const assemblyEnd = addMinutes(assemblyTime, 15); // Adjust as needed
    schedule.push({ name: "조회", startTime: assemblyTime, endTime: assemblyEnd });
  }

  let periodStartTime = startTime;
  for (let i = 1; i <= 7; i++) {
    const periodEndTime = addMinutes(periodStartTime, duration);
    schedule.push({
      name: `${i}교시`,
      startTime: periodStartTime,
      endTime: periodEndTime,
    });
    
    // Check for Lunch (suggesting after 4th period)
    if (i === 4) {
      const lunchStartTime = periodEndTime;
      const lunchEndTime = addMinutes(lunchStartTime, 50); // Lunch 50 min
      schedule.push({ name: "점심", startTime: lunchStartTime, endTime: lunchEndTime });
      periodStartTime = lunchEndTime;
    } else {
      periodStartTime = addMinutes(periodEndTime, breakDuration);
    }
  }

  // 청소 (Cleaning)
  const lastPeriodEnd = schedule[schedule.length - 1].endTime;
  schedule.push({ name: "청소", startTime: lastPeriodEnd, endTime: addMinutes(lastPeriodEnd, 20) });

  return schedule;
}
