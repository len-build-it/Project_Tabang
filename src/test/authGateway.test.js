import { describe, expect, it, vi } from "vitest";
import { createAuthGateway } from "../services/auth/authGateway.js";

function rejectedClient() {
  const refusal = Object.assign(new Error("refused"), {
    status: 401,
    code: "invalid_credentials",
  });

  return {
    get: vi.fn().mockResolvedValue(null),
    post: vi.fn().mockRejectedValue(refusal),
  };
}

async function observedGateway(client) {
  const gateway = createAuthGateway({ client });
  const listener = vi.fn();
  const onPending = vi.fn();

  gateway.observeSession(listener, { onPending });
  await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));

  return { gateway, listener, onPending };
}

/*
 * A refused sign-in or sign-up must not announce a pending session. Before
 * this, the gateway announced "pending" before the request and never settled
 * it, so one wrong password replaced the sign-in form with "Checking your
 * session" for good, and the error message was never shown.
 */
describe("auth gateway pending state", () => {
  it("leaves the session settled after a refused sign-in", async () => {
    const { gateway, listener, onPending } = await observedGateway(
      rejectedClient(),
    );
    const pendingBefore = onPending.mock.calls.length;

    await expect(
      gateway.signIn({ email: "maria@example.test", password: "wrong" }),
    ).rejects.toMatchObject({ code: "invalid_credentials" });

    expect(onPending).toHaveBeenCalledTimes(pendingBefore);
    expect(listener).toHaveBeenLastCalledWith(null);
  });

  it("leaves the session settled after a refused sign-up", async () => {
    const { gateway, onPending } = await observedGateway(rejectedClient());
    const pendingBefore = onPending.mock.calls.length;

    await expect(
      gateway.register({
        email: "maria@example.test",
        password: "flood-ready-2026",
        displayName: "Maria Santos",
        phone: "09171234567",
        barangay: "Poblacion",
      }),
    ).rejects.toMatchObject({ code: "invalid_credentials" });

    expect(onPending).toHaveBeenCalledTimes(pendingBefore);
  });

  it("announces the new session as pending once the sign-in is accepted", async () => {
    const client = {
      get: vi.fn().mockResolvedValue(null),
      post: vi.fn().mockResolvedValue({ ok: true }),
    };
    const { gateway, onPending } = await observedGateway(client);
    const pendingBefore = onPending.mock.calls.length;

    await gateway.signIn({ email: "maria@example.test", password: "right" });

    expect(onPending.mock.calls.length).toBeGreaterThan(pendingBefore);
  });
});
