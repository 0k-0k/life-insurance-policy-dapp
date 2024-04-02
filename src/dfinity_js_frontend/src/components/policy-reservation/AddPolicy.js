import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { Button, FloatingLabel, Form, Modal } from "react-bootstrap";
import { LoadingButton } from "@mui/lab";

// import { stringToMicroAlgos } from "../../utils/conversions";

const addPolicy = ({ createNewPolicy, loading }) => {
  const [policyHolderName, setPolicyHolderName] = useState("");
  const [imageUrl, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [policyStartDate, setPolicyStartDate] = useState("");
  const [policyEndDate, setPolicyEndDate] = useState("");
  const [pricePerPolicy, setPrice] = useState(0);
  const [coverageAmount, setCoverageAmount] = useState(0);
  const [premiumAmount, setPremiumAmount] = useState(0);
  const [isClaimed, setIsClaimed] = useState(false); // Initial state (unchecked)

  const isFormFilled = useCallback(() => {
    return (
      policyHolderName &&
      imageUrl &&
      description &&
      policyStartDate &&
      policyEndDate &&
      coverageAmount &&
      premiumAmount &&
      pricePerPolicy > 0
    );
  }, [
    policyHolderName,
    imageUrl,
    description,
    policyStartDate,
    policyEndDate,
    pricePerPolicy,
    coverageAmount,
    premiumAmount,
  ]);

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleChange = (event) => {
    setIsClaimed(event.target.checked);
  };

  return (
    <>
      <Button
        onClick={handleShow}
        variant="dark"
        className="rounded-pill px-0"
        style={{ width: "38px" }}
      >
        <i className="bi bi-plus"></i>
      </Button>
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>New Policy</Modal.Title>
        </Modal.Header>
        <Form>
          <Modal.Body>
            <FloatingLabel
              controlId="inputName"
              label="Policy holder name"
              className="mb-3"
            >
              <Form.Control
                type="text"
                onChange={(e) => {
                  setPolicyHolderName(e.target.value);
                }}
                placeholder="Enter Policy Holder Name"
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputUrl"
              label="Image URL"
              className="mb-3"
            >
              <Form.Control
                type="text"
                placeholder="Image URL"
                value={imageUrl}
                onChange={(e) => {
                  setImage(e.target.value);
                }}
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputDescription"
              label="Description"
              className="mb-3"
            >
              <Form.Control
                as="textarea"
                placeholder="description"
                style={{ height: "80px" }}
                max={115}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputPolicyStartDate"
              label="PolicyStartDate"
              className="mb-3"
            >
              <Form.Control
                type="date"
                placeholder="policyStartDate"
                style={{ height: "80px" }}
                max={115}
                onChange={(e) => {
                  setPolicyStartDate(e.target.value);
                }}
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputPolicyEndDate"
              label="PolicyEndDate"
              className="mb-3"
            >
              <Form.Control
                type="date"
                placeholder="policyEndDate"
                style={{ height: "80px" }}
                max={115}
                onChange={(e) => {
                  setPolicyEndDate(e.target.value);
                }}
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputPrice"
              label="Price Per Policy in ICP"
              className="mb-3"
            >
              <Form.Control
                type="number"
                placeholder="Price"
                onChange={(e) => {
                  setPrice(e.target.value);
                }}
              />
            </FloatingLabel>

            <FloatingLabel
              controlId="inputPrice"
              label="Coverage Amount"
              className="mb-3"
            >
              <Form.Control
                type="number"
                placeholder="Amount"
                onChange={(e) => {
                  setCoverageAmount(e.target.value);
                }}
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputPrice"
              label="Premium Amount"
              className="mb-3"
            >
              <Form.Control
                type="number"
                placeholder="Amount"
                onChange={(e) => {
                  setPremiumAmount(e.target.value);
                }}
              />
            </FloatingLabel>

            <div>
              <label>
                <input
                  className="margin-10"
                  type="checkbox"
                  checked={isClaimed} // Set checked based on state
                  onChange={handleChange}
                />
                Check if Claimed
              </label>
            </div>
          </Modal.Body>
        </Form>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose}>
            Close
          </Button>
          <Button
            variant="dark"
            disabled={!isFormFilled()}
            onClick={() => {
              createNewPolicy({
                policyHolderName,
                imageUrl,
                description,
                pricePerPolicy,
                policyStartDate,
                policyEndDate,
                isClaimed,
                coverageAmount,
                premiumAmount,
              });
              handleClose();
            }}
          >
            Save new Policy
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

// {
//   coverageAmount: nat64;
//   premiumAmount: nat64;
//   policyHolderName: text;
// }

addPolicy.propTypes = {
  createNewPolicy: PropTypes.func.isRequired,
};

export default addPolicy;
