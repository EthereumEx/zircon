import TestRPC from 'ethereumjs-testrpc'
import EtherUtil from 'ethereumjs-util'
import ConversionUtils from 'ethereumjs-testrpc/lib/utils/to'

export default class TestRPCService {
  constructor (ipcMain, webView) {
    this.ipcMain = ipcMain
    this.webView = webView

    this.testRpc = null
    this.blockChain = null

    console.log('Starting TestRPCService')

    ipcMain.on('APP/STARTRPC', this._handleStartTestRpc)
    ipcMain.on('APP/GETBLOCKCHAINSTATE', this._handleGetBlockchainState)
    ipcMain.on('APP/STARTMINING', this._handleStartMining)
    ipcMain.on('APP/STOPMINING', this._handleStopMining)
    ipcMain.on('APP/FORCEMINE', this._handleForceMine)
    ipcMain.on('APP/MAKESNAPSHOT', this._handleMakeSnapshot)
    ipcMain.on('APP/REVERTSNAPSHOT', this._handleRevertSnapshot)
    ipcMain.on('APP/ADDACCOUNT', this._handleAddAccount)
  }

  log = (message) => {
    console.log(message)
    this.webView.send('APP/TESTRPCLOG', {message, level: 'log'})
  }

  info = (message) => {
    console.info(message)
    this.webView.send('APP/TESTRPCLOG', {message, level: 'info'})
  }

  warning = (message) => {
    console.warning(message)
    this.webView.send('APP/TESTRPCLOG', {message, level: 'warning'})
  }

  error = (message) => {
    console.error(message)
    this.webView.send('APP/TESTRPCLOG', {message, level: 'error'})
  }

  _handleStartMining = (event, arg) => {
    this.log('Starting Mining....')
    this.blockChain.startMining(this._handleGetBlockchainState)
  }

  _handleStopMining = (event, arg) => {
    this.log('Stopping Mining....')
    this.blockChain.stopMining(this._handleGetBlockchainState)
  }

  _handleForceMine = (event, arg) => {
    this.log('Forcing Mine....')
    this.blockChain.processBlocks(1, this._handleGetBlockchainState)
  }

  _handleMakeSnapshot = (event, arg) => {
    this.log('Making Snapshot...')
    this.blockChain.snapshot()
  }

  _handleRevertSnapshot = (event, arg) => {
    this.log('Reverting Snapshot...')
    this.blockChain.revert()
  }

  _handleAddAccount = (event, arg) => {
    this.log('Adding account...')
    const newAccount = this.blockChain.createAccount(arg)
    this.blockChain.accounts[newAccount.address] = newAccount
    if (!this.blockChain.secure) {
      this.blockChain.unlocked_accounts[newAccount.address] = newAccount
    }
    this.log('...account added: ' + newAccount.address)
  }

  _handleStartTestRpc = (event, arg) => {
    arg.logger = this

    if (this.testRpc) {
      console.log('TESTRPC ALREADY RUNNING ON PORT ' + arg.port)
      return
    }

    this.testRpc = TestRPC.server(arg)
    this.testRpc.listen(arg.port, (err, bkChain) => {
      if (err) {
        this.webView.send('APP/FAILEDTOSTART', err)
        console.log('ERR: ', err)
      }

      const blockChainParams = this._buildBlockChainState(bkChain)

      this.webView.send('APP/TESTRPCSTARTED', blockChainParams)
      this.log('TESTRPC STARTED')
      this.blockChain = bkChain
      this.refreshTimer = setInterval(this._handleGetBlockchainState, 1000)
    })
  }

  _handleGetBlockchainState = () => {
    const blockChainParams = this._buildBlockChainState(this.blockChain)
    this.webView.send('APP/BLOCKCHAINSTATE', blockChainParams)
  }

  _buildBlockChainState = (bkChain) => {
    return {
      accounts: Object.keys(bkChain.accounts).map((address, index) => {
        return {
          index,
          address,
          balance: ConversionUtils.number(bkChain.accounts[address].account.balance),
          nonce: ConversionUtils.number(bkChain.accounts[address].account.nonce),
          privateKey: bkChain.accounts[address].secretKey.toString('hex'),
          isUnlocked: bkChain.isUnlocked(address)
        }
      }),
      mnemonic: bkChain.mnemonic,
      hdPath: bkChain.wallet_hdpath,
      gasPrice: bkChain.gasPriceVal,
      gasLimit: bkChain.blockchain.blockGasLimit,
      totalAccounts: bkChain.total_accounts,
      coinbase: bkChain.coinbase,
      isMiningOnInterval: bkChain.is_mining_on_interval,
      isMining: bkChain.is_mining,
      blocktime: bkChain.blocktime,
      blockNumber: bkChain.blockNumber(),
      networkId: bkChain.net_version,
      snapshots: bkChain.snapshots,
      blocks: this._getRecentBlocks(bkChain),
      transactions: this._getRecentTransactions(bkChain)
    }
  }

  _getRecentBlocks = (bkChain) => {
    let blockHeight = bkChain.blockchain.blocks.length

    // Slice out the last 5 blocks so that we don't inadvertently sort
    // the original blocks array and cause ALL SORTS OF BAD PROBLEMS
    let blocks = bkChain.blockchain.blocks.slice(blockHeight - 5, blockHeight).sort((a, b) => {
      return EtherUtil.bufferToInt(a.header.number) - EtherUtil.bufferToInt(b.header.number)
    }).reverse()

    // The block objects will lose prototype functions when serialized up to the Renderer
    return blocks.map((block) => {
      let newBlock = Object.assign({}, block)
      newBlock.hash = block.hash()
      newBlock.transactions = newBlock.transactions.map(this._marshallTransaction)
      return newBlock
    })
  }

  _getRecentTransactions = (bkChain) => {
    const blocks = bkChain.blockchain.blocks
    const blockHeight = bkChain.blockchain.blocks.length - 1

    let transactions = []
    let blockIndex = blockHeight

    while (transactions.length < 5 && blockIndex > 0) {
      if (blocks[blockIndex].transactions.length > 0) {
        transactions = transactions.concat(blocks[blockIndex].transactions.map(this._marshallTransaction))
      }
      blockIndex--
    }

    return transactions
  }

  _marshallTransaction = (transaction) => {
    let newTx = Object.assign({}, transaction)
    newTx.hash = transaction.hash()
    return newTx
  }

}
