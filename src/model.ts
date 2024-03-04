export interface Task {
    wcet: number,
    deadline: number,
    period: number,
    offset: number
}

export function checkTask(task: Partial<Task>): Task | null {
    if (task.wcet === null || task.deadline === null || task.period === null || task.offset === null) {
        return null;
    } else if (task.wcet! > task.deadline!) {
        return null;
    }
    return task as Task;
}
