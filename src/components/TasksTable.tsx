import { MathJax } from "better-react-mathjax";
import { EditableText } from "./EditableText";
import * as math from "mathjs";
import { Task, checkTask } from "../model";
import { Button, Tooltip } from "flowbite-react";
import { useState } from "react";


export function TaskTable(
    { currentTasks, onUpdate, className }: { currentTasks?: Array<Task>, onUpdate: (ts: Array<Task>) => void, className?: string }
) {
    const [tasks, setTasks] = useState<Array<Partial<Task>>>(currentTasks || []);

    // function complain() {
    //     console.log(`Why these ****ing scientists don't just write "WCET", "deadline", "period" and "offset"! I can NEVER remember these abbreviation!`);
    // }

    function updateTasks(tasks: Array<Partial<Task>>) {
        onUpdate(tasks.map(it => checkTask(it)).filter(it => it !== null) as Array<Task>);
        setTasks(tasks);
    }

    return (
        <div className={className}>
            <table className="mx-auto table-fixed">
                <thead>
                    <tr>
                        <th className="w-7"></th>
                        <th className="w-7" id="wcet-text">
                            <Tooltip content="WCET: Worst case executing time of the task">
                                <MathJax>{"\\(C_i\\)"}</MathJax>
                            </Tooltip>
                        </th>
                        <th className="w-7" id="deadline-text">
                            <Tooltip content="Deadline: Task should be done after this much time after being created">
                                <MathJax>{"\\(D_i\\)"}</MathJax>
                            </Tooltip>
                        </th>
                        <th className="w-7" id="period-text">
                            <Tooltip content="Period: How often does the task being created">
                                <MathJax>{"\\(T_i\\)"}</MathJax>
                            </Tooltip>
                        </th>
                        <th className="w-7" id="offset-text">
                            <Tooltip content="Offset: When does the task start for the first time">
                                <MathJax>{"\\(O_i\\)"}</MathJax>
                            </Tooltip></th>
                        <th className="w-7" id="utilization-text">
                            <Tooltip content="Utilization: The fraction of the processor’s capacity that is used for executing
                the task">
                                <MathJax>{"\\(U_i\\)"}</MathJax>
                            </Tooltip>
                        </th>
                        <th className="w-7"></th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map((task, index) => {
                        function updateTasksState(index: number, newTask: Partial<Task>) {
                            const newTasks = tasks.map((originTask, i) => (i === index) ? newTask : originTask);
                            updateTasks(newTasks);
                        }
                        return <tr key={`${index}-${task.wcet}-${task.deadline}-${task.period}-${task.offset}`}>
                            <td><MathJax dynamic>{`\\(τ_${index}\\)`}</MathJax></td>
                            <td><EditableText initialText={task.wcet?.toString() || ""} onBlur={value => {
                                const wcet = parseInt(value);
                                const newTask = { ...task, wcet };
                                updateTasksState(index, newTask);
                            }} /></td>
                            <td><EditableText initialText={task.deadline?.toString() || ""} onBlur={value => {
                                const deadline = parseInt(value);
                                const newTask = { ...task, deadline };
                                updateTasksState(index, newTask);
                            }} /></td>
                            <td><EditableText initialText={task.period?.toString() || ""} onBlur={value => {
                                const period = parseInt(value);
                                const newTask = { ...task, period };
                                updateTasksState(index, newTask);
                            }} /></td>
                            <td><EditableText initialText={task.offset?.toString() || ""} onBlur={value => {
                                const offset = parseInt(value);
                                const newTask = { ...task, offset };
                                updateTasksState(index, newTask);
                            }} /></td>
                            <td>{task.wcet !== null && task.period !== null ?
                                <MathJax dynamic>
                                    {`\\(${math.simplify(`${task.wcet} / ${task.period}`).toTex()}\\)`}
                                </MathJax> : <></>}</td>
                            <td>
                                <button
                                    className="cursor-pointer text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-2 py-1 me-2 mt-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none dark:focus:ring-red-800"
                                    onClick={
                                        () => updateTasks([...tasks.slice(0, index), ...tasks.slice(index + 1)])
                                    }>x</button>
                            </td>
                        </tr>
                    })}
                </tbody>
            </table>
            <Button className="mx-auto w-44 h-6" onClick={() => {
                updateTasks([...tasks, { wcet: 1, deadline: 1, period: 1, offset: 0 }])
            }}>+</Button>
        </div>
    )
}