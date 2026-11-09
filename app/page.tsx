import { ToolNav } from "./_components/ToolNav";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-24">
      <h1 className="sr-only">Wizard Tuner</h1>
      <ToolNav />
    </main>
  );
}
