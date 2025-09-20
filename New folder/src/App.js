// import Board from "./components/Board";
// import Toolbar from "./components/Toolbar";
// import Toolbox from "./components/Toolbox";
// import BoardProvider from "./store/BoardProvider";
// import ToolboxProvider from "./store/ToolboxProvider";
import React, { useState, useEffect } from 'react';


function App() {
  const [data, setData] = useState(null);

    useEffect(() => {
        fetch('http://localhost:3030/api/register')
            .then(response => response.json())
            .then(data => setData(data))
            .catch(error => console.error('Error fetching data:', error));
    }, []);
  return (
    // <BoardProvider>
    //   <ToolboxProvider>
    //     <Toolbar />
    //     <Board />
    //     <Toolbox />
    //   </ToolboxProvider>
    // </BoardProvider>
    <div>
      <h1>whitebord</h1>
      <p>{data?data.message:'Loading...'}</p>
    </div>
  );
}

export default App;
