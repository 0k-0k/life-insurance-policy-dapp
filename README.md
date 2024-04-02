# Life Insurance Policy 

Introducing the Life Insurance Policy Management System, a groundbreaking solution revolutionizing insurance management. With robust CRUD operations, this system simplifies customer data management, policy creation, and claims processing. Seamlessly create, view, and update policies with user-friendly frontend interfaces, enhancing efficiency and accessibility. Empower insurers and policyholders alike with streamlined processes and reliable service delivery. Elevate your insurance management experience with the Life Insurance Policy Management System.


## How to deploy canisters

- Start the Local Internet Computer

    ```bash
    dfx start --background --clean
    ```

    ```bash
    npm install
    ```

- Deploy the Ledger Canister

    ```bash
    npm run deploy-ledger
    ```

- Deploy the Internet Identity Canister

    ```bash
    npm run deploy-identity
    ```

- Deploy the Backend Canister

    ```bash
	# run with dfx and set the registrationFee in e8s

	dfx deploy dfinity_js_backend --argument '(record {registrationFee <amount in e8s> })'

	# or run using npm with preset values
	# registraionFee = 2_0000_0000 i.e 2 ICP tokens
	sudo apt update
    npm run deploy-backend

    ```

- Deploy the Frontend Canister

    ```bash
    npm run deploy-frontend
    ```

- Run Frontend Locally

    ```bash
    npm run start
    ```

## Minting Tokens to your account

This next step shows how to mint icp tokens from the locally deployed Ledger canister.

- Copy your dfx address from the wallet on the doc reg frontend.

    ![gettokens](./img/mint.png)

- Run the mint script.

    ```bash
    # npm run mint:tokens <amount in e8s> <dfx address>
   npm run mint:tokens 5000_0000_0000 4eecc7740bf73f27f68c9f9703adbee7dc41dd1e1a5e316bbff039806550bd79

	# N/B: This mints 5000 ICP tokens from the locally deployed ledger to the address.
    ```
