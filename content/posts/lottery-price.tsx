import { MathFormula } from "@/components/math-formula";
import { LotteryPriceChart } from "@/components/lottery-price-charts";
import data from "@/content/posts/lottery-price-data.json";

type Row = typeof data.BTC.coarse[number];
type Interval = Row["win"];
const interval = (n: Interval, money = false) => (money ? "$" : "") + n.value.toFixed(money ? 3 : 2) + (money ? "" : "%") + " [" + n.low.toFixed(money ? 3 : 2) + ", " + n.high.toFixed(money ? 3 : 2) + "]";

function PriceTable({ caption, rows }: { caption: string; rows: Row[] }) {
  return <div className="journal-table-scroll journal-table-wide" role="region" aria-label={caption} tabIndex={0}>
    <table>
      <caption>{caption}</caption>
      <thead><tr>{["Price (¢)", "Contracts (M)", "Mean price (¢)", "Win rate [90%]", "Break even, with fees", "Payout / $1, before fees [90%]", "Payout / $1, with fees [90%]"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.price}>
        <th scope="row">{row.price}</th><td>{row.contractsMillion.toLocaleString("en-US", { minimumFractionDigits: 1 })}</td>
        <td>{row.averagePrice.toFixed(2)}</td><td>{interval(row.win)}</td><td>{row.breakeven.toFixed(2)}%</td>
        <td>{interval(row.gross, true)}</td><td>{interval(row.net, true)}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

export function LotteryPriceArticle() {
  return <>
    <p>A contract costs three cents. If it wins, it pays a dollar. The upside is easy to picture: a small stake, a payout more than thirty times the purchase price. What is harder to see is whether it wins often enough.</p>
    <p>We examined public trades in Kalshi’s hourly Bitcoin and Ethereum above/below markets, grouping purchases by price. The question was deliberately simple: at each price from 1 to 99 cents, how often did the purchased side settle at $1, and how much did buyers receive for every dollar spent?</p>
    <p>The cheapest contracts had the weakest average payouts relative to cost. In the BTC 1–4 cent bucket, settlement winnings covered just <strong>67.7 cents per dollar spent</strong> after modeled fees. Higher-priced contracts came much closer to breaking even. A low sticker price did not make an outcome good value.</p>

    <section aria-labelledby="sample">
      <h2 id="sample">Following the buyer, one contract at a time</h2>
      <p>The sample covers settlement dates from March 18, 2024 through November 10, 2026. It contains 101,196,991 BTC trades and 6,490,946 ETH trades, representing approximately 9.36 billion and 387 million contracts respectively. These are hourly above/below contracts, not the 15-minute markets or every crypto product on the exchange.</p>
      <p>For each trade, we follow the taker: the participant who buys against an existing quote. We record the side bought, the price paid, the quantity, and whether that side eventually won. Win rates are weighted by contract quantity. A purchase of 100 contracts counts one hundred times as much as a purchase of one.</p>
      <p>Each observation is valued at settlement, whether or not the original buyer actually held the position that long. The results therefore describe the settlement value of the purchased contracts, not realized account returns or the performance of an individual trading strategy.</p>
      <p>The BTC sample includes 890 observed settlement dates; ETH includes 891. Those are dates represented in the data, not the elapsed calendar length of the study. No trades were removed by the reported block-trade, missing-market, missing-outcome, or rounded-price boundary checks.</p>
    </section>

    <section aria-labelledby="breakeven">
      <h2 id="breakeven">The win rate a price requires</h2>
      <p>Before fees, a 20-cent contract must win 20% of the time to break even. A three-cent contract needs a 3% win rate. This follows directly from the $1 settlement payout; it does not require treating the quoted price as a perfectly calibrated probability.</p>
      <p>For a consistent comparison across the sample, we apply the same unrounded taker-fee approximation to every purchase. With price <MathFormula>{"p"}</MathFormula> expressed in dollars, the modeled fee per contract is:</p>
      <MathFormula display label="Modeled fee per contract in dollars">{"f(p)=0.07p(1-p)"}</MathFormula>
      <p>This uses the standard coefficient in <a href="https://kalshi.com/docs/kalshi-fee-schedule.pdf">Kalshi’s general fee schedule</a>, with a multiplier of one. It is a standardized cost model, not a reconstruction of the fee charged on each historical order. It excludes rounding, fee changes, and product-specific adjustments.</p>
      <p>If the probability of winning is <MathFormula>{"q"}</MathFormula>, breaking even requires:</p>
      <MathFormula display label="Fee-inclusive breakeven probability">{"q_{\\mathrm{BE}}=p+0.07p(1-p)"}</MathFormula>
      <p>At 20 cents, the modeled fee is 1.12 cents and the breakeven win rate is 21.12%. At three cents, the fee is about 0.204 cents, raising the threshold to approximately 3.204%.</p>
      <p>We also express the result as settlement payout per dollar spent: total winning contracts times $1, divided by total purchase cost plus modeled fees. A value of $1 means break even. A value of $0.80 means a loss of 20 cents per dollar spent. These are pooled payout ratios, not annualized returns or the arithmetic mean of individual trade returns.</p>
      <p>Within a price bucket, fees are calculated at each trade’s price before aggregation. Applying the fee formula to the bucket’s mean price would give a slightly different answer.</p>
    </section>

    <section aria-labelledby="results">
      <h2 id="results">Cheap contracts, expensive odds</h2>
      <p>The broad price buckets show the pattern without requiring a model of the underlying asset. All figures below include the standardized fee. Brackets give 90% intervals obtained by resampling whole days.</p>
      <div className="journal-table-scroll" role="region" aria-label="Settlement payout per dollar spent by entry price" tabIndex={0}>
        <table>
          <caption>Settlement payout per $1 spent, including modeled fees</caption>
          <thead><tr><th scope="col">Entry price</th><th scope="col">BTC [90%]</th><th scope="col">ETH [90%]</th></tr></thead>
          <tbody>{data.BTC.coarse.map((row, i) => <tr key={row.price}><th scope="row">{row.price === "1–99" ? "All prices" : row.price + "¢"}</th><td>{interval(row.net, true)}</td><td>{interval(data.ETH.coarse[i].net, true)}</td></tr>)}</tbody>
        </table>
      </div>
      <p>For BTC contracts bought at 1–4 cents, the mean entry price was 2.32 cents and the observed win rate was 1.67%. The fee-inclusive breakeven rate was 2.47%. The resulting payout ratio of $0.677 implies a loss of 32.3% of the amount spent. That is not simply a fee effect: even before fees, buyers received only $0.723 per dollar of purchase cost.</p>
      <p>At exactly three cents, across approximately 199 million BTC contracts, the observed win rate was 2.20%. The payout ratio was $0.688 after modeled fees, with a 90% interval of $0.620–$0.753. The occasional large payout was not frequent enough to cover the accumulated cost.</p>
      <figure className="journal-figure">
        <LotteryPriceChart name="payout" description="BTC and ETH settlement payouts per dollar spent rise from well below one dollar at low entry prices to near breakeven at high prices. Shaded bands show 90% day-bootstrap intervals." />
        <figcaption>Figure 1. Settlement payout divided by purchase cost plus modeled fees, at each one-cent entry price. Shading shows pointwise 90% day-bootstrap intervals; the dashed horizontal line is break even. This is a price-conditioned historical statistic, not a cumulative equity curve.</figcaption>
      </figure>
      <p>The deficit narrows as the price rises. BTC buyers received $0.776 per dollar in the 5–9 cent bucket, $0.844 at 10–19 cents, and $0.900 at 20–39 cents. ETH showed the same broad shape, despite contract volume of only about 4% of BTC’s.</p>
      <p>Around the middle of the price range, fees account for much of the shortfall. BTC contracts bought at 40–59 cents won 48.99% of the time against a mean price of 49.33 cents. Before fees, their payout ratio was $0.993; with fees, it fell to $0.959.</p>
      <p>At higher prices, the averages were close to break even, but “close” should not be read as a guarantee of fair pricing or profit. BTC’s 60–79 cent bucket returned $0.994 after modeled fees. ETH’s 95–99 cent bucket returned $0.995, with an interval of $0.992–$0.998. Rounding either result to $1.00 would conceal a loss.</p>
      <figure className="journal-figure">
        <LotteryPriceChart name="calibration" description="Observed win rate minus fee-inclusive breakeven probability for BTC and ETH at each entry price. Most lower and middle prices fall below zero; higher prices lie closer to breakeven." />
        <figcaption>Figure 2. Observed win rate minus the modeled fee-inclusive breakeven rate, in percentage points. Negative values mean that settlement wins occurred less often than required to cover cost. The same probability shortfall produces a larger proportional loss when the initial price is low.</figcaption>
      </figure>
    </section>

    <section aria-labelledby="interpretation">
      <h2 id="interpretation">A familiar shape, not a proven explanation</h2>
      <p>The pattern resembles the <em>favorite–longshot bias</em>: long shots tend to be expensive relative to how often they win, while favorites offer better average value. The phenomenon has a long research history in betting markets, including <a href="https://www.nber.org/papers/w15923">Snowberg and Wolfers’ work on probability misperception</a>.</p>
      <p>One possible explanation is that people pay a premium for the chance of turning a small stake into a much larger payout. But these tables do not identify anyone’s motives. A taker could be speculating, hedging another position, or responding to information not captured by entry price alone. The data establish a price–outcome relationship; they do not establish its cause.</p>
    </section>

    <section aria-labelledby="stability">
      <h2 id="stability">How much of the pattern survives over time?</h2>
      <p>The pooled results are dominated by recent trading. Approximately 94% of BTC contract volume and 79% of ETH volume occurred in 2026. A study spanning parts of 33 calendar months is not the same as 33 equally informative months.</p>
      <p>Half-year splits help expose that imbalance. From the second half of 2024 onward, every BTC bucket from 5 through 59 cents had a fee-inclusive payout ratio below $1 in every half-year. That persistence is more informative than a single pooled estimate, though it still does not establish that the relationship will continue.</p>
      <p>The lowest prices are much less stable in small samples. In the first half of 2025, ETH’s 1–4 cent bucket returned $10.184 per dollar spent. It contained only about 0.3 million contracts, and its 90% interval stretched from $0.725 to $15.920. That dramatic point estimate is compatible with substantial uncertainty, including a loss.</p>
      <p>Rare settlements can have a disproportionate effect at these prices. A few winning market outcomes can move the result sharply; hundreds of thousands of contracts need not represent hundreds of thousands of independent opportunities.</p>
    </section>

    <section aria-labelledby="limitations">
      <h2 id="limitations">What the evidence does—and does not—measure</h2>
      <p>The intervals resample complete days, keeping trades from a sampled day together. This preserves dependence within a day more faithfully than treating every trade as an independent draw. It does not remove dependence across days or account for all changes in market conditions. The intervals shown at individual prices are pointwise, not a simultaneous confidence band across all 99 prices.</p>
      <p>The cost model is deliberately uniform. Actual fee schedules, multipliers, rounding, and order structure can change the amount paid. The tables cannot be read as an audit of historical trading costs or a promise of the same economics for a new order.</p>
      <p>Contract counts measure traded quantity, not unique positions, unique traders, open interest, or independent trials. Repeated trades can refer to the same eventual market outcome. Likewise, valuing purchases at settlement leaves out any intervening sales, hedges, and portfolio effects.</p>
      <p>Finally, conditioning on price alone averages over time to expiry, volatility, strike distance, market conditions, and trader selection. A negative average within a price bucket does not imply that every purchase there has negative expected value. Nor does a near-breakeven average demonstrate an executable trading advantage.</p>
    </section>

    <section aria-labelledby="conclusion">
      <h2 id="conclusion">Three cents is a price, not a bargain</h2>
      <p>The appeal of a cheap contract is its payout multiple. Its economic value depends on how frequently that payout arrives relative to its full cost. In this sample, the lowest-priced BTC and ETH contracts generally failed that test by the widest margin.</p>
      <p>The distinction is visible without a forecasting model: compare entry prices with settlement frequencies, account for fees, and keep the denominator explicit. A contract can be inexpensive to buy and still expensive for the probability it delivers.</p>
    </section>

    <section aria-labelledby="tables">
      <h2 id="tables">Data tables</h2>
      <p>The tables below retain the reported one-cent results and half-year breakdowns. Figures use these rounded aggregate estimates. Contract volumes are rounded to millions; 0.0 million does not necessarily mean zero contracts. All intervals are 90% day-bootstrap intervals. The first and last half-years cover only the observed part of the study period.</p>
      <div className="lottery-appendix">
        {(["BTC", "ETH"] as const).map(asset => <details key={asset + "-prices"}>
          <summary>{asset} · Results by entry price</summary>
          <PriceTable caption={asset + " — nine price buckets and total"} rows={data[asset].coarse} />
          <PriceTable caption={asset + " — each one-cent entry price"} rows={data[asset].fine} />
        </details>)}
        {(["BTC", "ETH"] as const).map(asset => <details key={asset + "-periods"}>
          <summary>{asset} · Half-year breakdowns</summary>
          {data[asset].periods.map(period => <PriceTable key={period.period} caption={asset + " — " + period.period + " · " + period.days + " observed settlement dates"} rows={period.rows} />)}
        </details>)}
      </div>
      <p>Source: Kalshi public trade records and market settlement outcomes, hourly BTC and ETH above/below markets, March 18, 2024–November 10, 2026. The tables and figures publish aggregate research results; they are not a release of the underlying trade-by-trade records.</p>
    </section>
  </>;
}
