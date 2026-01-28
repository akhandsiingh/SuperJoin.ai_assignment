import DataTable from "./components/DataTable";
import SyncStatus from "./components/SyncStatus";
import WebhookLog from "./components/WebhookLog";
import ConflictLog from "./components/ConflictLog";
import "./App.css";

function App() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Google Sheet ↔ MySQL Sync UI
      </h1>

      <SyncStatus />
      <DataTable />
      <WebhookLog />
      <ConflictLog />
    </div>
  );
}

export default App;
