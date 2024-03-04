import { Accordion, List } from "flowbite-react";
import { Task } from "../model";
import { failedIcon, notApplicableIcon, passedIcon } from "../components/Icons";
import { MathJax } from "better-react-mathjax";
import { firstFailedDeadline, simulateSchedule } from "../schedule/scheduleSimulator";
import { TimingDiagram } from "../components/TimingDiagram";
import _ from "lodash";
import { lcm } from "../util";

function responseTimeTest(tasks: Array<Task>): [boolean, Array<string>] {
    const results = [];
    const withId = tasks.map((task, id) => { return { ...task, id } });
    const ordered = _.reverse(_.sortBy(withId, task => -task.deadline));
    for (const [taskIndex, task] of ordered.entries()) {
        let lastIterResult = task.wcet;
        results.push(`R_${task.id}^0=C_${task.id}=${lastIterResult} \\le D_${task.id}=${task.deadline}`);
        if (taskIndex !== 0) {
            let currentIterIndex = 1;
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

    return <Accordion>
        <Accordion.Panel>
            <Accordion.Title>
                {
                    (!testApplicable) ?
                        <>
                            {notApplicableIcon}
                            <span className="ml-1">Joseph and Pandya Test —— Not Applicable</span>
                        </> : testPass ?
                            <>
                                {passedIcon}
                                <span className="ml-1">Joseph and Pandya Test —— Passed</span>
                            </>
                            : <>
                                {failedIcon}
                                <span className="ml-1">Joseph & Pandya Test —— Failed </span>
                            </>
                }
            </Accordion.Title>
            <Accordion.Content>
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
                {testApplicable ? <>
                    {
                        testText.map(t => <MathJax key={t}>{`\\(${t}\\)`}</MathJax>)
                    }
                </> : <></>}
            </Accordion.Content>
        </Accordion.Panel>
        <Accordion.Panel>
            <Accordion.Title>
                {
                    failedDeadline ?
                        <>
                            {failedIcon}
                            <span className="ml-1">Hyper Period Analysis —— Failed </span>
                        </> :
                        <>
                            {passedIcon}
                            <span className="ml-1">Hyper Period Analysis —— Passed </span>
                        </>
                }
            </Accordion.Title>
            <Accordion.Content>
                <MathJax>{`\\(LCM\\{${tasks.map(task => task.period).join(",")}\\}=${lcm(tasks.map(task => task.period))}\\)`}</MathJax>
                <TimingDiagram tasks={tasks} runningRecords={runningRecords} />
            </Accordion.Content>
        </Accordion.Panel>
    </Accordion>
}