
// src/lib/helpers/projectStatus.ts
import { Project, Update } from "@prisma/client";

// Mocking types if generation failed, but in real app they come from @prisma/client
type ProjectStatus = "Overdue" | "Due Soon" | "On Track";

export function computeProjectStatus(lastUpdate: Date | null, frequency: "WEEKLY" | "FORTNIGHTLY" | "MONTHLY"): ProjectStatus {
    if (!lastUpdate) return "Overdue";

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastUpdate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (frequency) {
        case "WEEKLY":
            return diffDays > 7 ? "Overdue" : diffDays > 5 ? "Due Soon" : "On Track";
        case "FORTNIGHTLY":
            return diffDays > 14 ? "Overdue" : diffDays > 12 ? "Due Soon" : "On Track";
        case "MONTHLY":
            return diffDays > 30 ? "Overdue" : diffDays > 27 ? "Due Soon" : "On Track";
        default:
            return "On Track";
    }
}
