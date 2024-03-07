import { Accordion, List } from "flowbite-react";
import { Task } from "../model";
import { failedIcon, passedIcon } from "../components/Icons";
import { MathJax } from "better-react-mathjax";
import { firstFailedDeadline, simulateSchedule } from "../schedule/scheduleSimulator";
import _ from "lodash";
import { lcm } from "../util";
import { HyperPeriodAnalysis } from "../components/HyperPeriodAnalysis";
import { TestResult } from "../components/TestResult";

function responseTimeTest(tasks: Array<Task>): [boolean, Array<string>] {
    const results = [];
    const withId = tasks.map((task, id) => { return { ...task, id } });
    const ordered = _.reverse(_.sortBy(withId, task => -task.deadline));
    for (const [taskIndex, task] of ordered.entries()) {
        let lastIterResult = task.wcet;
        results.push(`R_${task.id}^0=C_${task.id}=${lastIterResult} \\le D_${task.id}=${task.deadline}, OK`);
        if (taskIndex !== 0) {
            let currentIterIndex = 1;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                let thisIterResult = task.wcet;
                let thisIterResultText = `R_${task.id}^${currentIterIndex} = C_{${task.id}}`;
                let thisIterResultNumber = `${task.wcet}`;
                for (const higherPriorityTaskIndex of _.range(taskIndex)) {
                    const higherPriorityTask = ordered[higherPriorityTaskIndex];
                    thisIterResultText += `+⌈ \\frac {R_${task.id}^${currentIterIndex - 1}} {T_${higherPriorityTask.id}} ⌉⋅C_{${higherPriorityTask.id}}`;
                    thisIterResultNumber += `+⌈ \\frac {${lastIterResult}} {${higherPriorityTask.period}} ⌉⋅${higherPriorityTask.wcet}`;
                    thisIterResult += Math.ceil(lastIterResult / higherPriorityTask.period) * higherPriorityTask.wcet;
                }
                results.push(
                    [thisIterResultText, thisIterResultNumber, `${thisIterResult}`].join("=")
                );
                if (thisIterResult > task.deadline) {
                    results.push(
                        `${thisIterResult} > D_${task.id}=${task.deadline}\\text{, Not OK}`
                    );
                    return [false, results];
                } else if (thisIterResult === lastIterResult) {
                    results.push(
                        `\\text{Convergence,} ${thisIterResult} ≤ D_${task.id}=${task.deadline}\\text{, OK}`
                    );
                    break;
                }
                lastIterResult = thisIterResult;
                currentIterIndex++;
            }
        }
    }
    return [true, results];
}

export function DM({ tasks }: { tasks: Array<Task> }) {
    const identicalOffset = tasks.every(task => task.offset === tasks[0].offset);
    const deadlineNotExceedPeriod = tasks.every(task => task.deadline <= task.period);

    const testApplicable = identicalOffset && deadlineNotExceedPeriod;

    const runningRecords = simulateSchedule("DM", tasks, lcm(tasks.map(task => task.period)));
    const failedDeadline = firstFailedDeadline(tasks, runningRecords);
    const [testPass, testText] = responseTimeTest(tasks);

    return <Accordion alwaysOpen>
        <Accordion.Panel>
            <Accordion.Title>
                <TestResult name="Response time analysis/Joseph and Pandya Test" applicable={testApplicable} passed={testPass} />
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
                            {deadlineNotExceedPeriod ? passedIcon : failedIcon}
                            <span>Task deadline does not exceed the period</span>
                        </List.Item>
                    </List>
                </div>
                {testApplicable ? <div className="overflow-scroll">
                    {
                        testText.map(t => <MathJax dynamic key={t}>{`\\(${t}\\)`}</MathJax>)
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