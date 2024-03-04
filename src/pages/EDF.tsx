import { Accordion, List } from "flowbite-react";
import { Task } from "../model";
import * as math from "mathjs";
import { failedIcon, notApplicableIcon, passedIcon } from "../components/Icons";
import { MathJax } from "better-react-mathjax";
import { firstFailedDeadline, simulateSchedule } from "../schedule/scheduleSimulator";
import { TimingDiagram } from "../components/TimingDiagram";
import _ from "lodash";
import { lcm } from "../util";

interface ProcessorDemandResult {
    l: number;
    taskProcessorDemand: Array<[number, string]>;
}

function decideLMax(tasks: Task[], u: number): [number, Array<string>] {
    const result = [];
    let lMax;
    const lLCM = lcm(tasks.map(task => task.period));
    result.push(`L_{LCM} 
        = LCM \\{${tasks.map((_, id) => `T_${id}`).join(',')}\\} 
        = LCM \\{${tasks.map(task => `${task.period}`).join(',')}\\}
        = ${lLCM}
        `);
    if (u < 1) {
        result.push(`U < 1, L_{max} = min\\{L_{LCM}, L_{BRH}\\}`);
        const lStar = (_.sumBy(tasks, task => (task.period - task.deadline) * (task.wcet / task.period)))
            /
            (1 - u);
        result.push(`L^* = \\frac {Σ(T_i-D_i)U_i} {1-U} = 
            \\frac
            {${tasks.map(task => `(${task.period}-${task.deadline}) × ${task.wcet / task.period}`).join('+')}}
            {1-${u}} = ${lStar}`);
        const lBRH = Math.max(lStar, ...tasks.map(task => task.deadline));
        result.push(`L_{BRH} = max\\{${tasks.map((_, index) => `D_${index}`).join(',')}, L^*\\}
            = max \\{ ${tasks.map(task => `${task.deadline}`).join(',')}, ${lStar} \\}
            = ${lBRH}`);
        lMax = Math.min(lLCM, lBRH);
        result.push(`L_{max} 
            = min\\{L_{LCM}, L_{BRH}\\}
            = min\\{${lLCM}, ${lBRH}\\}
            = ${lMax}`);
    } else {
        lMax = lLCM;
        result.push(`U ≥ 1, L_{max} = L_{LCM} = ${lMax}`);
    }
    return [lMax, result];
}

function BRHTest(tasks: Array<Task>): [Array<string>, Array<ProcessorDemandResult>] {
    const result = [];
    const processorDemandResults: Array<ProcessorDemandResult> = [];

    const u = tasks.map(task => task.wcet / task.period).reduce((a, b) => a + b, 0);
    const calculateU = "U = Σ_{i=1}^{n}(\\frac {C_i} {T_i}) = " +
        tasks.map(task => math.simplify(`${task.wcet} / ${task.period}`).toTex())
            .join("+") + ((tasks.length > 1) ? `= ${u}` : "");
    result.push(calculateU);

    const [lMax, lMaxResult] = decideLMax(tasks, u);
    result.push(...lMaxResult);
    let allK = [];
    for (let i = 0; i < tasks.length; ++i) {
        const task = tasks[i];
        const k = _.range(task.deadline, lMax + 1, task.period);
        result.push(`K_${i} = \\{D_${i}^k | D_${i}^k = kT_${i} + D_${i}, D_${i}^k ≤ ${lMax}, k=${k.map((_, index) => `${index}`).join(',')} \\}
            = \\{${k.map(it => `${it}`).join(',')}\\}`);
        allK.push(...k);
    }
    allK.sort();
    allK = _.sortedUniq(allK);
    result.push(`K = \\{${allK.map(it => `${it}`).join(',')}\\}`);
    for (const l of allK) {
        const taskProcessorDemand: Array<[number, string]> = tasks.map(task => {
            const result = (Math.floor((l - task.deadline) / task.period) + 1) * task.wcet;
            return [result, `(⌊\\frac {${l} - ${task.deadline}} {${task.period}}⌋+1)⋅${task.wcet} = ${result}`]
        });
        processorDemandResults.push({ l, taskProcessorDemand });
    }
    return [result, processorDemandResults];
}

