import https from 'https';

export async function fetchTCMBRates() {
    return new Promise((resolve, reject) => {
        https.get('https://www.tcmb.gov.tr/kurlar/today.xml', (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const rates = {};
                    const currencyBlocks = data.match(/<Currency[^>]*>[\s\S]*?<\/Currency>/g) || [];

                    currencyBlocks.forEach(block => {
                        const codeMatch = block.match(/CurrencyCode="([^"]+)"/);
                        const sellingMatch = block.match(/<ForexSelling>([^<]+)<\/ForexSelling>/);
                        const buyingMatch = block.match(/<ForexBuying>([^<]+)<\/ForexBuying>/);
                        const nameMatch = block.match(/<Isim>([^<]+)<\/Isim>/);
                        const unitMatch = block.match(/<Unit>([^<]+)<\/Unit>/);

                        if (codeMatch && (sellingMatch || buyingMatch)) {
                            const code = codeMatch[1];
                            const unit = parseInt(unitMatch ? unitMatch[1] : '1');
                            rates[code] = {
                                code,
                                name: nameMatch ? nameMatch[1] : code,
                                buying: parseFloat(buyingMatch ? buyingMatch[1] : '0') / unit,
                                selling: parseFloat(sellingMatch ? sellingMatch[1] : '0') / unit,
                            };
                        }
                    });

                    // Add TRY as base
                    rates['TRY'] = { code: 'TRY', name: 'TÜRK LİRASI', buying: 1, selling: 1 };

                    resolve(rates);
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}
