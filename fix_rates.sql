UPDATE transactions 
SET amount_base = ROUND(amount * (
  SELECT rate FROM exchange_rates 
  WHERE from_currency = 'USD' AND to_currency = 'TRY' 
  ORDER BY rate_date DESC LIMIT 1
), 4),
exchange_rate = (
  SELECT rate FROM exchange_rates 
  WHERE from_currency = 'USD' AND to_currency = 'TRY' 
  ORDER BY rate_date DESC LIMIT 1
)
WHERE currency = 'USD' AND exchange_rate < 2;
