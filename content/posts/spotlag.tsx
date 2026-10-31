import { SpotlagChart, type SpotlagChartName } from "@/components/spotlag-charts";
import type { ReactNode } from "react";

function Table({ caption, headings, rows, wide = false }: { caption: string; headings: string[]; rows: string[][]; wide?: boolean }) {
  const className = ["journal-table-scroll", wide && "journal-table-wide", headings.length <= 2 && "journal-table-compact"].filter(Boolean).join(" ");
  return <div className={className} role="region" aria-label={caption} tabIndex={0}>
    <table><caption>{caption}</caption><thead><tr>{headings.map(heading => <th scope="col" key={heading}>{heading}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, column) => column === 0 ? <th scope="row" key={column}>{cell}</th> : <td key={column}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

function Figure({ name, alt, children }: { name: SpotlagChartName; alt: string; children: ReactNode }) {
  return <figure className="journal-figure">
    <SpotlagChart name={name} description={alt} />
    <figcaption>{children}</figcaption>
  </figure>;
}

export function SpotlagArticle() {
  return <>
    <p>We spent two weeks testing a spot-lag trading strategy in Kalshi’s 15-minute crypto prediction markets: when the underlying price has moved far enough to make one outcome likely, can we buy that outcome before the order book catches up?</p>
    <p>We built a prototype, ran a paper strategy, traded live, attempted three rounds of calibration, and replayed recorded markets. The most revealing result came from an event study. By the time a large move arrived through our settlement-index feed, roughly 90% of the book’s measured adjustment had already happened.</p>
    <p>We had set out to trade stale quotes. The evidence suggested that our signal was stale instead.</p>
    <p>This is a postmortem of that discontinued experiment. The figures use the available five-day replay and approximately ten-hour local event-study sample. They do not represent the longer recording period still awaiting analysis.</p>

    <section aria-labelledby="question">
      <h2 id="question">The question we were trying to answer</h2>
      <p>A high probability of winning is not enough. A contract that pays $1 and costs 99 cents can win almost every time and still lose money after an occasional failure and trading fees. Our question was whether the price available to us was low enough relative to the probability of settlement—and whether that price would survive until an order arrived.</p>
      <p>We chose to model the settlement index itself. That seemed a natural starting point: it was the variable that determined the payout, and Kalshi exposed it alongside the running final-minute average. It also made the hypothesis unusually easy to test. We could record the index and the book, align their clocks, and examine which moved first.</p>
      <p>The experiment covered BTC, ETH, SOL, XRP, DOGE, BNB, HYPE, ZEC, and NEAR. For the contracts we studied, settlement compared the final minute’s average index value with the average before the market opened. This differs from comparing two instantaneous spot prices. Kalshi describes that distinction in its <a href="https://help.kalshi.com/en/articles/13823838-crypto-markets">crypto settlement guide</a>.</p>
    </section>

    <section aria-labelledby="model">
      <h2 id="model">A deliberately simple model</h2>
      <p>Our baseline assumed zero-drift Brownian price changes. We estimated volatility from the most recent 180 index ticks, requiring at least 25 observations spanning 20 seconds. Log-return volatility was converted into price units before estimating the distribution of the settlement average.</p>
      <p>Averaging matters. With at least 60 seconds remaining, the variance time was the time until the averaging window began, plus the variance contribution of 60 equally weighted future observations. Inside that window, we combined the already observed average with a forecast for the remaining observations.</p>
      <div className="journal-equation" aria-label="Model equations">
        <p>τ ≥ 60: V = τ − 60 + (60 × 61 × 121) / (6 × 60²)</p>
        <p>τ &lt; 60: E = (nA + mS) / 60; V = m(m + 1)(2m + 1) / (6 × 60²)</p>
        <p>p(Yes) = Φ((E − K′) / (σ√V)); K′ = K − 0.5 × 10⁻ᵈ</p>
      </div>
      <p>Here S is the current index, K the target, d its rounding precision, σ volatility in price units per square-root second, and τ seconds to expiry. Within the final minute, n observations have average A and m = 60 − n remain. Before that minute, E = S. Φ is the standard normal cumulative distribution function.</p>
      <p>The initial entry rules required a model probability of at least 80%, an ask no higher than 95 cents, a modeled edge after fees of at least 2.5 cents, and an index displacement of at least 5 basis points from the target. We rejected books older than two seconds and considered five windows: 450, 300, 180, 60, and 30 seconds before expiry. Each market could trigger once per window, with positions held to settlement.</p>
      <p>There was no drift term, jump process, or model of changing volatility. We treated the probabilities as uncalibrated estimates from the beginning.</p>
    </section>

    <section aria-labelledby="experiment">
      <h2 id="experiment">From prototype to live orders</h2>
      <Table caption="Experiment timeline · 2026, UTC" headings={["Date", "Milestone"]} rows={[
        ["September 20", "Read-only prototype, authenticated market data, and first paper entries."],
        ["September 21", "First live IOC orders; execution checks and calibration work."],
        ["September 22", "Third calibration review; migration to a server and a Rust execution core."],
        ["September 26", "Five-day replay of the simple displacement rule."],
        ["October 4", "Last live order at 10:57 UTC; the strategy was discontinued."],
      ]} />
      <p>Live orders were immediate-or-cancel limit orders in whole contracts, initially with a $5 budget per order. We persisted order intent before sending a request. An acknowledgement was not treated as a fill: terminal order state and individual executions had to be reconciled.</p>
      <p>The final measured submission-to-acknowledgement latency was 30 ms at the median and 142 ms at the 90th percentile. These are acknowledgement measurements, not direct observations of one-way arrival at the matching engine. The replay used a 30 ms assumed arrival delay; that assumption should be read separately from the measurement.</p>
      <p>Earlier in the local run, the index tick used at decision time was already 303 ms old at the median and 978 ms old at the 95th percentile. Faster execution could reduce one part of the path. It could not make an old input new.</p>
    </section>

    <section aria-labelledby="evidence">
      <h2 id="evidence">Four views of the same experiment</h2>
      <p>We examined the ledgers, a rule replay, an event study, and a population of per-second observations. These answer different questions and should not be treated as interchangeable samples.</p>
      <Table caption="Evidence used in this article" headings={["Dataset", "Coverage", "Purpose"]} rows={[
        ["Paper ledger", "1,022 settled entries; roughly 1½ days", "What the simulator reported."],
        ["Live ledger", "1,029 submitted orders, September 21–October 4", "What execution and settlement actually returned."],
        ["Rule replay", "4,379 markets, September 22–26", "A five-day test with an arrival-delay assumption and top-of-book depth."],
        ["Event study", "4,780 events; 3,502 retained placebo observations", "The timing of book changes around large index ticks."],
        ["Per-second population", "110,014 labeled observations; 287 markets; 40 settlement windows", "Model behavior beyond the trades we selected."],
      ]} />
      <p>The population export contained 120,265 observations in total; only 110,014 had a settlement label. For that analysis, settlement was reconstructed from recorded index observations in the final minute, requiring at least 50 ticks. All 160 markets overlapping with available official outcomes agreed. That agreement validates the overlap, not every unobserved or missing-tick case.</p>
      <p>For the event study, we selected index moves above coin-specific thresholds of roughly three one-second standard deviations, with a three-second separation between events in the same coin. We tracked the nearest eligible expiry’s Yes mid-price, signed in the direction of the index move. The baseline was the book state two seconds before the tick. Placebo observations came from small, non-event ticks with randomly assigned directions.</p>
      <p>The channel we recorded delivered approximately one index tick per second. Kalshi documents this cadence for <a href="https://docs.kalshi.com/websockets/cfbenchmarks-value">cfbenchmarks_value</a>; this experiment did not evaluate every other data feed. We compared local receive times and, separately, Kalshi book timestamps with the upstream index timestamps.</p>
    </section>

    <section aria-labelledby="book-first">
      <h2 id="book-first">The book moved first</h2>
      <p>Set time zero to the moment an index tick reached our recorder. One second earlier, the event-minus-placebo mid-price response had already completed 18% of its eventual three-second move. Half a second earlier, it had completed 61%. At receipt, it was approximately 90% complete.</p>
      <Figure name="response" alt="Event response rises before index receipt: 18% of the placebo-adjusted move at minus one second, 61% at minus half a second, and 90% at receipt. Placebo stays near zero.">
        Figure 1. Mean directional mid-price change relative to the book at −2 seconds. Shares of the completed response use the event-minus-placebo move at +3 seconds as the denominator. Local sample: approximately ten hours.
      </Figure>
      <p>This pattern was present across all nine assets. At receipt, the placebo-adjusted response ranged from roughly 85% complete for BNB to 100% for HYPE. Larger index moves did not reveal a substantially later response: the corresponding shares were 89%, 92%, and 92% across increasing event-size groups.</p>
      <p>The mid-price is not an executable quote, so we also examined the side that would look stale: the Yes ask after an upward index move, or the Yes bid after a downward move. We measured the first move in that side’s price relative to the pre-event baseline.</p>
      <Table caption="First stale-side repricing relative to the index tick" headings={["Clock", "10th percentile", "Median", "90th percentile"]} rows={[
        ["Local receipt", "−1.89 s", "−1.01 s", "−0.33 s"],
        ["Upstream timestamps", "−1.82 s", "−0.95 s", "−0.27 s"],
      ]} />
      <Figure name="repricing" alt="At index receipt, 93% of event quotes and 46% of placebo quotes have repriced. The reported excess reaches about 46 percentage points before receipt and does not keep increasing afterward.">
        Figure 2. Share of observations with stale-side repricing by each time, plus the event-minus-placebo excess. The source reports independently rounded percentages; small subtraction differences reflect rounding. The earliest reported point is −1 second.
      </Figure>
      <p>By receipt, 93% of event observations had repriced, compared with 46% of placebo observations. The excess was already near its maximum a quarter-second before receipt. Repricing was common even without an event; the comparison with placebo is what makes the timing informative.</p>
      <p>The local wall clock was about 190 ms behind the exchange clock, so its absolute network-latency estimates were unreliable. Within-recorder timing and the upstream comparison nevertheless gave similar orderings. Agreement between them strengthens the observation, but does not remove every clock or timestamp-semantics assumption.</p>
      <p>These results do not tell us exactly which feed each market maker used, or how much of the gap came from index aggregation, publication, transport, or trading-system speed. They do tell us that the book usually incorporated the move before it reached this strategy’s index input.</p>
    </section>

    <section aria-labelledby="price">
      <h2 id="price">A 99% win rate left very little room</h2>
      <p>To separate the timing idea from our probability model, we replayed a simpler rule: when the index was at least 10 basis points beyond the target, buy the indicated side. We tested the first qualifying observation in the final minute and fixed snapshots 60 and 30 seconds before expiry. The replay assumed arrival after 30 ms, capped fills at the then-visible top-of-book quantity, and used official outcomes.</p>
      <Table wide caption="Five-day replay · reported per-contract estimates" headings={["Entry", "Observations", "Win rate", "Mean ask", "Fee-adjusted EV"]} rows={[
        ["First crossing, final 60 s", "1,407", "99.4%", "$0.992", "+0.14¢"],
        ["T−30 s snapshot", "270", "100.0%", "$0.996", "+0.33¢"],
        ["T−60 s snapshot", "1,235", "99.4%", "$0.994", "−0.04¢"],
      ]} />
      <Figure name="replay-ev" alt="Fee-adjusted EV confidence intervals: final-minute first crossing plus 0.14 cents with interval minus 0.40 to plus 0.56; T-minus-30 plus 0.33 with interval plus 0.16 to plus 0.59; T-minus-60 minus 0.04 with interval minus 0.64 to plus 0.42.">
        Figure 3. Reported fee-adjusted EV and 95% intervals from 2,000 bootstrap resamples of settlement windows. The T−30 sample contains no losses, so its positive interval does not estimate the risk of a loss absent from that sample.
      </Figure>
      <p>The price explained most of the result. Of the 1,407 first-crossing observations, 1,273 had asks above 98 cents; that group’s estimated net EV was just 0.03 cents per contract. The 90–95 cent group contained only 31 observations, won 87.1% of the time, and lost about 7 cents per contract after modeled fees.</p>
      <p>The apparent bargain was usually expensive enough to have little expected value left. The cheaper contracts were much less certain than a simple displacement signal suggested.</p>
      <p>Median visible top-of-book depth ranged from 276 to 522 contracts across the three entry rules. That is displayed depth, not guaranteed capacity. The replay did not establish that all of it would remain available to us in competition with other orders.</p>
      <p>Fee treatment also matters at this scale. Kalshi’s <a href="https://kalshi.com/docs/kalshi-fee-schedule.pdf">general taker fee schedule</a> uses 0.07 × C × p × (1 − p), rounded up to the next cent, where C is the number of contracts. Our per-second analysis uses the unrounded per-contract approximation 0.07 × p × (1 − p). The replay figures above are reported fee-adjusted estimates from the supplied export, not a reconciliation of exchange charges. Live-ledger fees below are actual reported charges.</p>
    </section>

    <section aria-labelledby="selection">
      <h2 id="selection">The model looked better before execution</h2>
      <p>The paper ledger reported $137.26 in net profit on $4,285.98 of purchase cost, approximately 3.2%. The live ledger ended at a $26.16 loss after fees, approximately −0.69% of purchase cost. These percentages describe turnover-based returns in different samples, not account returns or a matched paper-versus-live experiment.</p>
      <Table caption="Live ledger · September 21, 01:12 to October 4, 10:57 UTC" headings={["Measure", "Result"]} rows={[
        ["Submitted / filled orders", "1,029 / 935 (90.9%)"],
        ["Contracts traded", "4,383"],
        ["Purchase cost", "$3,778.53"],
        ["Trading fees", "$34.90"],
        ["Realized P&L before fees", "+$8.74"],
        ["Realized P&L after fees", "−$26.16"],
        ["Profitable / losing trading days", "4 / 6"],
      ]} />
      <p>Fees were almost four times gross profit. But transaction costs were only part of the explanation. The 450-second entry window accounted for $24.89 of the loss. It had looked profitable in the shorter paper sample; the live run continued for another twelve days, under changing parameters and market conditions.</p>
      <p>Selection was another problem. On selected trade observations, the market ask predicted outcomes slightly better than our model: Brier scores were 0.1042 and 0.1058 respectively, and log losses were 0.3526 and 0.3730. Lower is better for both metrics. Across the broader per-second population, the model’s Brier score was 0.1000 versus 0.1013 for the market mid-price.</p>
      <p>Those comparisons use different samples and different market-price measures—ask versus midpoint—so they are not a controlled estimate of execution damage. They do show why an average forecasting score was an inadequate reason to trade. We needed the model to work specifically where it disagreed with an executable price.</p>
      <Figure name="disagreement" alt="For a model-minus-ask gap of 5 to 10 percentage points, the observed win rate is 89.6% and modeled net is plus 7.12 cents. At 15 to 20 points, the model predicts 87.3%, but 56.5% win and modeled net is minus 15.49 cents across 260 observations.">
        Figure 4. Model-favored side, 60–450 seconds before expiry. Probability, observed win rate, and ask are shown above; hypothetical per-contract P&L after the unrounded fee approximation is below. Counts are repeated per-second observations, not independent trades.
      </Figure>
      <p>The largest disagreements were especially troubling. In the 15–20 percentage-point gap bucket, the model predicted an 87.3% win rate. The average ask was 70.6 cents. The observed win rate was 56.5%, and hypothetical net P&L was −15.49 cents per contract. That bucket had only 260 observations across 23 settlement windows, but it was a useful warning: the most attractive-looking model signal could be the least trustworthy.</p>
      <p>Moderate disagreement looked more promising in this sample. A 5–10 point gap produced an estimated +7.12 cents per contract. That was a retrospective slice of correlated observations, however, not a validated replacement strategy.</p>
      <p>The same underlying crypto moves also affected several positions at once. The paper analysis had 1,022 entries but only 121 settlement windows. Aggregating returns by window produced variance 1.64 times the estimate under an independent-trade assumption. Counting trades overstated how many separate bets we had made.</p>
    </section>

    <section aria-labelledby="uncertainty">
      <h2 id="uncertainty">Our uncertainty estimate was too narrow</h2>
      <p>Three calibration rounds failed the acceptance criteria we had set. In the third review of the three-minute window, 144 training observations and 78 validation observations produced a Brier score of 0.08872 after calibration, slightly worse than 0.08857 before it. Across windows, settlement-block bootstrap intervals for improvement included zero.</p>
      <p>We then examined the distributional assumption directly. For each market near a fixed horizon, we standardized the realized settlement error by the model’s forecast standard deviation. If the approximation were well specified, those errors would resemble a standard normal distribution.</p>
      <Table caption="One observation per market near each horizon" headings={["Seconds to expiry", "Markets", "Error standard deviation", "Share beyond ±3"]} rows={[
        ["440", "281", "1.40", "3.56%"],
        ["300", "281", "1.30", "3.20%"],
        ["180", "278", "1.28", "1.80%"],
        ["90", "251", "1.32", "2.79%"],
        ["Standard normal reference", "—", "1.00", "0.27%"],
      ]} />
      <Figure name="tails" alt="Quantile comparison for 278 markets near 180 seconds to expiry shows realized settlement errors departing from the standard normal reference, especially in the tails. Their standard deviation is 1.28 rather than 1.">
        Figure 5. Standardized settlement errors against standard normal quantiles. The first eligible observation per market within 1.5 seconds of the 180-second horizon is used, matching the supplied analysis. A well-specified standard normal model would follow the dashed line.
      </Figure>
      <p>The observed standard deviations were 28–40% above the model’s prediction. Events outside three model standard deviations occurred about 7–13 times as often as a standard normal would suggest. These are small, dependent samples, but the direction of the mismatch was consistent: our model assigned too little probability to large settlement errors.</p>
      <p>The market’s own prices were less confident. Regressing the normal-score transform of the midpoint against the model’s score gave an approximate relationship of mid ≈ Φ(z/k), with fitted scale factors around 1.25–1.29 outside the final minute. This is a description of observed prices, not evidence of the models used by individual market makers.</p>
      <p>Simply widening our model did not establish an edge. In the filtered sample used for the scale scan, moving from k = 1 to k = 1.1 improved Brier score from 0.1252 to 0.1250. It was a small in-sample change, not proof that a recalibrated strategy would survive live execution.</p>
    </section>

    <section aria-labelledby="tradable-window">
      <h2 id="tradable-window">A visible window is not necessarily a tradable one</h2>
      <p>Three distinctions matter when interpreting an apparent spot-lag opportunity. First, a direct exchange spot feed may reveal a move before a settlement index publishes it. That puts the signal at a different point in the information sequence. We did not test that version, so our index-driven result cannot establish whether a direct spot signal would have arrived early enough to trade.</p>
      <p>Second, displayed liquidity and the speed of the participants supplying it can differ across markets. A shallow book may show a price gap with very little capacity behind it. Slower quote updates are one possible explanation, but depth alone does not identify the liquidity providers or establish how quickly they react. Our Kalshi observations cannot answer that question for another venue.</p>
      <p>Third, filling a backtest at the displayed best price assumes that the quote survives until matching. Polymarket’s <a href="https://docs.polymarket.com/trading/place-orders">order documentation</a> describes a delayed status for marketable orders subject to a matching delay: acceptance is not a fill. Where makers can cancel during that interval, they have additional time to withdraw a stale quote before the taker reaches it. That mechanism protects resting liquidity from being picked off; it does not reserve the displayed price for the taker. A replay that omits it can overstate executable opportunity.</p>
      <p>Our experiment did not measure how much of any apparent window on another venue survives live execution. For the Kalshi strategy we tested, the problem occurred earlier: most repricing preceded the index signal itself. Even without an additional taker delay, faster matching would not recover a price that had already changed.</p>
    </section>

    <section aria-labelledby="limits">
      <h2 id="limits">What this experiment did not establish</h2>
      <p>The result is narrower than “spot-lag trading does not work.” We tested one class of strategies, using a particular settlement-index input, in a particular set of 15-minute markets.</p>
      <ul>
        <li>We did not test a version driven by direct exchange spot feeds. The event study measures the index’s timing relative to the book; it does not measure the best obtainable spot signal.</li>
        <li>We did not test five-minute contracts or other venues. The settlement window, price structure, and execution rules may differ.</li>
        <li>The five-day replay and ten-hour local study are interim samples. The longer recording period is not included here.</li>
        <li>Parameters changed during the live run, and some analysis followed inspection of the data. Historical holdouts and bootstrap intervals do not make this a prospective randomized experiment.</li>
        <li>The replay assumes passive observation of a book our own orders do not change. Queue competition, withdrawals, partial fills, and fee rounding can affect the executable result.</li>
        <li>Per-second observations and different crypto assets share outcomes and market shocks. The effective amount of independent evidence is much smaller than the row count.</li>
      </ul>
    </section>

    <section aria-labelledby="conclusion">
      <h2 id="conclusion">Why we stopped</h2>
      <p>Our original criterion was straightforward: after a signal appeared, could we obtain a sufficiently favorable price before it disappeared, and still make money after fees?</p>
      <p>The experiment did not meet that criterion. Most of the measured quote adjustment preceded our index signal. Near expiry, high win rates came with prices close to the payout. Earlier entries exposed weaknesses in the model’s uncertainty estimate, selection, and correlated risk. The live ledger finished below zero.</p>
      <p><strong>Our strategy was reacting to a move the order book had already largely priced in.</strong></p>
      <p>We discontinued the strategy. What remained useful was the research process: recording and replay, explicit execution assumptions, event studies with placebo comparisons, and evaluation beyond the subset of trades we happened to take.</p>
    </section>
  </>;
}
