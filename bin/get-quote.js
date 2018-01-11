const request = require('request');

request.get("http://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en", (error, resp, body) => {
  if (error) {
    console.error("An error happened while fetching a quote.", error);
  }

  try {
    const json = JSON.parse(body.replace(/\'/gi,"'"));
    let position = json.quoteText.length + 4 - json.quoteAuthor.length;
    if (position <= 0) {
      position = 4;
    }

    if (position > 80) {
      position = 80;
    }

    console.log(`"${json.quoteText.trim()}"`);
    console.log(`${' '.repeat(position)}- ${json.quoteAuthor}`);
  } catch (e) {
    console.log('Sorry, no quote for you today.');
  }
});
