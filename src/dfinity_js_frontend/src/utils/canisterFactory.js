import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory as policyIDL } from "../../../declarations/dfinity_js_backend/dfinity_js_backend.did.js";
import { idlFactory as ledgerIDL } from "../../../declarations/ledger_canister/ledger_canister.did.js";

const POLICY_CANISTER_ID = "bd3sg-teaaa-aaaaa-qaaba-cai";
const LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const HOST = "http://localhost:8080";

export async function getPolicyCanister() {
  return await getCanister(POLICY_CANISTER_ID, policyIDL);
}

export async function getLedgerCanister() {
  return getCanister(LEDGER_CANISTER_ID, ledgerIDL);
}

async function getCanister(canisterId, idl) {
  const authClient = window.auth.client;
  const agent = new HttpAgent({
    host: HOST,
    identity: authClient.getIdentity(),
  });
  await agent.fetchRootKey(); // this line is needed for the local env only
  return Actor.createActor(idl, {
    agent,
    canisterId,
  });
}
