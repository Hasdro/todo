import TodoApp from './components/TodoApp';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center">
      <TodoApp />
    </main>
  );
}
