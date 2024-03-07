import { cannotDecideIcon, failedIcon, notApplicableIcon, passedIcon } from "./Icons";

export function TestResult({ name, applicable, passed }: { name: string, applicable: boolean, passed: boolean | null }) {
    if (!applicable) {
        return <>
            {notApplicableIcon}
            <span className="ml-1">{name} —— Not Applicable</span>
        </>
    } else if (passed == null) {
        return <>
            {cannotDecideIcon}
            <span className="ml-1">{name} —— Cannot Decide </span>
        </>
    } else if (passed) {
        return <>
            {passedIcon}
            <span className="ml-1">{name} —— Passed</span>
        </>
    } else {
        return <>
            {failedIcon}
            <span className="ml-1">{name} —— Failed </span>
        </>
    }
}