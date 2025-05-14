import { useEffect } from 'react';

function App() {
  useEffect(() => {
    fetch('http://localhost:5000/api/ping')
      .then((res) => res.text())
      .then((data) => console.log(data))
      .catch((err) => console.error('Error:', err));
  }, []);

  return <h1>Hello from React</h1>;
}

export default App;
