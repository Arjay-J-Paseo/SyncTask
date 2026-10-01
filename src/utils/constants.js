export const TEAM_TYPES = [
  'Startup',
  'University / School',
  'Personal / Side project',
  'Other'
];

export const TEAM_SIZES = ['1-5', '6-15', '15-50', '50-150'];

export const TEAM_SIZE_PLANS = {
  '1-5':    { plan: 'Free', required: false },
  '6-15':   { plan: 'Free', required: false },
  '15-50':  { plan: 'Plus', required: true  },
  '50-150': { plan: 'Pro',  required: true  }
};

export const PRIORITIES = ['low', 'medium', 'high'];
