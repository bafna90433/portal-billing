export const convertNumberToWords = (amount: number): string => {
  if (amount === 0) return 'INR Zero Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teenDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const doubleDigits = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanThousand = (num: number): string => {
    let str = '';
    if (num >= 100) {
      str += singleDigits[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 10 && num < 20) {
      str += teenDigits[num - 10] + ' ';
    } else if (num >= 20) {
      str += doubleDigits[Math.floor(num / 10)] + ' ';
      if (num % 10 > 0) {
        str += singleDigits[num % 10] + ' ';
      }
    } else if (num > 0) {
      str += singleDigits[num] + ' ';
    }
    return str;
  };

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let rupeesStr = '';
  let tempRupees = rupees;

  if (tempRupees >= 10000000) { // Crores
    rupeesStr += convertLessThanThousand(Math.floor(tempRupees / 10000000)) + 'Crore ';
    tempRupees %= 10000000;
  }
  if (tempRupees >= 100000) { // Lakhs
    rupeesStr += convertLessThanThousand(Math.floor(tempRupees / 100000)) + 'Lakh ';
    tempRupees %= 100000;
  }
  if (tempRupees >= 1000) { // Thousands
    rupeesStr += convertLessThanThousand(Math.floor(tempRupees / 1000)) + 'Thousand ';
    tempRupees %= 1000;
  }
  if (tempRupees > 0) {
    rupeesStr += convertLessThanThousand(tempRupees);
  }

  rupeesStr = rupeesStr.trim();
  if (!rupeesStr) rupeesStr = 'Zero';

  let paiseStr = '';
  if (paise > 0) {
    paiseStr = 'and ' + convertLessThanThousand(paise).trim() + ' paise';
  }

  return `INR ${rupeesStr} ${paiseStr} Only`.replace(/\s+/g, ' ');
};
