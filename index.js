const { HttpConnector, FileStoreAdapter, Reshuffle } = require('reshuffle')
const { SalesforceConnector } = require('reshuffle-salesforce-connector')
const { MondayConnector } = require('reshuffle-monday-connector')

const app = new Reshuffle()
app.setPersistentStore(new FileStoreAdapter('./DATABASE'))

const http = new HttpConnector(app)

const monday = new MondayConnector(app, {
  token: process.env.MONDAY_API_TOKEN,
  baseURL: process.env.RESHUFFLE_RUNTIME_BASE_URL,
})

const sf = new SalesforceConnector(app, {
  clientId: process.env.SALESFORCE_CLIENT_ID,
  clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
  baseURL: process.env.RESHUFFLE_RUNTIME_BASE_URL,
  encryptionKey: process.env.RESHUFFLE_ENCRYPTION_KEY,
})

;(async () => {

  // Change this to use the appropriate board name for your setup
  const boardName = 'Accounts'
  const boardId = await monday.getBoardIdByName(boardName)
  if (!boardId) {
    throw new Error(`Monday board not found: ${boardName}`)
  }

  // Create a new account item in Monday
  async function createMondayAccount(account) {
    console.log('Creting new Monday account:', account.Name)
    await monday.createItem(boardId, account.Id, {
      Name: () => account.Name,
      Phone: () => account.Phone,
    })
  }

  // Copy all accounts from Salesforce to Monday
  http.on(
    { method: 'GET', path: '/copy-to-monday' },
    async (event, app) => {

      const { records } = await sf.query('SELECT Id,Name,Phone FROM Account')
      console.log('Salesforce accounts:')
      for (const account of records) {
        await createMondayAccount(account)
      }

      event.res.send(`Created ${records.length} accounts`)
    },
  )

  // Sync accounts from Salesforce to Monday
  sf.on(
    { query: 'SELECT Id,Name,Phone FROM Account' },
    async (event, app) => {

      const account = event.sobject

      if (event.event.type === 'created') {
        await createMondayAccount(account)
      }

      if (event.event.type === 'updated') {
        const { items } = await monday.getBoardItems(boardId)
        const item = Object
          .values(items)
          .filter(item => item.name == account.Id)
          [0]
        if (item) {
          console.log(`Updating Monday account: ${
            item.Name} ${item.Phone} -> ${account.Name} ${account.Phone}`)
          await monday.updateColumnValues(boardId, item.id, {
            Name: () => account.Name,
            Phone: () => account.Phone,
          })
        } else {
          await createMondayAccount(account)
        }
      }
    },
  )

  // Sync account changes from Monday to Salesforce
  monday.on(
    { boardId, type: 'ChangeColumnValue' },
    async (event, app) => {
      console.log(`Updating Salesforce account ${
        event.itemName}: ${event.columnTitle} = ${event.value.value}`)
      const account = await sf.sobject('Account')
      await account.update({
        Id : event.itemName,
        [event.columnTitle]: event.value.value,
      })
    },
  )

  app.start(8000)

  console.log('Authenticating with Salesforce')
  await sf.authenticate()
  console.log('Authenticated')

})().catch(console.error)
