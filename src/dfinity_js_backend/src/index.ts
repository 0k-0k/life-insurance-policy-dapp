import {
  query,
  update,
  text,
  Record,
  StableBTreeMap,
  Variant,
  Vec,
  None,
  Some,
  Ok,
  Err,
  ic,
  Principal,
  Opt,
  nat64,
  Duration,
  Result,
  bool,
  Canister,
  init,
} from "azle";
import {
  Ledger,
  binaryAddressFromAddress,
  binaryAddressFromPrincipal,
  hexAddressFromPrincipal,
} from "azle/canisters/ledger";
//@ts-ignore
import { hashCode } from "hashcode";
import { v4 as uuidv4 } from "uuid";

const LifeInsurancePolicy = Record({
  id: text,
  policyHolderName: text,
  imageUrl: text,
  description: text,
  pricePerPolicy: nat64,
  policyStartDate: nat64,
  policyEndDate: nat64,
  coverageAmount: nat64,
  premiumAmount: nat64,
  isClaimed: bool,
  isReserved: bool,
  isAvailable: bool,
  currentReservedTo: Opt(Principal),
  currentReservationEnds: Opt(nat64),
  creator: Principal,
});

const PolicyPayload = Record({
  policyHolderName: text,
  imageUrl: text,
  description: text,
  pricePerPolicy: nat64,
  policyStartDate: nat64,
  policyEndDate: nat64,
  coverageAmount: nat64,
  premiumAmount: nat64,
  isClaimed: bool,
  
});

const InitPayload = Record({
  reservationFee: nat64,
});

const ReservationStatus = Variant({
  PaymentPending: text,
  Completed: text,
});

const BookPolicy = Record({
  policyId: text,
  amount: nat64,
  noOfPolicy: nat64,
  status: ReservationStatus,
  payer: Principal,
  paid_at_block: Opt(nat64),
  memo: nat64,
});

const Message = Variant({
  Booked: text,
  NotBooked: text,
  NotFound: text,
  NotOwner: text,
  InvalidPayload: text,
  PaymentFailed: text,
  PaymentCompleted: text,
});

const policyStorage = StableBTreeMap(0, text, LifeInsurancePolicy);
const persistedBookings = StableBTreeMap(1, Principal, BookPolicy);
const pendingBookings = StableBTreeMap(2, nat64, BookPolicy);

// fee to be charged upon policy reservation and refunded after policy is left
let reservationFee: Opt<nat64> = None;

const ORDER_RESERVATION_PERIOD = 120n; // reservation period in seconds

