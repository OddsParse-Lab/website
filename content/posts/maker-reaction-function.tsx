export const makerReactionSource = {
  url: "https://imfuyuqiu.com/blog/maker-reaction-function/",
  name: "做市商的反应函数：以 CME 为外生时钟的逆向研究",
  inLanguage: "zh",
  datePublished: "2026-10-30",
};

export function MakerReactionArticle() {
  return <>
    <p>Using CME futures as an external clock, this study examines how prediction-market makers cancel, reprice, and replenish quotes. Event studies with time-shifted controls show that, in the markets studied, much of the apparently stale liquidity disappears before a taker using public data can reach it. Quotes that remain can be adversely selected: slower repricing does not by itself imply a profitable trade. The article also explores order-size signatures, replenishment rhythms, and brief pricing inconsistencies during batch updates, while distinguishing observed behavior from assumptions about individual market makers.</p>
    <p className="journal-source-note">This is an English summary. The full article was originally published in Chinese on October 30, 2026.<br /><a href={makerReactionSource.url}>Read the original article (Chinese)</a><span className="journal-source-credit">Cover image from the original article.</span></p>
  </>;
}
