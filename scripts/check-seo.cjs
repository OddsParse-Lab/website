const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Check the actual export, not just metadata configuration or React source.
const output = path.join(__dirname, '../out');
const base = 'https://www.oddsparse.trade';
const routes = ['/', '/projects/', '/about/', '/blog/'];
const titles = new Set();
const descriptions = new Set();

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
}

for (const route of routes) {
  const html = fs.readFileSync(path.join(output, route, 'index.html'), 'utf8');
  const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
  const tags = [...head.matchAll(/<(?:meta|link)\b[^>]*>/g)].map(match => attributes(match[0]));
  const meta = key => tags.filter(tag => tag.name === key || tag.property === key).map(tag => tag.content);
  const canonicals = tags.filter(tag => tag.rel === 'canonical').map(tag => tag.href);
  assert.deepEqual(canonicals, [`${base}${route}`], `${route}: must have one self-referencing canonical`);
  assert.equal(meta('description').length, 1);
  assert.ok(meta('description')[0].length > 80);
  assert.deepEqual(meta('og:site_name'), ['OddsParse Lab']);
  assert.deepEqual(meta('og:url'), [`${base}${route}`]);
  assert.deepEqual(meta('og:description'), meta('description'));
  assert.deepEqual(meta('twitter:description'), meta('description'));
  assert.deepEqual(meta('og:image'), [`${base}/brand/logo.png`]);
  assert.ok(meta('robots').some(value => value.includes('index') && !value.includes('noindex')));
  const title = head.match(/<title>(.*?)<\/title>/)[1];
  assert.deepEqual(meta('og:title'), [title]);
  assert.deepEqual(meta('twitter:title'), [title]);
  titles.add(title);
  descriptions.add(meta('description')[0]);
  assert.equal((html.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);

  const data = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  const nodes = data.flatMap(node => node['@graph'] || [node]);
  assert.equal(nodes.filter(node => node['@type'] === 'Organization').length, 1);
  if (route === '/') {
    const websites = nodes.filter(node => node['@type'] === 'WebSite');
    assert.equal(websites.length, 1);
    assert.equal(websites[0].name, 'OddsParse Lab');
    assert.equal(websites[0].alternateName, 'OddsParse');
    assert.equal(websites[0].url, `${base}/`);
  } else {
    const page = nodes.find(node => node['@type'] === (route === '/about/' ? 'AboutPage' : 'CollectionPage'));
    assert.equal(page.url, `${base}${route}`);
    const breadcrumbs = nodes.find(node => node['@type'] === 'BreadcrumbList');
    assert.deepEqual(breadcrumbs.itemListElement.map(item => item.item), [`${base}/`, `${base}${route}`]);
  }

  if (route === '/projects/') {
    const names = ['Chronallax', 'Echo', 'Heimdall', 'Torsion', 'Parallax'];
    const details = ['Average daily return', 'Development-stage result', 'Time-decayed information weighting.', 'Combined annualized return', 'Semantic market matching.'];
    const list = nodes.find(node => node['@type'] === 'ItemList');
    assert.deepEqual(list.itemListElement.map(entry => entry.item.name), names);
    names.forEach((name, index) => {
      const panel = html.match(new RegExp(`<section\\b[^>]*id="project-panel-${index}"[^>]*>[\\s\\S]*?<\\/section>`))?.[0];
      assert.ok(panel, `${name}: exported panel must exist`);
      assert.ok(panel.includes(`<h2>${name}</h2>`), `${name}: content must render without clicking or JavaScript`);
      assert.ok(panel.includes(`${String(index + 1).padStart(2, '0')}<!-- --> / <!-- -->05`), `${name}: correct project counter`);
      assert.ok(!panel.includes('Live performance data will be published here.'));
      assert.ok(panel.includes(`<span class="project-status-badge">${name === 'Chronallax' ? 'Live' : 'Archived'}</span>`));
      if (name === 'Chronallax') {
        assert.match(panel, /<span class="result-label">Average daily return<\/span>/);
        assert.ok(!panel.includes('21.36'), 'Do not present an old static return as live data');
        for (const metric of ['39.3', '3.2', '98,408', 'p50', 'Loading performance data', 'Cumulative return', 'peak capital in use']) assert.ok(panel.includes(metric));
      }
      assert.ok(panel.includes(details[index]), `${name}: full detail must be in exported HTML`);
      assert.equal(/\bhidden=""/.test(panel), index !== 0, `${name}: preserve initial tab visibility`);
    });
  }
  console.log(`PASS ${route}: metadata, canonical, schema, and exported content`);
}

assert.equal(titles.size, routes.length, 'Every page needs its own title');
assert.equal(descriptions.size, routes.length, 'Every page needs its own description');
const sitemap = fs.readFileSync(path.join(output, 'sitemap.xml'), 'utf8');
assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]).sort(), [...routes, '/blog/one-second-behind/'].map(route => `${base}${route}`).sort());
const robots = fs.readFileSync(path.join(output, 'robots.txt'), 'utf8');
assert.match(robots, /User-Agent: \*/i);
assert.match(robots, /Allow: \/\s/);
assert.ok(robots.includes(`Sitemap: ${base}/sitemap.xml`));
assert.ok(!/Disallow:\s*\/(?:\s|$)/i.test(robots));
assert.ok(fs.existsSync(path.join(output, 'brand/logo.png')));
console.log('PASS sitemap, robots.txt, and public brand image');

