import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Badge,
  Button,
  Card,
  Col,
  FloatingLabel,
  Form,
  Stack,
} from "react-bootstrap";
import {
  truncateAddress,
  convertTime,
  formatE8s,
} from "../../utils/conversions";
import Identicon from "../utils/Identicon";
import { Principal } from "@dfinity/principal";
import { deletePolicy } from "../../utils/policy";

const Policy = ({ policy, makeReservation, endReservation, deletePolicy }) => {
  const {
    id,
    name,
    imageUrl,
    description,
    policyHolderName,
    PolicyStartDate,
    PolicyEndDate,
    pricePerPolicy,
    currentReservedTo,
    currentReservationEnds,
    isReserved,
    creator,
    isClaimed,
  } = policy;
  const [noOfPolicy, setNoOfPolicy] = useState(1);
  const principal = window.auth.principalText;
  const isCreator = () => Principal.from(creator).toString() === principal;

  const reservationEnded = () => {
    let now = new Date();
    let endTime = new Date(Number(currentReservationEnds[0] / BigInt(10 ** 6)));
    return now >= endTime;
  };

  const gradientClass = isClaimed ? "bg-gradient-blue" : "bg-gradient-yellow";

  function formatDate(timestamp) {
    // Create a new Date object from the timestamp
    const date = new Date(timestamp);

    // Use the toLocaleDateString() method for a user-friendly format
    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return formattedDate;
  }

  return (
    <Col key={id}>
      <Card className={gradientClass}>
        <Card.Header>
          <Stack direction="horizontal" gap={2}>
            <span className="font-monospace text-secondary">
              {currentReservedTo.length > 0 ? (
                truncateAddress(Principal.from(currentReservedTo[0]).toString())
              ) : (
                <></>
              )}
              {policyHolderName}
            </span>
            <Badge bg="secondary" className="ms-auto">
              {isClaimed ? "CLAIMED" : "UNCLAIMED"}
            </Badge>
          </Stack>
        </Card.Header>
        <div className="ratio ratio-4x3">
          <img src={imageUrl} alt={name} style={{ objectFit: "cover" }} />
        </div>
        <Card.Body className="d-flex flex-column text-center">
          <Card.Title>{policyHolderName}</Card.Title>
          <Card.Text className="flex-grow-1">
            Description : {description}
          </Card.Text>
          <Card.Text className="flex-grow-1">
            Policy Start Date : {formatDate(PolicyStartDate)}
          </Card.Text>
          <Card.Text className="flex-grow-1">
            Policy End Date :{formatDate(PolicyEndDate)}
          </Card.Text>
          <Card.Text className="flex-grow-1">
            {currentReservationEnds.length > 0
              ? `Reservation ends: ${convertTime(currentReservationEnds[0])}`
              : ""}
          </Card.Text>
          <Form className="d-flex align-content-stretch flex-row gap-2">
            {Principal.from(
              currentReservedTo[0] ? currentReservedTo[0] : creator
            ).toString() === principal && isReserved ? (
              <Button
                variant="outline-dark"
                onClick={() => endReservation(id)}
                disabled={!reservationEnded()}
                className="w-100 py-3"
              >
                End Reservation
              </Button>
            ) : isReserved ? (
              <>
                <Button
                  variant="outline-dark"
                  disabled={isReserved}
                  className="w-100 py-3"
                >
                  Reserved
                </Button>
              </>
            ) : (
              <></>
            )}
            {isCreator() && (
              <Button
                variant="outline-danger"
                onClick={() => deletePolicy(id)}
                className="btn"
              >
                <i className="bi bi-trash"></i>
              </Button>
            )}
          </Form>
        </Card.Body>
      </Card>
    </Col>
  );
};

Policy.propTypes = {
  policy: PropTypes.instanceOf(Object).isRequired,
  makeReservation: PropTypes.func.isRequired,
  endReservation: PropTypes.func.isRequired,
  deletePolicy: PropTypes.func.isRequired,
};

export default Policy;
