import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AddPolicy from "./AddPolicy";
import Policy from "./Policy";
import Loader from "../utils/Loader";
import { NotificationError, NotificationSuccess } from "../utils/Notifications";
import {
  getPolicies as getPolicyList,
  getReservationFee as getFee,
  addPolicy as addPolicy,
  makeReservation as makeReservationAction,
  endReservation as endReservationAction,
  deletePolicy as deletepolicyAction,
} from "../../utils/policy";
import PropTypes from "prop-types";
import { Row } from "react-bootstrap";
import { formatE8s } from "../../utils/conversions";

const Policies = ({ fetchBalance }) => {
  const [policies, setPolicies] = useState([]);
  const [reservationFee, setReservationFee] = useState(0);
  const [loading, setLoading] = useState(false);

  const getPolicies = async () => {
    setLoading(true);
    getPolicyList()
      .then((policies) => {
        if (policies) {
          setPolicies(policies);
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally((_) => {
        setLoading(false);
      });
  };

  const getReservationFee = async () => {
    setLoading(true);
    getFee()
      .then((fee) => {
        if (fee) {
          setReservationFee(fee);
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally((_) => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getPolicies();
    getReservationFee();
  }, []);

  const createNewPolicy = async (data) => {
    setLoading(true);
    const priceStr = data.pricePerPolicy;
    data.pricePerPolicy = parseInt(priceStr, 10) * 10 ** 8;

    let arg = {
      policyHolderName: data.policyHolderName,
      imageUrl: data.imageUrl,
      description: data.description,
      pricePerPolicy: BigInt(data.pricePerPolicy),

      policyStartDate: BigInt(new Date(data.policyStartDate).getTime()),
      policyEndDate: BigInt(new Date(data.policyEndDate).getTime()),
      isClaimed: data.isClaimed,
      coverageAmount: BigInt(data.coverageAmount),
      premiumAmount: BigInt(data.premiumAmount),
    };

    addPolicy(arg)
      .then(() => {
        toast(<NotificationSuccess text="Policy added successfully." />);
        getPolicies();
        fetchBalance();
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text="Failed to create policy." />);
        setLoading(false);
      });
  };

  const makeReservation = async (policy, noOfPolicy) => {
    setLoading(true);
    makeReservationAction(policy, noOfPolicy)
      .then(() => {
        toast(<NotificationSuccess text="Reservation made successfully" />);
        getPolicies();
        fetchBalance();
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text="Failed to make reservation." />);
        setLoading(false);
      });
  };

  const endReservation = async (id) => {
    setLoading(true);
    endReservationAction(id)
      .then(() => {
        toast(<NotificationSuccess text="Reservation ended successfully" />);
        getPolicies();
        fetchBalance();
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text="Failed to end reservation." />);
        setLoading(false);
      });
  };

  const deletePolicy = async (id) => {
    setLoading(true);
    deletepolicyAction(id)
      .then(() => {
        toast(<NotificationSuccess text="Policy deleted successfully" />);
        getPolicies();
        fetchBalance();
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text="Failed to delete policy." />);
        setLoading(false);
      });
  };

  if (loading) {
    return <Loader />;
  }
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-4 fw-bold mb-0 ">Life Insurance Policy Dapp </h1>
        <AddPolicy createNewPolicy={createNewPolicy} />
      </div>
      <div className="mb-3">
        <i className="bi bi-bell-fill"></i> Holding fee for any reservation is{" "}
        {formatE8s(reservationFee)} ICP.
      </div>
      <Row xs={1} sm={2} lg={3} className="g-3 mb-5 g-xl-4 g-xxl-5">
        <>
          {policies.map((policy, index) => (
            <Policy
              policy={policy}
              makeReservation={makeReservation}
              endReservation={endReservation}
              deletePolicy={deletePolicy}
              key={index}
            />
          ))}
        </>
      </Row>
    </>
  );
};

Policies.propTypes = {
  fetchBalance: PropTypes.func.isRequired,
};

export default Policies;
