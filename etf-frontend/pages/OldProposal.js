import styles from "@/styles/Home.module.css";

export default function OldProposal({
  tokenAddress,
  amount,
  buying,
  nayVotes,
  yayVotes,
  executed,
}) {
  return (
    <div>
      <ul className={styles.ul}>
        <li className={styles.li}>
          <div>Tokenaddress: </div>
          {<span>&nbsp;&nbsp;</span>}
          <div>{tokenAddress}</div>
        </li>
        <li className={styles.li}>
          <div>Tokenamount: </div>
          {<span>&nbsp;&nbsp;</span>}
          <div>{amount}</div>
        </li>
        <li className={styles.li}>
          <div>Buy/Sell: </div>
          {<span>&nbsp;&nbsp;</span>}
          <div>{buying}</div>
        </li>
        <li className={styles.li}>
          <div>Nay Votes: </div>
          {<span>&nbsp;&nbsp;</span>}
          <div>{nayVotes}</div>
        </li>
        <li className={styles.li}>
          <div>Yay Votes: </div>
          {<span>&nbsp;&nbsp;</span>}
          <div>{yayVotes}</div>
        </li>
      </ul>
    </div>
  );
}
