export function exportToCSV(data, filename = 'export.csv') {
  if (!data || !data.length) return;

  const escapeCSV = (str) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  // Define headers
  const headers = [
    'Agent Name',
    'Student Name',
    'Passport Number',
    'Institute Name',
    'Course/Program',
    'Processing Status',
    'EMGS Hold Remark',
    'Created At',
    'Currency',
    'Referrer Name',
    'Amount From Student',
    'Agent Commission',
    'University Payment',
    'Extra Income (Total)'
  ];

  // Map rows
  const rows = data.map((s) => {
    let extraIncomeTotal = 0;
    if (Array.isArray(s.extra_incomes)) {
      extraIncomeTotal = s.extra_incomes.reduce((sum, inc) => sum + (parseFloat(inc.amount) || 0), 0);
    } else if (typeof s.extra_incomes === 'string') {
      try {
        const parsed = JSON.parse(s.extra_incomes);
        extraIncomeTotal = parsed.reduce((sum, inc) => sum + (parseFloat(inc.amount) || 0), 0);
      } catch (e) {}
    }

    return [
      escapeCSV(s.agent_name || 'Self'),
      escapeCSV(s.name),
      escapeCSV(s.passport_number),
      escapeCSV(s.institute_name),
      escapeCSV(s.course_program),
      escapeCSV(s.processing_status),
      escapeCSV(s.emgs_hold_remark || ''),
      escapeCSV(new Date(s.created_at).toLocaleDateString()),
      escapeCSV(s.currency || 'RM'),
      escapeCSV(s.referrer_name || ''),
      escapeCSV(s.amount_from_student || 0),
      escapeCSV(s.agent_commission || 0),
      escapeCSV(s.university_payment || 0),
      escapeCSV(extraIncomeTotal)
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
