"use client";
import { Button } from "../../components/ui";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="panel" role="alert">
      <h1>Could not load data</h1>
      <p className="muted">
        Check database connectivity and migrations, then try again. Detailed
        errors are in the server logs.
      </p>
      <Button onClick={reset}>Try again</Button>
    </section>
  );
}
