import React, {Component} from 'react'

import TestRPCProvider from 'Data/Providers/TestRPCProvider'

import Styles from './ConfigScreen.css'

class ConfigScreen extends Component {
  state = {
    specificTime: false,
    opcodeDebug: false,
    mnemonic: false,
    accountsLocked: false,
    forkChain: false,
    verboseLogging: false
  }

  render () {
    return (
      <div className={Styles.ConfigScreen}>
        <header>
          <h3>TESTRPC CONFIG OPTIONS</h3>
        </header>
        <section>
          <form>
            <div>
              <section>
                <h4>TESTRPC PORT NUMBER</h4>
                <input ref="portNumber" type="text" name="portNumber" defaultValue="8545"/>
              </section>
            </div>
            <div>
              <section>
                <h4>TOTAL ACCOUNTS TO GENERATE</h4>
                <input ref="totalAccounts" type="text" defaultValue="6" />
              </section>
            </div>
            <div>
              <section>
                <h4>BLOCK TIME (SECONDS)</h4>
                <input ref="blockTime" type="text" defaultValue="1" />
              </section>
            </div>
            <div>
              <section>
                <h4>GAS PRICE</h4>
                <input ref="gasPrice" type="text" defaultValue="1" />
              </section>
            </div>
            <div>
              <section>
                <h4>GAS LIMIT</h4>
                <input ref="gasLimit" type="text" defaultValue="4712388" />
              </section>
            </div>
            <div>
              <section>
                <h4>AUTOGENERATE HD MNEMONIC</h4>
                <div className="Switch">
                  <input type="checkbox" name="mnemonic" id="Mnemonic" onChange={this._handleInputChange} />
                  <label htmlFor="Mnemonic">AUTOGENERATE HD MNEMONIC</label>
                </div>
              </section>
              <section>
                { this.state.mnemonic
                  ? <span><input ref={(i) => { this.mnemonic = i }} name="mnemonicValue" defaultValue="" type="text" placeholder="Enter Mnemonic to use" /></span>
                  : <span><input ref={(i) => { this.seedData = i }} name="seedDataValue" defaultValue="" type="text" placeholder="Enter Optional Seed Data" /></span>
              }
            </section>
          </div>
            <div>
              <section>
                <h4>USE SPECIFIC TIME</h4>
                <div className="Switch">
                  <input type="checkbox" name="specificTime" id="SpecificTime" onChange={this._handleInputChange} />
                  <label htmlFor="SpecificTime">USE SPECIFIC TIME</label>
                </div>
              </section>
              { this.state.specificTime
                ? <section><input ref="time" type="text" placeholder="Enter Time to use"/></section>
                : null }
              </div>
              <div>
                <section>
                  <h4>VERBOSE LOGGING</h4>
                  <div className="Switch">
                    <input type="checkbox" name="verboseLogging" id="VerboseLogging" onChange={this._handleInputChange} />
                    <label htmlFor="VerboseLogging">ENABLE VM OPCODE DEBUG LOGGING</label>
                  </div>
                </section>
              </div>
              <div>
                <section>
                  <h4>ENABLE VM OPCODE DEBUG LOGGING</h4>
                  <div className="Switch">
                    <input type="checkbox" name="opcodeDebug" id="OpcodeDebug" onChange={this._handleInputChange} />
                    <label htmlFor="OpcodeDebug">ENABLE VM OPCODE DEBUG LOGGING</label>
                  </div>
                </section>
              </div>
            <div>
              <section>
                <h4>CREATE LOCKED ACCOUNTS</h4>
                <div className="Switch">
                  <input type="checkbox" name="accountsLocked" id="AccountsLocked" onChange={this._handleInputChange} />
                  <label htmlFor="AccountsLocked">ACCOUNTS LOCKED</label>
                </div>
              </section>
            </div>
            <div>
              <section>
                <h4>FORK CHAIN</h4>
                <div className="Switch">
                  <input type="checkbox" name="forkChain" id="ForkChain" onChange={this._handleInputChange} />
                  <label htmlFor="ForkChain">FORK CHAIN</label>
                </div>
              </section>
              { this.state.forkChain
                ? <section><input type="text" ref="fork" placeholder="URL to target Chain" /></section>
                : null }
              </div>
            </form>
          </section>
          <footer>
            <button className="btn btn-primary" onClick={this._startTestRpc}>START TESTRPC</button>
          </footer>
        </div>
    )
  }

  _handleInputChange = (event) => {
    const target = event.target
    const value = target.type === 'checkbox' ? target.checked : target.value
    const name = target.name
    this.setState({
      [name]: value
    })
  }

  _startTestRpc = () => {
    const config = {
      port: this.refs.portNumber.value,
      time: this.refs.time ? this.refs.time.value : null,
      fork: this.refs.fork ? this.refs.fork.value : null,
      gasPrice: parseInt(this.refs.gasPrice.value, 10),
      gasLimit: parseInt(this.refs.gasLimit.value, 10),
      blocktime: this.refs.blockTime.value,
      debug: this.state.opcodeDebug,
      verbose: this.state.verboseLogging,
      mnemonic: this.mnemonic ? this.mnemonic.value : null,
      seed: this.seedData ? this.seedData.value : null,
      total_accounts: this.refs.totalAccounts ? this.refs.totalAccounts.value : null,
      secure: this.state.accountsLocked
    }

    Object.keys(config).forEach((key) => { !config[key] ? delete config[key] : null })

    this.props.appStartRpcService(config)
  }
}

export default TestRPCProvider(ConfigScreen)
