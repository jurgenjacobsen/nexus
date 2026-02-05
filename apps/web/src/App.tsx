import { useCallStore } from '@repo/client-core';

function App() {
  const { inCall, startCall } = useCallStore();
  return (
    <button onClick={startCall}>
      {inCall ? "In Call..." : "Call Kitchen"}
    </button>
  );
}
export default App;