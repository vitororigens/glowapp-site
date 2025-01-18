type FormatterProps = {
  showCurrencyCode?: boolean;
};

class CurrencyFormatter {
  static formatter(price: number, { showCurrencyCode = true }: FormatterProps) {
    const currencyCode = 'BRL';
    const locale = 'pt-BR';

    const options: Intl.NumberFormatOptions = showCurrencyCode
      ? { style: 'currency', currency: currencyCode }
      : { style: 'decimal' };

    return new Intl.NumberFormat(locale, options).format(price);
  }
}

export default CurrencyFormatter;
