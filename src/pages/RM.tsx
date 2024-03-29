import { Accordion, List } from "flowbite-react";
import { Task } from "../model";
import * as math from "mathjs";
import { failedIcon, passedIcon } from "../components/Icons";
import { MathJax } from "better-react-mathjax";
import { firstFailedDeadline, simulateSchedule } from "../schedule/scheduleSimulator";
import { lcm } from "../util";
import { HyperPeriodAnalysis } from "../components/HyperPeriodAnalysis";
import { TestResult } from "../components/TestResult";

export function RM({ tasks }: { tasks: Array<Task> }) {
    const identicalOffset = tasks.every(task => task.offset === tasks[0].offset);
    const deadlineEqualsToPeriod = tasks.every(task => task.deadline === task.period);
    const u = tasks.map(task => task.wcet / task.period).reduce((a, b) => a + b, 0);
    const uRM = tasks.length * (Math.pow(2, 1 / tasks.length) - 1);
    const calculateU = "U = Σ_{i=1}^{n}(\\frac {C_i} {T_i}) = " +
        tasks.map(task => math.simplify(`${task.wcet} / ${task.period}`).toTex())
            .join("+") + ((tasks.length > 1) ? `= ${u.toFixed(3)}` : "");
    const calculateURM = `U_{RM} = n (2^{\\frac 1 n} - 1) = ${tasks.length} (2^{\\frac 1 {${tasks.length}}} - 1) = ${uRM.toFixed(3)}`;

    const testApplicable = identicalOffset && deadlineEqualsToPeriod;
    const testPass = u <= uRM;

    const runningRecords = simulateSchedule("RM", tasks, lcm(tasks.map(task => task.period)));
    const failedDeadline = firstFailedDeadline(tasks, runningRecords);

    return <Accordion alwaysOpen>
        <Accordion.Panel>
            <Accordion.Title>
                <TestResult name="Liu and Layland Test" applicable={testApplicable} passed={testPass || null} />
            </Accordion.Title>
            <Accordion.Content>
                <div className="border rounded-md relative p-4 mb-3">
                    <span className="absolute -top-3 left-2 bg-white text-gray-400">Applicable?</span>
                    <List unstyled>
                        <List.Item>
                            {identicalOffset ? passedIcon : failedIcon}
                            <span>All tasks have identical offsets</span>
                        </List.Item>
                        <List.Item>
                            {deadlineEqualsToPeriod ? passedIcon : failedIcon}
                            <span>Task deadline equals the period</span>
                        </List.Item>
                    </List>
                </div>
                {testApplicable ? <div className="overflow-scroll">
                    <MathJax dynamic>{`\\(${calculateU}\\)`}</MathJax>
                    <MathJax dynamic>{`\\(${calculateURM}\\)`}</MathJax>
                    {
                        u <= uRM ? <>
                            <MathJax>{`\\(U \\leq U_{RM}\\)`}</MathJax>
                            <p className="text-green-400">Test passed</p>
                        </> : <>
                            <MathJax>{`\\(U > U_{RM}\\)`}</MathJax>
                            <p className="text-yellow-400">Test fail</p>
                            <p>Note Liu and Layland Test for RM scheduling algorithm is sufficient but not necessary, so the task set may still be schedulable, please continue doing Hyper Period Analysis.</p>
                        </>
                    }
                </div> : <></>}
            </Accordion.Content>
        </Accordion.Panel>
        <Accordion.Panel>
            <Accordion.Title>
                <TestResult name="Hyper Period Analysis" applicable={true} passed={!failedDeadline} />
            </Accordion.Title>
            <Accordion.Content>
                <HyperPeriodAnalysis runningRecords={runningRecords} tasks={tasks} />
            </Accordion.Content>
        </Accordion.Panel>
    </Accordion>
}