import { useState } from 'react'
import './App.css'
import { MathJaxContext } from 'better-react-mathjax'
import { TaskTable } from './components/TasksTable';
import { Task } from './model';
import { Tabs } from 'flowbite-react';
import { EDF } from './pages/EDF';
import { RM } from './pages/RM';
import { DM } from './pages/DM';

function App() {
  const [tasks, setTasks] = useState<Array<Task>>([]);

  return (
    <MathJaxContext version={3}>
      <main className="bg-white text-black p-4 w-screen h-full min-h-screen">
        <h1 className="text-2xl font-bold text-center">Scheduling Lab</h1>
        <TaskTable
          className={"mb-4"}
          currentTasks={tasks}
          onUpdate={newTasks => setTasks([...newTasks])}
        />
        <Tabs className={"shadow-md rounded"} aria-label="Default tabs" style="fullWidth">
          <Tabs.Item title="EDF">
            {
              tasks.length > 0 ?
                <EDF tasks={tasks} />
                :
                <></>
            }
          </Tabs.Item>
          <Tabs.Item title="RM">
            {
              tasks.length > 0 ?
                <RM tasks={tasks} />
                :
                <></>
            }
          </Tabs.Item>
          <Tabs.Item title="DM">
            {
              tasks.length > 0 ?
                <DM tasks={tasks} />
                :
                <></>
            }
          </Tabs.Item>
        </Tabs>
      </main>
    </MathJaxContext>
  )
}

export default App
