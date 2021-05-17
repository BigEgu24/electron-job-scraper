import {useEffect, useState} from "react";
import './App.css';
let { ipcRenderer } = window.require("electron");

function App() {
  const [jobs, setJobs] = useState([])
  useEffect(() => {
    ipcRenderer.on("child", (event, jobListing) => {
      setJobs(jobListing)
    })
  }, [])
  console.log(jobs)
  const scrapJobs = () => {
    ipcRenderer.send('child', 'Full Stack Developer')
  }
  
  return (
    <div className="App">
      <button style={{ cursor: 'pointer' }} onClick={() => scrapJobs()}>
        Click Me!
      </button>
      {
        jobs.map((job, index) => {
          return(
          <div key={index}>
            <h3>
              {job.role}
            </h3>
            <br />
          </div>
          )
        })
      }
    </div>
  );
}

export default App;
