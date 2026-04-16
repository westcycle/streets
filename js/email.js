/**
 * Email-your-mayor tool
 */

function getTitle(key) {
  return key && key.includes('SHIRE OF') ? 'Shire President' : 'Mayor';
}

const emailSelect = document.getElementById('lga-select');
Object.entries(COUNCIL_EMAILS)
  .map(([key, val]) => ({ key, ...val }))
  .sort((a, b) => a.name.localeCompare(b.name))
  .forEach(({ key, name }) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = name;
    emailSelect.appendChild(opt);
  });

function preselectEmailLGA(lgaName) {
  if (!lgaName) return;
  const upper = lgaName.toUpperCase();
  const match = Object.keys(COUNCIL_EMAILS).find(
    k => k.startsWith(upper + ',') || k.startsWith(upper + ' ')
  );
  if (match) {
    emailSelect.value = match;
    emailSelect.dispatchEvent(new Event('change'));
  }
}

emailSelect.addEventListener('change', () => {
  const key = emailSelect.value;
  if (!key) {
    document.getElementById('preview-box').style.display = 'none';
    document.getElementById('email-actions').style.display = 'none';
    document.getElementById('email-hint').style.display = 'none';
    return;
  }

  const council = COUNCIL_EMAILS[key];
  const title = getTitle(key);
  const isFormOnly = !council.email && council.formUrl;

  const subject = `For the attention of the ${title}, ${council.name}: please support safer streets for walking and riding`;
  const body = [
    `Dear ${title},`,
    '',
    `I am writing to ask that ${council.name} takes action to make our streets safer and more inviting for people who walk and ride.`,
    '',
    `Specifically, I ask that the council:`,
    '',
    `1. Reviews its current works program to prioritise footpath repairs, missing path connections, pram ramps, and safe crossings — particularly near schools, shops, and public transport stops.`,
    '',
    `2. Formally supports lowering the default speed limit on local streets in WA from 50 km/h to 30 km/h, and lobbies the State Government to make this change.`,
    '',
    'The evidence is clear: a person hit at 30 km/h has a 90% chance of survival. At 50 km/h, that drops to just 10%. In 1999, WA reduced the default from 60 to 50 km/h and saw a 20% reduction in crashes and 51% fewer pedestrian injuries.',
    '',
    'With over 12,500 km of local streets still at the 50 km/h default, changing this state-wide would be faster and cheaper than councils doing it one street at a time.',
    '',
    'Many of the actions that make streets safer — such as better footpaths, safe crossings, and clear sightlines — are already within council\'s control and budget. I encourage the council to prioritise these in its upcoming works programs.',
    '',
    'Yours sincerely,',
    '[YOUR NAME]',
  ].join('\n');

  document.getElementById('preview-subject').innerHTML =
    `<strong>To:</strong> ${council.email || council.name}<br><strong>Subject:</strong> ${subject}`;
  document.getElementById('preview-body').textContent = isFormOnly
    ? 'This council uses a web contact form. Open their contact page and paste your message.'
    : body;
  document.getElementById('preview-box').style.display = 'block';

  const mailBtn = document.getElementById('mailto-btn');
  mailBtn.href = council.email
    ? `mailto:${council.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : council.formUrl;
  mailBtn.textContent = isFormOnly ? 'Open contact page →' : 'Open in mail app →';
  if (isFormOnly) mailBtn.target = '_blank';

  document.getElementById('email-actions').style.display = 'flex';
  document.getElementById('email-hint').style.display = isFormOnly ? 'none' : 'block';

  document.getElementById('copy-btn').onclick = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`).then(() => {
      const btn = document.getElementById('copy-btn');
      btn.textContent = 'Copied ✓';
      setTimeout(() => (btn.textContent = 'Copy'), 2000);
    });
  };
});
