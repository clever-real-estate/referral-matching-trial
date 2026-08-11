import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AgentQueuePage from "../pages/AgentQueuePage";
import type { Identity } from "../types";
import { makeOffer, stubFetch } from "./fixtures";

const carol: Identity = {
  username: "agent.carol",
  token: "tok-agent.carol",
  role: "agent",
  display_name: "Carol Fixture",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

test("renders the agent's open offers", async () => {
  vi.stubGlobal("fetch", stubFetch({ "/api/offers/mine/": { body: [makeOffer()] } }));

  render(<AgentQueuePage identity={carol} />);

  expect(await screen.findByText("Casey Example")).toBeInTheDocument();
  expect(screen.getByText("CO 80202")).toBeInTheDocument();
  expect(screen.getByText("$550k")).toBeInTheDocument();
  expect(screen.getByText(/Hot — ready now/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /claim referral/i })).toBeInTheDocument();
});

test("shows an empty state when there are no offers", async () => {
  vi.stubGlobal("fetch", stubFetch({ "/api/offers/mine/": { body: [] } }));

  render(<AgentQueuePage identity={carol} />);

  expect(await screen.findByText(/no open offers right now/i)).toBeInTheDocument();
});

test("claiming an offer calls the claim endpoint", async () => {
  const fetchMock = stubFetch({
    "/api/offers/mine/": { body: [makeOffer()] },
    "/api/offers/1/claim/": { body: { status: "claimed", claim_id: 1, referral_id: 11 } },
  });
  vi.stubGlobal("fetch", fetchMock);

  render(<AgentQueuePage identity={carol} />);
  await userEvent.click(await screen.findByRole("button", { name: /claim referral/i }));

  await waitFor(() => {
    const calls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(calls).toContain("/api/offers/1/claim/");
  });
  expect(screen.queryByText("Casey Example")).not.toBeInTheDocument();
});

test("shows an error state when the queue cannot load", async () => {
  vi.stubGlobal(
    "fetch",
    stubFetch({ "/api/offers/mine/": { status: 500, body: { detail: "boom" } } })
  );

  render(<AgentQueuePage identity={carol} />);

  expect(await screen.findByText(/could not load your queue/i)).toBeInTheDocument();
});
