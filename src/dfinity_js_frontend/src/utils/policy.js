import { transferICP } from "./ledger";

export async function getPolicies() {
  try {
    return await window.canister.policy.getPolicies();
  } catch (err) {
    if (err.name === "AgentHTTPResponseError") {
      const authClient = window.auth.client;
      await authClient.logout();
    }
    return [];
  }
}
export async function getBookings() {
  try {
    return await window.canister.policy.getBookings();
  } catch (err) {
    if (err.name === "AgentHTTPResponseError") {
      const authClient = window.auth.client;
      await authClient.logout();
    }
    return [];
  }
}

export async function getPendings() {
  try {
    return await window.canister.policy.getPendings();
  } catch (err) {
    if (err.name === "AgentHTTPResponseError") {
      const authClient = window.auth.client;
      await authClient.logout();
    }
    return [];
  }
}

export async function getReservationFee() {
  try {
    return await window.canister.policy.getReservationFee();
  } catch (err) {
    if (err.name === "AgentHTTPResponseError") {
      const authClient = window.auth.client;
      await authClient.logout();
    }
    return [];
  }
}

export async function addPolicy(policy) {
  const result = await window.canister.policy.addPolicy(policy);

  if (result.Err) {
    let error = Object.entries(result.Err);
    let errorMsg = `${error[0][0]} : ${error[0][1]}`;
    throw new Error(errorMsg);
  }

  return result.Ok;
}

// correct this function
export async function makeReservation(id, noOfPolicy) {
  const policyCanister = window.canister.policy;
  const orderResponse = await policyCanister.createReservationOrder(
    id,
    noOfPolicy
  );
  if (orderResponse.Err) {
    let error = Object.entries(orderResponse.Err);
    let errorMsg = `${error[0][0]} : ${error[0][1]}`;
    throw new Error(errorMsg);
  }
  const canisterAddress = await policyCanister.getCanisterAddress();
  const block = await transferICP(
    canisterAddress,
    orderResponse.Ok.amount,
    orderResponse.Ok.memo
  );
  const result = await policyCanister.completeReservation(
    id,
    noOfPolicy,
    block,
    orderResponse.Ok.memo
  );
  if (result.Err) {
    let error = Object.entries(result.Err);
    let errorMsg = `${error[0][0]} : ${error[0][1]}`;
    throw new Error(errorMsg);
  }
  return result.Ok;
}

export async function endReservation(id) {
  const result = await window.canister.policy.endReservation(id);
  if (result.Err) {
    let error = Object.entries(result.Err);
    let errorMsg = `${error[0][0]} : ${error[0][1]}`;
    throw new Error(errorMsg);
  }

  return result.Ok;
}

export async function deletePolicy(id) {
  const result = await window.canister.policy.deletePolicy(id);
  if (result.Err) {
    let error = Object.entries(result.Err);
    let errorMsg = `${error[0][0]} : ${error[0][1]}`;
    throw new Error(errorMsg);
  }
  return result.Ok;
}
export async function getPolicy(id) {
  const result = await window.canister.policy.getPolicy(id);
  if (result.Err) {
    let error = Object.entries(result.Err);
    let errorMsg = `${error[0][0]} : ${error[0][1]}`;
    throw new Error(errorMsg);
  }
  return result.Ok;
}