/* 
    initialization of the Ledger canister. The principal text value is hardcoded because 
    we set it in the `dfx.json`
*/
const icpCanister = Ledger(Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"));

export default Canister({
  // set reservation fee
  initData: init([InitPayload], (payload) => {
    reservationFee = Some(payload.reservationFee);
  }),

  // return policsie reservation fee
  getPolicies: query([], Vec(LifeInsurancePolicy), () => {
    return policyStorage.values();
  }),

  // return orders
  getBookings: query([], Vec(BookPolicy), () => {
    return persistedBookings.values();
  }),

  // return pending orders
  getPendings: query([], Vec(BookPolicy), () => {
    return pendingBookings.values();
  }),

  // return a particular policy
  getPolicy: query([text], Result(LifeInsurancePolicy, Message), (id) => {
    const policyOpt = policyStorage.get(id);
    if ("None" in policyOpt) {
      return Err({ NotFound: `policy with id=${id} not found` });
    }
    return Ok(policyOpt.Some);
  }),



// return policys based on name
getPolicyByPolicyHolderName: query([nat64], Result(Vec(LifeInsurancePolicy), Message), (name) => {
  const filteredPolicys = policyStorage.values().filter((policy) => policy.policyHolderName <= name);
  return Ok(filteredPolicys);
}),
// return policys based on claimed
getClaimedPolicy: query([nat64], Result(Vec(LifeInsurancePolicy), Message), (isClaimed) => {
  const filteredPolicys = policyStorage.values().filter((policy) => policy.isClaimed <= isClaimed);
  return Ok(filteredPolicys);
}),

// return policys based on start and end dates
getPolicyByDate: query([text, text], Result(Vec(LifeInsurancePolicy), Message), (policyStartDate, policyEndDate) => {
  const filteredPolicys = policyStorage.values().filter((policy) => 
  policy.policyStartDate === policyStartDate &&
  policy.policyEndDate === policyEndDate
  );
  return Ok(filteredPolicys);
}),

  // add new policy
  addPolicy: update([PolicyPayload], Result(LifeInsurancePolicy, Message), (payload) => {
    if (typeof payload !== "object" || Object.keys(payload).length === 0) {
      return Err({ NotFound: "invalid payoad" });
    }
    const policy = {
      id: uuidv4(),
      isReserved: false,
      isAvailable: true,
      currentReservedTo: None,
      currentReservationEnds: None,
      creator: ic.caller(),
      ...payload,
    };
    policyStorage.insert(policy.id, policy);
    return Ok(policy);
  }),

  // delete policy
  deletePolicy: update([text], Result(text, Message), (id) => {
    // check policy before deleting
    const policyOpt = policyStorage.get(id);
    if ("None" in policyOpt) {
      return Err({
        NotFound: `cannot delete the policy: policy with id=${id} not found`,
      });
    }

    if (policyOpt.Some.creator.toString() !== ic.caller().toString()) {
      return Err({ NotOwner: "only creator can delete policy" });
    }

    if (policyOpt.Some.isReserved) {
      return Err({
        Booked: `policy with id ${id} is currently booked`,
      });
    }
    const deletedpolicyOpt = policyStorage.remove(id);

    return Ok(deletedpolicyOpt.Some.id);
  }),

  // create order for policy reservation
  createReservationOrder: update(
    [text, nat64],
    Result(BookPolicy, Message),
    (id, noOfPolicy) => {
      const policyOpt = policyStorage.get(id);
      if ("None" in policyOpt) {
        return Err({
          NotFound: `cannot create the booking: policy=${id} not found`,
        });
      }

      if ("None" in reservationFee) {
        return Err({
          NotFound: "reservation fee not set",
        });
      }

      const policy = policyOpt.Some;

      if (policy.isReserved) {
        return Err({
          Booked: `policy with id ${id} is currently booked`,
        });
      }

      // calculate total amount to be spent plus reservation fee
      let amountToBePaid =
      noOfPolicy * policy.pricePerPolicy + reservationFee.Some;

      // generate order
      const booking = {
        policyId: policy.id,
        amount: amountToBePaid,
        noOfPolicy,
        status: { PaymentPending: "PAYMENT_PENDING" },
        payer: ic.caller(),
        paid_at_block: None,
        memo: generateCorrelationId(id),
      };

      pendingBookings.insert(booking.memo, booking);

      discardByTimeout(booking.memo, ORDER_RESERVATION_PERIOD);

      return Ok(booking);
    }
  ),

  // complete policy reservation
  completeReservation: update(
    [text, nat64, nat64, nat64],
    Result(BookPolicy, Message),
    async (id, noOfPolicy, block, memo) => {
      // get policy
      const policyOpt = policyStorage.get(id);
      if ("None" in policyOpt) {
        throw Error(`policy with id=${id} not found`);
      }

      const policy = policyOpt.Some;

      // check reservation fee is set
      if ("None" in reservationFee) {
        return Err({
          NotFound: "reservation fee not set",
        });
      }

      // calculate total amount to be spent plus reservation fee
      let amount = noOfPolicy * policy.pricePerPolicy + reservationFee.Some;

      // check payments
      const paymentVerified = await verifyPaymentInternal(
        ic.caller(),
        amount,
        block,
        memo
      );

      if (!paymentVerified) {
        return Err({
          NotFound: `cannot complete the purchase: cannot verify the payment, memo=${memo}`,
        });
      }

      const pendingBookingOpt = pendingBookings.remove(memo);
      if ("None" in pendingBookingOpt) {
        return Err({
          NotFound: `cannot complete the purchase: there is no pending booking with id=${id}`,
        });
      }

      const booking = pendingBookingOpt.Some;
      const updatedBooking = {
        ...booking,
        status: { Completed: "COMPLETED" },
        paid_at_block: Some(block),
      };

      // calculate noOfNights in minutes (testing)
      let durationInMins = BigInt(60 * 1000000000);

      // get updated record
      const updatedPolicy = {
        ...policy,
        currentReservedTo: Some(ic.caller()),
        isReserved: true,
        currentReservationEnds: Some(ic.time() + durationInMins),
      };

      policyStorage.insert(policy.id, updatedPolicy);
      persistedBookings.insert(ic.caller(), updatedBooking);
      return Ok(updatedBooking);
    }
  ),

  // end reservation and receive your refund
  // complete policy reservation
  endReservation: update([text], Result(Message, Message), async (id) => {
    // get policy
    const policyOpt = policyStorage.get(id);
    if ("None" in policyOpt) {
      return Err({ NotFound: `policy with id=${id} not found` });
    }

    const policy = policyOpt.Some;

    if (!policy.isReserved) {
      return Err({ NotBooked: "policy is not reserved" });
    }

    if ("None" in policy.currentReservationEnds) {
      return Err({ NotBooked: "reservation time not set" });
    }

    if (policy.currentReservationEnds.Some > ic.time()) {
      return Err({ Booked: "booking time not yet over" });
    }

    if ("None" in policy.currentReservedTo) {
      return Err({ NotBooked: "policy not reserved to anyone" });
    }

    if (policy.currentReservedTo.Some.toString() !== ic.caller().toString()) {
      return Err({ Booked: "only booker of policy can unbook" });
    }

    // check reservation fee is set
    if ("None" in reservationFee) {
      return Err({
        NotFound: "reservation fee not set",
      });
    }

    const result = await makePayment(ic.caller(), reservationFee.Some);

    if ("Err" in result) {
      return result;
    }

    // get updated record
    const updatedPolicy = {
      ...policy,
      currentReservedTo: None,
      isReserved: false,
      currentReservationEnds: None,
    };

    policyStorage.insert(policy.id, updatedPolicy);

    return result;
  }),

  // a helper function to get canister address from the principal
  getCanisterAddress: query([], text, () => {
    let canisterPrincipal = ic.id();
    return hexAddressFromPrincipal(canisterPrincipal, 0);
  }),

  // a helper function to get address from the principal
  getAddressFromPrincipal: query([Principal], text, (principal) => {
    return hexAddressFromPrincipal(principal, 0);
  }),

  // returns the reservation fee
  getReservationFee: query([], nat64, () => {
    if ("None" in reservationFee) {
      return BigInt(0);
    }
    return reservationFee.Some;
  }),
});

/*
    a hash function that is used to generate correlation ids for orders.
    also, we use that in the verifyPayment function where we check if the used has actually paid the order
*/
function hash(input: any): nat64 {
  return BigInt(Math.abs(hashCode().value(input)));
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};

// to process refund of reservation fee to users.
async function makePayment(address: Principal, amount: nat64) {
  const toAddress = hexAddressFromPrincipal(address, 0);
  const transferFeeResponse = await ic.call(icpCanister.transfer_fee, {
    args: [{}],
  });
  const transferResult = ic.call(icpCanister.transfer, {
    args: [
      {
        memo: 0n,
        amount: {
          e8s: amount - transferFeeResponse.transfer_fee.e8s,
        },
        fee: {
          e8s: transferFeeResponse.transfer_fee.e8s,
        },
        from_subaccount: None,
        to: binaryAddressFromAddress(toAddress),
        created_at_time: None,
      },
    ],
  });
  if ("Err" in transferResult) {
    return Err({ PaymentFailed: `refund failed, err=${transferResult.Err}` });
  }
  return Ok({ PaymentCompleted: "refund completed" });
}

function generateCorrelationId(productId: text): nat64 {
  const correlationId = `${productId}_${ic.caller().toText()}_${ic.time()}`;
  return hash(correlationId);
}

/*
    after the order is created, we give the `delay` amount of minutes to pay for the order.
    if it's not paid during this timeframe, the order is automatically removed from the pending orders.
*/
function discardByTimeout(memo: nat64, delay: Duration) {
  ic.setTimer(delay, () => {
    const order = pendingBookings.remove(memo);
    console.log(`Order discarded ${order}`);
  });
}

async function verifyPaymentInternal(
  sender: Principal,
  amount: nat64,
  block: nat64,
  memo: nat64
): Promise<bool> {
  const blockData = await ic.call(icpCanister.query_blocks, {
    args: [{ start: block, length: 1n }],
  });
  const tx = blockData.blocks.find((block) => {
    if ("None" in block.transaction.operation) {
      return false;
    }
    const operation = block.transaction.operation.Some;
    const senderAddress = binaryAddressFromPrincipal(sender, 0);
    const receiverAddress = binaryAddressFromPrincipal(ic.id(), 0);
    return (
      block.transaction.memo === memo &&
      hash(senderAddress) === hash(operation.Transfer?.from) &&
      hash(receiverAddress) === hash(operation.Transfer?.to) &&
      amount === operation.Transfer?.amount.e8s
    );
  });
  return tx ? true : false;
}
