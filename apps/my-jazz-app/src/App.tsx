import { JazzProvider, useAll, useLocalFirstAuth } from "jazz-tools/react";

import { app } from "../schema.js";
import { TodoList } from "./TodoList.js";

function QuerySubscriptionsProbe(): null {
  useAll(app.todos.limit(1), {
    propagation: "full",
    tier: "edge",
  });

  return null;
}

function TodoApp(): React.ReactElement | null {
  const { secret, isLoading } = useLocalFirstAuth();

  if (isLoading === true || secret === undefined || secret === null || secret.length === 0) {
    return null;
  }

  return (
    <JazzProvider
      config={{
        appId: import.meta.env.VITE_JAZZ_APP_ID,
        serverUrl: import.meta.env.VITE_JAZZ_SERVER_URL,
        secret,
      }}
    >
      <QuerySubscriptionsProbe />
      <h1>Todos</h1>
      <TodoList />
    </JazzProvider>
  );
}

export default function App() {
  return <TodoApp />;
}