const blog = fs.readFileSync(path.join(output, 'blog/index.html'), 'utf8');
const articleLinks = [...new Set([...blog.matchAll(/href="(\/blog\/[^"/]+\/)"/g)].map(match => match[1]))];
assert.deepEqual(articleLinks, ['/blog/one-second-behind/']);
assert.ok(!blog.includes('Sample articles'));
assert.equal([...blog.matchAll(/href="(\/blog\/[^"/]+\/)"/g)].length, articleLinks.length, 'The newest article must not repeat in the archive grid');
assert.ok(!blog.includes('journal-kicker'));
const blogNodes = [...blog.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .flatMap(match => { const node = JSON.parse(match[1]); return node['@graph'] || [node]; });
const blogList = blogNodes.find(node => node['@type'] === 'ItemList');
assert.equal(blogList.numberOfItems, articleLinks.length);
assert.deepEqual(blogList.itemListElement.map(entry => entry.item.url), articleLinks.map(route => `${base}${route}`));
assert.equal(blogNodes.find(node => node['@type'] === 'CollectionPage').mainEntity['@id'], blogList['@id']);
const postDates = [...blog.matchAll(/<time dateTime="([^"]+)"/g)].map(match => match[1]);
assert.equal(postDates.length, articleLinks.length);
assert.deepEqual(postDates, [...postDates].sort().reverse(), 'Blog articles should be newest first');
for (const route of articleLinks) {
  const html = fs.readFileSync(path.join(output, route, 'index.html'), 'utf8');
  assert.ok(!/name="(?:robots|googlebot)" content="[^"]*noindex/.test(html));
  assert.ok(!html.includes('Draft preview'));
  assert.ok(!/polytest|a friend|friend’s experiment|Sample content/i.test(html));
  assert.ok(html.includes('approximately ten-hour local event-study sample'));
  assert.ok(html.includes('unrounded per-contract approximation'));
  assert.ok(html.includes('<math xmlns="http://www.w3.org/1998/Math/MathML"'), 'Equations must render as accessible math in static HTML');
  assert.ok(!html.includes('class="katex-error"'), 'No equation should fall back to a rendering error');
  assert.ok(html.includes('−$26.16'));
  assert.ok(html.includes('1,029 / 935'));
  assert.ok(!html.includes('class="journal-next"'), 'A single article must not link to itself as the next article');
  const data = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  const nodes = data.flatMap(node => node['@graph'] || [node]);
  const article = nodes.find(node => node['@type'] === 'BlogPosting');
  assert.equal(article.url, `${base}${route}`);
  assert.equal(article.author['@type'], 'Person');
  assert.equal(article.author.name, 'Kevin Z');
  assert.equal(article.author.jobTitle, 'Quantitative Researcher');
  assert.equal(article.author.affiliation.name, 'OddsParse Lab');
  assert.equal(article.author.affiliation['@id'], `${base}/#organization`);
  assert.equal(html.match(/<span class="journal-author-name">(.*?)<\/span>/)?.[1], article.author.name);
  assert.ok(!/<a\b[^>]*class="journal-author"/.test(html));
  const page = nodes.find(node => node['@type'] === 'WebPage');
  assert.equal(article.mainEntityOfPage['@id'], page['@id']);
  assert.equal(page.mainEntity['@id'], article['@id']);
  assert.equal(page.breadcrumb['@id'], nodes.find(node => node['@type'] === 'BreadcrumbList')['@id']);
  assert.equal(article.isAccessibleForFree, true);
  const minutes = Number(article.timeRequired.match(/^PT(\d+)M$/)?.[1]);
  assert.ok(minutes > 0);
  assert.ok(html.includes(`Estimated reading time: ${minutes} minutes`));
  const sitemapEntry = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].find(match => match[1].includes(`<loc>${base}${route}</loc>`));
  assert.ok(sitemapEntry[1].includes(`<lastmod>${article.datePublished}</lastmod>`));
  assert.ok(html.includes('We spent two weeks testing a spot-lag trading strategy'), 'Article text must be present in static HTML');
  const meta = [...html.matchAll(/<meta\b[^>]*>/g)].map(match => attributes(match[0]));
  const values = key => meta.filter(tag => tag.name === key || tag.property === key).map(tag => tag.content);
  const title = html.match(/<title>(.*?)<\/title>/)[1];
  const heading = html.match(/<h1(?:\s[^>]*)?>(.*?)<\/h1>/)[1].replace(/<[^>]*>/g, '');
  assert.equal(article.headline, heading, 'Visible headline and article schema must agree');
  assert.equal(title, `${heading} - OddsParse Lab`);
  assert.deepEqual(values('og:title'), [title]);
  assert.deepEqual(values('twitter:title'), [title]);
  assert.deepEqual(values('description'), [article.description]);
  assert.deepEqual(values('og:description'), values('description'));
  assert.deepEqual(values('twitter:description'), values('description'));
  assert.ok(meta.some(tag => tag.property === 'og:type' && tag.content === 'article'));
  assert.ok(meta.some(tag => tag.property === 'article:published_time' && tag.content === article.datePublished));
  assert.ok(meta.some(tag => tag.name === 'twitter:card' && tag.content === 'summary_large_image'));
  assert.ok(fs.existsSync(path.join(output, article.image.replace(base, ''))));
  const figures = [...html.matchAll(/<figure\b[\s\S]*?<\/figure>/g)].map(match => match[0]);
  assert.equal(figures.length, 5);
  assert.equal(figures.join('').match(/<canvas\b/g).length, 6);
  for (const figure of figures) {
    const canvas = attributes(figure.match(/<canvas\b[^>]*>/)[0]);
    assert.equal(canvas.role, 'img');
    assert.ok(canvas['aria-label'].length > 40);
    assert.ok(figure.includes('<figcaption>'));
    assert.ok(!figure.includes('View data'));
    assert.ok(figure.includes('class="sr-only"'));
    assert.ok(figure.includes('<table>'), 'Chart data remains accessible without Canvas or JavaScript');
    assert.ok(!figure.includes('.svg'));
  }
  assert.ok(html.includes(`rel="canonical" href="${base}${route}"`));
  assert.ok(html.includes('href="/blog/"'));
  assert.equal((html.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
  assert.ok(sitemap.includes(`${base}${route}`), 'The real research article belongs in the sitemap');
}
console.log('PASS research article, figures, structured data, and indexing');
