import { MathJax } from "better-react-mathjax";
import { Task } from "../model";
import { RunningRecord } from "../schedule/scheduleSimulator";
import { TimingDiagram } from "./TimingDiagram";
import { lcm } from "../util";

export function HyperPeriodAnalysis({ runningRecords, tasks }: { runningRecords: Array<RunningRecord>, tasks: Array<Task> }) {
    return <>
        <MathJax dynamic>{`\\(LCM\\{${tasks.map(task => task.period).join(",")}\\}=${lcm(tasks.map(task => task.period))}\\)`}</MathJax>
        <TimingDiagram tasks={tasks} runningRecords={runningRecords} maxX={lcm(tasks.map(task => task.period))} />
        <div>
            {runningRecords.map(record => <MathJax dynamic inline key={record.startTime}>{`\\((τ_${record.taskId},${record.startTime},${record.endTime})\\)`}</MathJax>)}
        </div>
    </>
}