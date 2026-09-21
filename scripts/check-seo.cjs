const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Check the actual export, not just metadata configuration or React source.
const output = path.join(__dirname, '../out');
const base = 'https://www.oddsparse.trade';
const routes = ['/', '/projects/', '/about/'];
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
    const names = ['Echo', 'Heimdall', 'Torsion', 'Parallax'];
    const details = ['Development-stage result', 'Time-decayed information weighting.', 'Combined annualized return', 'Semantic market matching.'];
    const list = nodes.find(node => node['@type'] === 'ItemList');
    assert.deepEqual(list.itemListElement.map(entry => entry.item.name), names);
    names.forEach((name, index) => {
      const panel = html.match(new RegExp(`<section\\b[^>]*id="project-panel-${index}"[^>]*>[\\s\\S]*?<\\/section>`))?.[0];
      assert.ok(panel, `${name}: exported panel must exist`);
      assert.ok(panel.includes(`<h2>${name}</h2>`), `${name}: content must render without clicking or JavaScript`);
      assert.ok(panel.includes(details[index]), `${name}: full detail must be in exported HTML`);
      assert.equal(/\bhidden=""/.test(panel), index !== 0, `${name}: preserve initial tab visibility`);
    });
  }
  console.log(`PASS ${route}: metadata, canonical, schema, and exported content`);
}

assert.equal(titles.size, routes.length, 'Every page needs its own title');
assert.equal(descriptions.size, routes.length, 'Every page needs its own description');
const sitemap = fs.readFileSync(path.join(output, 'sitemap.xml'), 'utf8');
assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]).sort(), routes.map(route => `${base}${route}`).sort());
const robots = fs.readFileSync(path.join(output, 'robots.txt'), 'utf8');
assert.match(robots, /User-Agent: \*/i);
assert.match(robots, /Allow: \/\s/);
assert.ok(robots.includes(`Sitemap: ${base}/sitemap.xml`));
assert.ok(!/Disallow:\s*\/(?:\s|$)/i.test(robots));
assert.ok(fs.existsSync(path.join(output, 'brand/logo.png')));
console.log('PASS sitemap, robots.txt, and public brand image');
