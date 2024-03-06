import _ from "lodash";
import { useRef, useState } from "react";
import { Task } from "../model";
import { RunningRecord, firstFailedDeadline } from "../schedule/scheduleSimulator";

const GRID_SIZE = 30;

const TaskColors = [
    "#00FF99",
    "#6633CC",
    "#CC99CC",
    "#FF66CC",
    "#3399CC",
    "#FFCC99"
];

export function TimingDiagram({ tasks, runningRecords, maxX }:
    { tasks: Array<Task>, runningRecords: Array<RunningRecord>, maxX: number }) {
    const missedDeadline = firstFailedDeadline(tasks, runningRecords);

    const [dashedLineX, setDashedLineX] = useState(0);
    const container = useRef<SVGSVGElement>(null);
    const id = _.uniqueId();
    function transformY(y: number): number {
        return (tasks.length + 1) * GRID_SIZE * 2 - y * GRID_SIZE;
    }
    function transformX(x: number): number {
        return x * GRID_SIZE + GRID_SIZE * 2;
    }
    function moveDashedLine(event: { clientX: number; }) {
        const rect = container.current!.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        setDashedLineX(mouseX);
    }

    return <div className="overflow-scroll">
        <svg
            ref={container}
            width={maxX * GRID_SIZE + GRID_SIZE * 4}
            height={tasks.length * GRID_SIZE * 2 + GRID_SIZE * 4}
            xmlns="http://www.w3.org/2000/svg"
            onMouseMove={moveDashedLine}
        >
            <defs>
                <marker id={`arrow-${id}`} markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,5 L5,2.5 Z" fill="black" />
                </marker>
                <marker id={`arrow-green-${id}`} markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,5 L5,2.5 Z" fill="rgb(0, 255, 51)" />
                </marker>
                <marker id={`arrow-red-${id}`} markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,5 L5,2.5 Z" fill="red" />
                </marker>
            </defs>
            {/* x axis */}
            <line x1={transformX(-2)}
                y1={transformY(0)}
                x2={transformX(maxX + 1)}
                y2={transformY(0)}
                style={{ stroke: "black", strokeWidth: 1, markerEnd: `url(#arrow-${id})` }}
            />
            {/* y axis */}
            <line x1={transformX(0)}
                y1={transformY(-1)}
                x2={transformX(0)}
                y2={transformY(tasks.length * 2 + 1)}
                style={{ stroke: "black", strokeWidth: 1, markerEnd: `url(#arrow-${id})` }}
            />
            {/* scale */}
            {_.range(maxX + 1).map(x =>
                <line key={`scale-${x}`} x1={transformX(x)} y1={transformY(-0.1)} x2={transformX(x)} y2={transformY(0.1)}
                    style={{ stroke: "black", strokeWidth: 1 }} />
            )}
            {/* 5, 10, 15, 20, etc */}
            {_.range(5, maxX + 1, 5).map(x =>
                <text key={`scale-${x}`} x={transformX(x - 0.15)} y={transformY(-0.75)}>{x}</text>
            )}
            {/* task names */}
            {_.range(tasks.length).map(y =>
                <text key={`task-${y}`}
                    x={transformX(-0.75)}
                    y={transformY(y * 2 + 0.5)}
                    fontSize="20"
                    style={{ stroke: "black", strokeWidth: 1 }} >
                    τ<tspan dy="10" fontSize="10">{y}</tspan>
                </text>
            )}
            {_.range(tasks.length).map((y, index) => {
                if (index % 2 !== tasks.length % 2) {
                    return <rect
                        key={`bg-${index}`}
                        x={transformX(0)}
                        y={transformY(y * 2 + 2)}
                        width={GRID_SIZE * maxX}
                        height={GRID_SIZE * 2}
                        fill="grey"
                        opacity="0.1"
                    ></rect>
                } else {
                    return <></>
                }
            }
            )}
            {/* offset arrows */}
            {tasks.map((task, index) => {
                return _.range(task.offset, maxX + 1, task.period)
                    .map(time =>
                        <line key={`offset-arrow-${index}-${time}`}
                            x1={transformX(time)}
                            y1={transformY(index * 2 + 1)}
                            x2={transformX(time)}
                            y2={transformY(index * 2 + 1.5)}
                            style={{ stroke: "rgb(0, 255, 51)", strokeWidth: 1, markerEnd: `url(#arrow-green-${id})` }} />
                    );
            })}
            {/* deadline arrows */}
            {tasks.map((task, index) => {
                return _.range(task.offset + task.deadline, maxX + 1, task.period)
                    .map(time =>
                        <line key={`deadline-arrow-${index}-${time}`}
                            x1={transformX(time)}
                            y1={transformY(index * 2 + 1.5)}
                            x2={transformX(time)}
                            y2={transformY(index * 2 + 1)}
                            style={{ stroke: "red", strokeWidth: 1, markerEnd: `url(#arrow-red-${id})` }} />
                    );
            })}
            {/* missed deadline rect */}
            {missedDeadline ? <rect
                x={transformX(
                    tasks[missedDeadline.id].offset +
                    tasks[missedDeadline.id].period * missedDeadline.round +
                    tasks[missedDeadline.id].deadline - 0.25)}
                y={transformY(missedDeadline.id * 2 + 2)}
                width={GRID_SIZE / 2}
                height={GRID_SIZE * 1.5}
                fill="red"
                opacity="0.3"
            ></rect> : <></>}
            {/* schedule rects */}
            {runningRecords.map(schedule =>
                <g
                    key={`schedule-${schedule.task_id}-${schedule.startTime}-${schedule.endTime}-${schedule.round}`}
                    transform={`translate(${transformX(schedule.startTime)},${transformY(schedule.task_id * 2 + 1)})`}>
                    <rect
                        x="0" y="-1"
                        width={GRID_SIZE * (schedule.endTime - schedule.startTime)}
                        height={GRID_SIZE}
                        fill={TaskColors[schedule.task_id % TaskColors.length]}
                        stroke={TaskColors[schedule.task_id % TaskColors.length]}
                        strokeOpacity="1"
                        opacity="0.5"
                    ></rect>
                    <text x={GRID_SIZE * (schedule.endTime - schedule.startTime) / 2}
                        y={GRID_SIZE / 2 + 2}
                        dominantBaseline="middle"
                        textAnchor="middle"
                    >{schedule.round}</text>
                </g>
            )}
            <line x1={dashedLineX} y1="0" x2={dashedLineX} y2={tasks.length * GRID_SIZE * 2 + GRID_SIZE * 4}
                style={{ stroke: "black", strokeWidth: 1, strokeDasharray: "5,5" }} />
        </svg>
    </div>
}