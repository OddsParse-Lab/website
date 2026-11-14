import { SiteShell } from "@/components/site-shell";
import { StructuredData } from "@/components/structured-data";
import { pageMetadata, pageSchema, site } from "@/lib/site";
import { ConnectionStudy } from "./connection-study";
import styles from "./contact.module.css";

const description = "Contact OddsParse Lab to discuss prediction markets, quantitative research, trading technology, and potential collaborations. Reach us at team@oddsparse.trade.";
export const metadata = pageMetadata("Contact", description, "/contact/");

export default function Contact() {
  return <SiteShell activePage="contact">
    <StructuredData data={pageSchema("ContactPage", "Contact", description, "/contact/")} />
    <main id="main" className={styles.contact}>
      <div className={styles.opening}>
        <div className={styles.introduction}>
          <h1>An exchange<br /><em>of ideas.</em></h1>
          <p>Connect with us on markets, models, and the systems that bring them together.</p>
        </div>
        <div className={styles.artwork}><ConnectionStudy /></div>
      </div>
      <div className={styles.correspondence}>
        <div className={styles.address}>
          <span className={styles.label}>Start a conversation</span>
          <a className={styles.email} href={`mailto:${site.email}`}>{site.email}</a>
        </div>
        <div className={styles.invitation}>
          <p>We consider investment from funds and strategic partners, as well as integrations with trading venues and infrastructure providers.</p>
          <p>We’re not actively hiring, but are open to strategy collaborations involving capital, execution infrastructure, and profit-sharing arrangements.</p>
        </div>
      </div>
    </main>
  </SiteShell>;
}
