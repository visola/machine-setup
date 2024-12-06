const http = require('node:https');

const get = (url) => {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {        
            let data = '';
            res.on('data', (d) => data += d);
            res.on('close', () => resolve(JSON.parse(data)));
        });

        req.on('error', reject);
    });
};

const API_KEY = process.env['FMP_API_KEY'];

if (!API_KEY) {
    throw new Error('API key not found in env var FMP_API_KEY')
}

const groupByYear = (dividends) => {
    const byYear = {};
    dividends.forEach((item) => {
        const d = new Date(item.date);
        byYear[d.getFullYear()] = (byYear[d.getFullYear()] || 0) + item.dividend;
    });
    return byYear;
};

const roundNumber = (number) => {
    if (!number) {
        return '0.00';
    }

    return Math.round(number * 100) / 100 + '';
}

const main = async () => {
    const today = new Date();
    const lastYear = today.getFullYear() - 1;
    const TICKERS_TO_ANALYZE = ['JEPQ', 'KBWD', 'SDIV', 'XYLD'];
    for (let ticker of TICKERS_TO_ANALYZE) {
        const history = await get(`https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${ticker}?apikey=${API_KEY}`);
        const groupedByYear = groupByYear(history.historical);
        const lastRecordDate = history.historical[0].recordDate;
        
        const priceData = await get(`https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${API_KEY}`);
        const price = priceData[0].price;
        const lastYearDividends = groupedByYear[lastYear];

        let message = `${ticker}:`;
        message += ` ${roundNumber(lastYear)} total dividends = ${roundNumber(lastYearDividends)}`;
        message += `, price = ${roundNumber(price)}`;
        message += `, yield = ${roundNumber(100 * lastYearDividends / price)}%`;
        message += `, last record date: ${lastRecordDate}`;

        console.log(message);
    }
};

main();
