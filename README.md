# reshuffle-monday-salesforce-example

[Code](https://github.com/reshufflehq/reshuffle-monday-salesforce-example) |
[npm](https://www.npmjs.com/package/reshuffle-monday-salesforce-example)

`npm install reshuffle-monday-salesforce-example`

### Reshuffle Monday + Salesforce Example

This example uses [Resshufle](https://github.com/reshufflehq/reshuffle) to
synchronize account details between Salesforce and a Monday workspace.

The code listens to events from Monday tracking changes to an accounts
workspace and to events from Salesforce tracking changes to account
names or phone numbers. Per each event, the code updates the other system
with the new data.

#### Connectors

This example uses:

* [Reshuffle Monday Connector](https://github.com/reshufflehq/reshuffle-monday-connector)

* [Reshuffle Salesforce Connector](https://github.com/reshufflehq/reshuffle-salesforce-connector)

Please follow their respective documentation to set up connections to
Monday and Salesforce.

#### Seup

Salesforce has the account data structure built in.

In order to set up Monday, create a new workspace with the name *Accounts*.
Add to the first group two text columns: "Name" and "Phone".

#### Usage

First install the example and start the Reshuffle server:

```bash
npm install reshuffle-monday-salesforce-example
npm run start
```

This will start a web server at local port 8000. You can use

```bash
curl localhost:8000/copy-to-monday
```

to copy all accounts from Salesforce to Monday.

Make changes to either Monday or Salesforce to see them reflected in the
other system.
