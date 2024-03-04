import _ from "lodash";
import { Task } from "../model";

export interface RunningRecord {
    task_id: number,
    round: number,
    startTime: number,
    // exclusive
    endTime: number,
}

export function firstFailedDeadline(
    tasks: Array<Task>,
    runningRecords: Array<RunningRecord>
): { id: number, round: number } | null {
    const maxEndTime = _.max(runningRecords.map(runningRecord => runningRecord.endTime));
    const absoluteDeadlines: Array<{ id: number, round: number, deadline: number }> = [];
    tasks.forEach((task, id) => {
        const taskAbsoluteDeadlines = _.range(task.offset + task.deadline, maxEndTime, task.period);
        taskAbsoluteDeadlines.forEach((taskDeadline, round) => {
            absoluteDeadlines.push({ id, round, deadline: taskDeadline });
        });
    });
    absoluteDeadlines.sort((a, b) => a.deadline - b.deadline);
    for (const { id, round, deadline } of absoluteDeadlines) {
        const lastCorrespondingRunning = _.maxBy(
            runningRecords
                .filter(running => running.task_id === id && running.round === round),
            running => running.endTime
        );
        if (lastCorrespondingRunning === undefined || lastCorrespondingRunning.endTime > deadline) {
            return { id, round }
        }
    }
    return null;
}

class RunningTask {
    public nextOrCurrentRound: number = 0;
    public thisRoundRemainingWCET: number | null = null;
    constructor(
        public id: number,
        public task: Task
    ) {
    }

    baselineAtRound(round: number) {
        return this.task.offset + this.task.period * round;
    }

    deadlineAtRound(round: number) {
        return this.task.offset + this.task.deadline + this.task.period * round;
    }

    waitForNext() {
        this.thisRoundRemainingWCET = null;
        this.nextOrCurrentRound++;
    }

    execute(): boolean {
        if (this.thisRoundRemainingWCET === null) {
            this.thisRoundRemainingWCET = this.task.wcet;
        }
        this.thisRoundRemainingWCET -= 1;
        return this.thisRoundRemainingWCET === 0;
    }

    ready(time: number) {
        return this.thisRoundRemainingWCET ?
            true :
            this.baselineAtRound(this.nextOrCurrentRound) <= time;
    }
}

function simulate(
    tasks: Array<Task>,
    endTime: number,
    highestPriorityIn: (tasks: Array<RunningTask>) => RunningTask | undefined
): Array<RunningRecord> {
    const runningTasks = tasks.map((task, id) => new RunningTask(id, task));
    const result: Array<RunningRecord> = [];
    for (let time = 0; time < endTime; ++time) {
        const readyTasks = runningTasks.filter(it => it.ready(time));
        const toRun = highestPriorityIn(readyTasks);
        const done = toRun?.execute();
        const lastResult = _.last(result);
        if (lastResult && lastResult.task_id === toRun?.id && lastResult.round === toRun?.nextOrCurrentRound) {
            lastResult.endTime++;
        } else if (toRun) {
            result.push({
                task_id: toRun.id,
                round: toRun.nextOrCurrentRound,
                startTime: time,
                endTime: time + 1
            });
        }
        if (done) {
            toRun?.waitForNext();
        }
    }
    return result;
}

function edfPriority(tasks: Array<RunningTask>): RunningTask | undefined {
    return _.minBy(tasks, task => task.deadlineAtRound(task.nextOrCurrentRound));
}

function rmPriority(tasks: Array<RunningTask>): RunningTask | undefined {
    return _.minBy(tasks, task => task.task.period);
}

function dmPriority(tasks: Array<RunningTask>): RunningTask | undefined {
    return _.minBy(tasks, task => task.task.deadline);
}

export function simulateSchedule(algorithm: "EDF" | "RM" | "DM", tasks: Array<Task>, endTime: number): Array<RunningRecord> {
    switch (algorithm) {
        case "EDF":
            return simulate(tasks, endTime, edfPriority);
        case "RM":
            return simulate(tasks, endTime, rmPriority);
        case "DM":
            return simulate(tasks, endTime, dmPriority);
    }
}