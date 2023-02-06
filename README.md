# ETF-Voting-Contract

This project is my final project for the Alchemy University Bootcamp.


ETF Voting Contract is a decentralized ETF where the ETFToken holder can vote on which assets the ETF should buy and which ones it should sell. Each token holder can vote 1 time as long as they hold at least 0.01 ETFToken. In addition, each token holder can submit a proposal. Once the proposal is sent, the other holders can vote for or against the proposal. The deadline ends after 7 days and the proposal is automatically executed. Once the proposal is executed, one of the voting holders will be randomly selected and rewarded with 1% of the Ether held by the ETF voting contract. Another 1% of the contract's ether will be used as buyback for the ETFToken. After the proposal is executed, a new deadline is set during which holders have time to submit a proposal and vote for it.

For this project, I also created a simple marketplace to buy or sell ERC20 tokens. This marketplace will be used for the ETF voting contract to buy or sell the assets.

## Installation

```bash
git clone https://github.com/RecrafterH/ETF-Voting-Contract.git
```

## Usage

On the website you can submit a proposal or vote for an ongoing proposal. If you don't have tokens yet, you can also buy some tokens.

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
