import {useEffect, useState} from "react";
import './App.scss';
let { ipcRenderer } = window.require("electron");

function App() {
  const [jobs, setJobs] = useState([])
  const [search, setSearch] = useState("")
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
      <header>
        <form onSubmit={() => scrapJobs()}>
          <input type="text" placeholder="Seach" value={search}/>
          <button style={{ cursor: 'pointer' }}>
            Go
          </button>
        </form>
      </header>
      
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
