import { Worker } from "node:worker_threads";
import { afterEach, expect, it, vi } from "vitest";
import { documentFromPdf } from "@cards/core/crawler";

afterEach(() => {
  vi.useRealTimers();
  vi.doUnmock("node:worker_threads");
});

it("terminates a CPU-stuck PDF parser while the main event loop remains responsive", async () => {
  let parser: Worker | undefined;
  vi.doMock("node:worker_threads", () => ({
    Worker: vi.fn(function () {
      // Stand in for a font parser stuck in synchronous work on a bad PDF.
      const worker = new Worker("while (true) {}", { eval: true });
      parser = worker;
      return worker;
    }),
  }));
  vi.useFakeTimers();
  const rejected = expect(
    documentFromPdf("https://example.com/stuck.pdf", Buffer.from("%PDF")),
  ).rejects.toThrow("PDF parsing timed out");
  try {
    await vi.waitFor(() => expect(parser).toBeDefined());
    const exited = new Promise<void>((resolve) => parser!.once("exit", () => resolve()));
    await vi.advanceTimersByTimeAsync(20_000);
    await rejected;
    await exited;
    expect(parser!.threadId).toBe(-1);
  } finally {
    await parser?.terminate();
  }
});