export function EDF({ tasks }: { tasks: Array<Task> }) {
    const identicalOffset = tasks.every(task => task.offset === tasks[0].offset);
    const deadlineEqualsToPeriod = tasks.every(task => task.deadline === task.period);
    const deadlineLessEqualToPeriod = tasks.every(task => task.deadline <= task.period);
    const u = tasks.map(task => task.wcet / task.period).reduce((a, b) => a + b, 0);
    const calculateU = "U = Σ_{i=1}^{n}(\\frac {C_i} {T_i}) = " +
        tasks.map(task => math.simplify(`${task.wcet} / ${task.period}`).toTex())
            .join("+") + ((tasks.length > 1) ? `= ${u}` : "");
    const liuLaylandTestApplicable = identicalOffset && deadlineEqualsToPeriod;
    const liuLaylandTestPass = u <= 1;

    const brhTestApplicable = identicalOffset && deadlineLessEqualToPeriod;
    const brhTestResult = BRHTest(tasks);
    const brhTestPass = brhTestResult[1]
        .every(result => _.sumBy(result.taskProcessorDemand, d => d[0]) <= result.l);

    const runningRecords = simulateSchedule("EDF", tasks, lcm(tasks.map(task => task.period)));
    const failedDeadline = firstFailedDeadline(tasks, runningRecords);

    return <Accordion>
        <Accordion.Panel>
            <Accordion.Title>
                {
                    (!liuLaylandTestApplicable) ?
                        <>
                            {notApplicableIcon}
                            <span className="ml-1">Liu and Layland Test —— Not Applicable</span>
                        </> : liuLaylandTestPass ?
                            <>
                                {passedIcon}
                                <span className="ml-1">Liu and Layland Test —— Passed</span>
                            </>
                            : <>
                                {failedIcon}
                                <span className="ml-1">Liu & Layland Test —— Failed </span>
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
                        {deadlineEqualsToPeriod ? passedIcon : failedIcon}
                        <span>Task deadline equals the period</span>
                    </List.Item>
                </List>
                {liuLaylandTestApplicable ? <>
                    <MathJax dynamic>{`\\(${calculateU}\\)`}</MathJax>
                    {
                        u <= 1 ? <>
                            <MathJax>{`\\(U \\leq 1\\)`}</MathJax>
                            <p className="text-green-400">Test passed</p>
                        </> : <>
                            <MathJax>{`\\(U > 1\\)`}</MathJax>
                            <p className="text-red-400">Test fail</p>
                        </>
                    }
                </> : <></>}
            </Accordion.Content>
        </Accordion.Panel>
        <Accordion.Panel>
            <Accordion.Title>
                {
                    (!brhTestApplicable) ?
                        <>
                            {notApplicableIcon}
                            <span className="ml-1">Baruah, Rosier and Layland Test —— Not Applicable</span>
                        </> : brhTestPass ?
                            <>
                                {passedIcon}
                                <span className="ml-1">Baruah, Rosier and Layland Test —— Passed</span>
                            </>
                            : <>
                                {failedIcon}
                                <span className="ml-1">Baruah, Rosier and Layland Test —— Failed </span>
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
                        {deadlineLessEqualToPeriod ? passedIcon : failedIcon}
                        <span>Task deadline does not exceed the period</span>
                    </List.Item>
                </List>
                {
                    brhTestApplicable ?
                        <>
                            {brhTestResult[0].map(r => <MathJax>{`\\(${r}\\)`}</MathJax>)}
                            <table className="border border-sky-500">
                                <thead className="border-b border-sky-500">
                                    <th className="p-2">L</th>
                                    {tasks.map((_, i) => <th className="p-2 border-l border-sky-500"><MathJax>{`\\(N_${i}^L⋅C_${i}\\)`}</MathJax></th>)}
                                    <th className="p-2 border-l border-sky-500"><MathJax>{"\\(C_P(0, L)\\)"}</MathJax></th>
                                    <th className="p-2 border-l border-sky-500"><MathJax>{"\\(C_P(0, L) ≤ L\\)"}</MathJax></th>
                                </thead>
                                <tbody>
                                    {brhTestResult[1].map(result => {
                                        return <tr>
                                            <td className="p-2 border-l border-sky-500">{result.l}</td>
                                            {result.taskProcessorDemand.map(([_, process]) => <td className="p-2 border-l border-sky-500"><MathJax>{`\\(${process}\\)`}</MathJax></td>)}
                                            <td className="p-2 border-l border-sky-500">
                                                <MathJax>
                                                    {"\\(" +
                                                        result.taskProcessorDemand.map(([n, _]) => n).join("+") +
                                                        "=" +
                                                        _.sumBy(result.taskProcessorDemand, ([n, _]) => n) +
                                                        "\\)"}
                                                </MathJax>
                                            </td>
                                            <td className="p-2 border-l border-sky-500">
                                                {_.sumBy(result.taskProcessorDemand, ([n, _]) => n) <= result.l ?
                                                    <span className="text-green-500">OK</span> :
                                                    <span className="text-red-500">Not OK</span>
                                                }
                                            </td>
                                        </tr>
                                    })}
                                </tbody>
                            </table>
                        </> :
                        <></>
                }
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