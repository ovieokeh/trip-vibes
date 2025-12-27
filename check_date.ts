const start = new Date("2025-06-01");
const end = new Date("2025-06-03");
const dayCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
console.log("Start:", start);
console.log("End:", end);
console.log("Diff:", end.getTime() - start.getTime());
console.log("DayCount:", dayCount);
